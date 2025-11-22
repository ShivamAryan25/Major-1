"use client";

import { useState } from "react";
import { Search, ArrowLeft, ExternalLink, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

interface ScrapingResult {
  text: string;
  source: string;
}

interface ScrapingResponse {
  query: string;
  total_links_found: number;
  pages_scraped: number;
  total_chunks: number;
  results: ScrapingResult[];
  error?: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function SentimentAnalysisPage() {
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapingResult[]>([]);
  const [metadata, setMetadata] = useState<{
    query: string;
    total_links: number;
    pages_scraped: number;
    total_chunks: number;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    setError(null);
    setResults([]);
    setMetadata(null);

    try {
      const response = await fetch(`${API_BASE_URL}/scrape`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query: query.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from server");
      }

      const data: ScrapingResponse = await response.json();
      
      if (data.error) {
        setError(data.error);
      } else {
        setResults(data.results);
        setMetadata({
          query: data.query,
          total_links: data.total_links_found,
          pages_scraped: data.pages_scraped,
          total_chunks: data.total_chunks,
        });
      }
    } catch (error) {
      console.error("Error searching:", error);
      setError("Sorry, we encountered an error while searching. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full px-6 py-12 overflow-hidden">
      {/* Back Button */}
      <div className="absolute top-6 left-6 z-20">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-[#3A4F3A] hover:text-[#2A3F2A] transition-colors duration-200 group bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full shadow-sm"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-200" />
          <span className="font-light">Back to Home</span>
        </Link>
      </div>

      {/* Main Content */}
      <div className="relative z-10 w-full max-w-5xl mx-auto pt-16">
        {/* Header */}
        <div className="text-center mb-12 space-y-3">
          <h1 className="text-5xl md:text-6xl font-light text-[#3A4F3A] tracking-tight leading-tight">
            Sentiment Analysis
          </h1>
          <p className="text-lg font-light text-[#6B8E6B] tracking-wide">
            Search the web for insights on any topic
          </p>
        </div>

        {/* Search Form */}
        <form onSubmit={handleSearch} className="mb-12">
          <div className="flex gap-3 items-center max-w-3xl mx-auto">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Enter a topic to search (e.g., 'mental health tips')..."
              className="flex-1 px-6 py-4 rounded-full bg-white/70 backdrop-blur-sm border border-[#b8d4c6]/30 focus:outline-none focus:border-[#b8d4c6] text-[#3A4F3A] placeholder:text-[#6B8E6B]/60 font-light shadow-md transition-all duration-200"
            />
            <button
              type="submit"
              disabled={isLoading}
              className="w-14 h-14 bg-[#b8d4c6] hover:bg-[#a8c4b6] text-[#2A3F2A] rounded-full transition-all duration-200 flex items-center justify-center shadow-md hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>
        </form>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-12">
            <div className="inline-flex items-center gap-3 text-[#6B8E6B]">
              <Loader2 className="w-6 h-6 animate-spin" />
              <span className="font-light">
                Searching and analyzing content...
              </span>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-50/70 backdrop-blur-sm border border-red-200 rounded-2xl p-6 text-center">
              <p className="text-red-800 font-light">{error}</p>
            </div>
          </div>
        )}

        {/* Metadata */}
        {metadata && !isLoading && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <div className="text-2xl font-light text-[#3A4F3A]">
                    {metadata.total_links}
                  </div>
                  <div className="text-xs text-[#6B8E6B] font-light">
                    Links Found
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-light text-[#3A4F3A]">
                    {metadata.pages_scraped}
                  </div>
                  <div className="text-xs text-[#6B8E6B] font-light">
                    Pages Analyzed
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-light text-[#3A4F3A]">
                    {metadata.total_chunks}
                  </div>
                  <div className="text-xs text-[#6B8E6B] font-light">
                    Content Chunks
                  </div>
                </div>
                <div>
                  <div className="text-2xl font-light text-[#3A4F3A]">
                    {results.length}
                  </div>
                  <div className="text-xs text-[#6B8E6B] font-light">
                    Top Results
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {results.length > 0 && !isLoading && (
          <div className="space-y-6 max-w-4xl mx-auto">
            <h2 className="text-2xl font-light text-[#3A4F3A] mb-6 text-center">
              Top Relevant Results
            </h2>
            
            {results.map((result, index) => (
              <div
                key={index}
                className="bg-white/50 backdrop-blur-sm rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 group"
              >
                {/* Content */}
                <div className="mb-4">
                  <div className="flex items-start gap-3 mb-3">
                    <BookOpen className="w-5 h-5 text-[#6B8E6B] mt-1 flex-shrink-0" />
                    <p className="text-[#3A4F3A] leading-relaxed font-light flex-1">
                      {result.text}
                    </p>
                  </div>
                </div>

                {/* Source Link */}
                <a
                  href={result.source}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 text-sm text-[#6B8E6B] hover:text-[#3A4F3A] transition-colors duration-200"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="font-light truncate max-w-md">
                    {result.source}
                  </span>
                </a>
              </div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && results.length === 0 && !metadata && (
          <div className="text-center py-12">
            <div className="w-24 h-24 bg-[#b8d4c6]/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <Search className="w-12 h-12 text-[#6B8E6B]" />
            </div>
            <h3 className="text-xl font-light text-[#3A4F3A] mb-2">
              Start Your Search
            </h3>
            <p className="text-[#6B8E6B] font-light">
              Enter a topic above to discover relevant content from across the web
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

