"""
Web Scraping and RAG Pipeline
Integrates all scraping functionality into a unified API
"""

from serpapi import GoogleSearch
import trafilatura
from bs4 import BeautifulSoup
import requests
import tiktoken
from fastembed import TextEmbedding
import faiss
import numpy as np
import json
import os
from typing import List, Dict, Optional
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "d02f0cdb837e62b4119fa3f92882c0f17271190b75ce0bfd1609b311009905cc")
MAX_TOKENS_PER_CHUNK = 512
MAX_RESULTS_TO_SCRAPE = 5

class WebScraperRAG:
    """Web scraper with RAG (Retrieval Augmented Generation) capabilities"""
    
    def __init__(self):
        self.embedding_model = None
        self.index = None
        self.data = []
        
    def _get_embedding_model(self):
        """Lazy load embedding model"""
        if self.embedding_model is None:
            self.embedding_model = TextEmbedding()
        return self.embedding_model
    
    def retrieve_links(self, query: str, max_results: int = 10) -> List[Dict]:
        """Step 1: Retrieve links from Google using SerpAPI"""
        try:
            params = {
                "engine": "google",
                "q": query,
                "api_key": SERPAPI_KEY,
                "num": max_results
            }
            
            search = GoogleSearch(params)
            results = search.get_dict()
            organic_results = results.get("organic_results", [])
            
            logger.info(f"Retrieved {len(organic_results)} links for query: {query}")
            return organic_results
        
        except Exception as e:
            logger.error(f"Error retrieving links: {e}")
            return []
    
    def extract_data(self, links: List[str]) -> List[Dict]:
        """Step 2: Extract text content from URLs"""
        data = []
        
        for url in links[:MAX_RESULTS_TO_SCRAPE]:  # Limit scraping
            try:
                logger.info(f"Scraping: {url}")
                html = requests.get(url, timeout=10).text
                soup = BeautifulSoup(html, "html.parser")
                
                # Remove code blocks
                for tag in soup.find_all(["pre", "code"]):
                    tag.decompose()
                clean_html = str(soup)
                
                # Extract pure text
                pure_text = trafilatura.extract(clean_html)
                
                if pure_text:
                    data.append({"link": url, "text": pure_text})
            
            except Exception as e:
                logger.error(f"Error scraping {url}: {e}")
                continue
        
        logger.info(f"Successfully scraped {len(data)} pages")
        return data
    
    def chunk_text(self, text: str, max_tokens: int = MAX_TOKENS_PER_CHUNK) -> List[str]:
        """Step 3: Chunk text into smaller pieces"""
        try:
            enc = tiktoken.get_encoding("cl100k_base")
            tokens = enc.encode(text)
            
            chunks = []
            for i in range(0, len(tokens), max_tokens):
                chunk = enc.decode(tokens[i:i+max_tokens])
                chunks.append(chunk)
            
            return chunks
        except Exception as e:
            logger.error(f"Error chunking text: {e}")
            return []
    
    def generate_embeddings(self, chunked_data: List[Dict]) -> List[Dict]:
        """Step 4: Generate embeddings for chunks"""
        model = self._get_embedding_model()
        embeddings = []
        
        for item in chunked_data:
            link = item["link"]
            text_chunks = item["text"]
            
            for chunk in text_chunks:
                try:
                    em = list(model.embed(chunk))[0].tolist()
                    embeddings.append({
                        "link": link,
                        "embedding": em,
                        "original": chunk
                    })
                except Exception as e:
                    logger.error(f"Error generating embedding: {e}")
                    continue
        
        logger.info(f"Generated {len(embeddings)} embeddings")
        return embeddings
    
    def create_vector_store(self, embeddings: List[Dict]) -> faiss.Index:
        """Step 5: Create FAISS vector store"""
        vectors = [item["embedding"] for item in embeddings]
        vectors = np.array(vectors).astype("float32")
        
        dimension = vectors.shape[1]
        index = faiss.IndexFlatL2(dimension)
        index.add(vectors)
        
        self.index = index
        self.data = embeddings
        
        logger.info(f"Created FAISS index with {vectors.shape[0]} vectors")
        return index
    
    def retrieve_relevant_data(self, query: str, k: int = 5) -> List[Dict]:
        """Step 6: Retrieve relevant data based on query"""
        if self.index is None or not self.data:
            return []
        
        try:
            model = self._get_embedding_model()
            query_vec = list(model.embed(query))[0].astype("float32")
            
            D, I = self.index.search(np.array([query_vec]), k)
            
            results = []
            for idx in I[0]:
                if idx < len(self.data):
                    results.append({
                        "text": self.data[idx]["original"],
                        "source": self.data[idx]["link"]
                    })
            
            return results
        
        except Exception as e:
            logger.error(f"Error retrieving data: {e}")
            return []
    
    def full_pipeline(self, query: str, retrieval_query: Optional[str] = None) -> Dict:
        """Execute full RAG pipeline"""
        try:
            # Step 1: Retrieve links
            search_results = self.retrieve_links(query)
            if not search_results:
                return {"error": "No search results found", "results": []}
            
            links = [item["link"] for item in search_results]
            
            # Step 2: Extract data
            extracted_data = self.extract_data(links)
            if not extracted_data:
                return {"error": "Could not extract data from any links", "results": []}
            
            # Step 3: Chunk text
            chunked_data = []
            for item in extracted_data:
                text = item["text"]
                url = item["link"]
                chunked_text = self.chunk_text(text)
                
                if chunked_text:
                    chunked_data.append({
                        "link": url,
                        "text": chunked_text
                    })
            
            # Step 4: Generate embeddings
            embeddings = self.generate_embeddings(chunked_data)
            
            # Step 5: Create vector store
            self.create_vector_store(embeddings)
            
            # Step 6: Retrieve relevant data
            retrieval_q = retrieval_query or query
            relevant_results = self.retrieve_relevant_data(retrieval_q, k=5)
            
            return {
                "query": query,
                "total_links_found": len(search_results),
                "pages_scraped": len(extracted_data),
                "total_chunks": len(embeddings),
                "results": relevant_results
            }
        
        except Exception as e:
            logger.error(f"Pipeline error: {e}")
            return {"error": str(e), "results": []}


# Global instance
scraper_instance = WebScraperRAG()

