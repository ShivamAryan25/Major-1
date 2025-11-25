"""
Production-Ready Emotion-Aware AI Chatbot Backend
FastAPI + Gemini + HuggingFace + YouTube API + Web Scraping RAG
"""

from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import pipeline
import google.generativeai as genai
from googleapiclient.discovery import build
from typing import Optional, List, Dict
import os
import uuid
from datetime import datetime
from scraper import scraper_instance
from depression_predictor import depression_predictor
from voice_emotion_predictor import voice_emotion_predictor
import tempfile
import shutil

# ============================================================================
# CONFIGURATION
# ============================================================================

app = FastAPI(
    title="Emotion-Aware Chatbot API",
    description="AI chatbot with emotion detection and personalized responses",
    version="1.0.0"
)

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API Keys (Set these as environment variables)
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY","")
YOUTUBE_API_KEY = os.getenv("YOUTUBE_API_KEY","")

# Initialize Gemini
genai.configure(api_key=GEMINI_API_KEY)
gemini_model = genai.GenerativeModel('gemini-2.5-flash')

# Initialize Emotion Detection Model (Lazy Loading)
emotion_classifier = None

def get_emotion_classifier():
    """Lazy load the emotion classifier"""
    global emotion_classifier
    if emotion_classifier is None:
        emotion_classifier = pipeline(
            "text-classification",
            model="bhadresh-savani/distilbert-base-uncased-emotion",
            top_k=1
        )
    return emotion_classifier

# ============================================================================
# SESSION MANAGEMENT
# ============================================================================

class SessionData:
    """Store session-specific data for each user"""
    def __init__(self):
        self.last_emotion = "neutral"
        self.message_count_since_last_emotion = 0
        self.conversation_history = []
        self.created_at = datetime.now()

# In-memory session store (use Redis for production)
sessions = {}

def get_or_create_session(session_id: Optional[str]) -> tuple[str, SessionData]:
    """Get existing session or create new one"""
    if not session_id or session_id not in sessions:
        session_id = str(uuid.uuid4())
        sessions[session_id] = SessionData()
    return session_id, sessions[session_id]

# ============================================================================
# MODELS
# ============================================================================

class ChatRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class VideoRecommendation(BaseModel):
    title: str
    video_id: str
    thumbnail: str
    url: str

class ChatResponse(BaseModel):
    response: str
    emotion: str
    video_recommendations: list[VideoRecommendation]
    message_count: int
    session_id: str
    emotion_updated: bool

class ScrapingRequest(BaseModel):
    query: str
    retrieval_query: Optional[str] = None

class ScrapingResult(BaseModel):
    text: str
    source: str

class ScrapingResponse(BaseModel):
    query: str
    total_links_found: int
    pages_scraped: int
    total_chunks: int
    results: List[ScrapingResult]
    error: Optional[str] = None

class DepressionPredictionRequest(BaseModel):
    Age: int
    Academic_Pressure: int
    Study_Satisfaction: int
    Work_Study_Hours: int
    Financial_Stress: int
    Sleep_Duration: str
    Dietary_Habits: str
    Suicidal_Thoughts: str

class Recommendation(BaseModel):
    message: str
    level: str
    resources: List[str]

class DepressionPredictionResponse(BaseModel):
    depression_probability: float
    prediction_message: str
    recommendations: Recommendation

class EmotionProbability(BaseModel):
    emotion: str
    emoji: str
    probability: float

class VoiceEmotionResponse(BaseModel):
    emotion: str
    emoji: str
    description: str
    confidence: float
    all_probabilities: Dict[str, float]
    top_emotions: List[EmotionProbability]

# ============================================================================
# EMOTION DETECTION
# ============================================================================

def detect_emotion(text: str) -> str:
    """Detect emotion using HuggingFace model"""
    try:
        classifier = get_emotion_classifier()
        result = classifier(text)[0]
        emotion = result[0]['label']
        return emotion
    except Exception as e:
        print(f"Emotion detection error: {e}")
        return "neutral"

# ============================================================================
# TONE MAPPING
# ============================================================================

EMOTION_TONE_MAP = {
    "sadness": "soft, comforting, and deeply empathetic. Show understanding and provide gentle encouragement.",
    "joy": "warm, enthusiastic, and celebratory. Share in their happiness with positive energy.",
    "anger": "calming, grounding, and patient. Help them process feelings constructively without judgment.",
    "fear": "gentle, reassuring, and supportive. Provide comfort and help them feel safe and understood.",
    "love": "kind, warm, and genuinely supportive. Reflect their positive emotions with care.",
    "surprise": "bright, energetic, and engaging. Match their excitement and curiosity.",
    "neutral": "friendly, balanced, and conversational. Be helpful and naturally engaging."
}

def get_system_prompt(emotion: str) -> str:
    """Generate tone-controlled system prompt based on emotion"""
    tone = EMOTION_TONE_MAP.get(emotion, EMOTION_TONE_MAP["neutral"])
    
    return f"""You are an emotionally intelligent AI assistant. The user is currently feeling {emotion}.

Your communication style should be {tone}

Guidelines:
- Respond naturally and conversationally
- Keep responses concise but meaningful (2-4 sentences)
- Show emotional awareness without being overly clinical
- Be authentic and human-like in your responses
- Adapt your language to match the emotional context

Remember: You're here to be helpful and supportive while respecting the user's emotional state."""

# ============================================================================
# GEMINI CHAT
# ============================================================================

def generate_gemini_response(message: str, emotion: str, history: list) -> str:
    """Generate response using Gemini with emotion-aware prompting"""
    try:
        system_prompt = get_system_prompt(emotion)
        
        # Build conversation context
        context = f"{system_prompt}\n\n"
        if history:
            context += "Recent conversation:\n"
            for msg in history[-3:]:  # Last 3 exchanges
                context += f"User: {msg['user']}\nAssistant: {msg['assistant']}\n"
        
        # Generate response
        full_prompt = f"{context}\nUser: {message}\nAssistant:"
        response = gemini_model.generate_content(full_prompt)
        
        return response.text.strip()
    
    except Exception as e:
        print(f"Gemini API error: {e}")
        return "I'm here to listen and support you. Could you tell me more about what's on your mind?"

# ============================================================================
# YOUTUBE RECOMMENDATIONS
# ============================================================================

EMOTION_YOUTUBE_QUERIES = {
    "sadness": "motivational video for sadness",
    "joy": "happy uplifting videos",
    "anger": "calming relaxing videos",
    "fear": "soothing meditation videos",
    "love": "heartwarming videos",
    "surprise": "interesting surprising facts videos",
    "neutral": "inspirational videos"
}

def get_youtube_recommendations(emotion: str, max_results: int = 3) -> list[VideoRecommendation]:
    """Fetch YouTube video recommendations based on emotion"""
    try:
        youtube = build('youtube', 'v3', developerKey=YOUTUBE_API_KEY)
        
        query = EMOTION_YOUTUBE_QUERIES.get(emotion, EMOTION_YOUTUBE_QUERIES["neutral"])
        
        request = youtube.search().list(
            part="snippet",
            q=query,
            type="video",
            maxResults=max_results,
            order="relevance",
            videoDuration="medium",  # 4-20 minutes
            safeSearch="strict"
        )
        
        response = request.execute()
        
        recommendations = []
        for item in response.get('items', []):
            video_id = item['id']['videoId']
            recommendations.append(VideoRecommendation(
                title=item['snippet']['title'],
                video_id=video_id,
                thumbnail=item['snippet']['thumbnails']['medium']['url'],
                url=f"https://www.youtube.com/watch?v={video_id}"
            ))
        
        return recommendations
    
    except Exception as e:
        print(f"YouTube API error: {e}")
        # Return fallback recommendations
        return [
            VideoRecommendation(
                title="Recommended Video",
                video_id="dQw4w9WgXcQ",
                thumbnail="https://img.youtube.com/vi/dQw4w9WgXcQ/mqdefault.jpg",
                url="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
            )
        ]

# ============================================================================
# API ENDPOINTS
# ============================================================================

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "service": "Emotion-Aware Chatbot API",
        "version": "1.0.0"
    }

@app.post("/chat", response_model=ChatResponse)
async def chat(request: ChatRequest):
    """
    Main chat endpoint with emotion detection and personalized responses
    
    The emotion model runs only every 2 messages to optimize performance.
    """
    try:
        # Get or create session
        session_id, session = get_or_create_session(request.session_id)
        
        # Determine if we should run emotion detection
        should_detect_emotion = session.message_count_since_last_emotion >= 2
        emotion_updated = False
        
        if should_detect_emotion:
            # Run emotion detection
            new_emotion = detect_emotion(request.message)
            session.last_emotion = new_emotion
            session.message_count_since_last_emotion = 0
            emotion_updated = True
        
        current_emotion = session.last_emotion
        
        # Generate Gemini response
        chatbot_response = generate_gemini_response(
            request.message,
            current_emotion,
            session.conversation_history
        )
        
        # Get YouTube recommendations
        video_recommendations = get_youtube_recommendations(current_emotion)
        
        # Update conversation history
        session.conversation_history.append({
            "user": request.message,
            "assistant": chatbot_response,
            "emotion": current_emotion,
            "timestamp": datetime.now().isoformat()
        })
        
        # Increment message counter
        session.message_count_since_last_emotion += 1
        
        # Return response
        return ChatResponse(
            response=chatbot_response,
            emotion=current_emotion,
            video_recommendations=video_recommendations,
            message_count=session.message_count_since_last_emotion,
            session_id=session_id,
            emotion_updated=emotion_updated
        )
    
    except Exception as e:
        print(f"Chat endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    """Delete a user session"""
    if session_id in sessions:
        del sessions[session_id]
        return {"status": "success", "message": "Session deleted"}
    raise HTTPException(status_code=404, detail="Session not found")

@app.get("/session/{session_id}/history")
async def get_history(session_id: str):
    """Get conversation history for a session"""
    if session_id not in sessions:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = sessions[session_id]
    return {
        "session_id": session_id,
        "current_emotion": session.last_emotion,
        "message_count": session.message_count_since_last_emotion,
        "history": session.conversation_history
    }

@app.post("/scrape", response_model=ScrapingResponse)
async def scrape_and_analyze(request: ScrapingRequest):
    """
    Web scraping endpoint with RAG capabilities
    
    Scrapes web content based on query, generates embeddings, and retrieves relevant data
    """
    try:
        result = scraper_instance.full_pipeline(
            query=request.query,
            retrieval_query=request.retrieval_query
        )
        
        # Convert to response model
        if "error" in result and not result.get("results"):
            return ScrapingResponse(
                query=request.query,
                total_links_found=0,
                pages_scraped=0,
                total_chunks=0,
                results=[],
                error=result["error"]
            )
        
        return ScrapingResponse(
            query=result["query"],
            total_links_found=result.get("total_links_found", 0),
            pages_scraped=result.get("pages_scraped", 0),
            total_chunks=result.get("total_chunks", 0),
            results=[ScrapingResult(**item) for item in result["results"]],
            error=result.get("error")
        )
    
    except Exception as e:
        print(f"Scraping endpoint error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-depression", response_model=DepressionPredictionResponse)
async def predict_depression(request: DepressionPredictionRequest):
    """
    Depression prediction endpoint
    
    Analyzes user data to predict depression risk and provide recommendations
    """
    try:
        # Convert request to dict with proper feature names
        user_data = {
            "Age": request.Age,
            "Academic Pressure": request.Academic_Pressure,
            "Study Satisfaction": request.Study_Satisfaction,
            "Work/Study Hours": request.Work_Study_Hours,
            "Financial Stress": request.Financial_Stress,
            "Sleep Duration": request.Sleep_Duration,
            "Dietary Habits": request.Dietary_Habits,
            "Have you ever had suicidal thoughts ?": request.Suicidal_Thoughts
        }
        
        # Make prediction
        result = depression_predictor.predict(user_data)
        
        return DepressionPredictionResponse(
            depression_probability=result["depression_probability"],
            prediction_message=result["prediction_message"],
            recommendations=Recommendation(**result["recommendations"])
        )
    
    except Exception as e:
        print(f"Depression prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/predict-voice-emotion", response_model=VoiceEmotionResponse)
async def predict_voice_emotion(audio: UploadFile = File(...)):
    """
    Voice emotion detection endpoint
    
    Analyzes uploaded audio file to detect emotion with probability scores
    """
    temp_file_path = None
    try:
        # Validate file type
        if not audio.content_type or not audio.content_type.startswith('audio/'):
            raise HTTPException(status_code=400, detail="File must be an audio file")
        
        # Determine file extension from filename or content type
        file_extension = '.webm'  # Default
        if audio.filename:
            ext = os.path.splitext(audio.filename)[1]
            if ext:
                file_extension = ext
        elif 'ogg' in audio.content_type:
            file_extension = '.ogg'
        elif 'mp4' in audio.content_type:
            file_extension = '.mp4'
        elif 'wav' in audio.content_type:
            file_extension = '.wav'
        
        # Create temporary file to save uploaded audio with correct extension
        with tempfile.NamedTemporaryFile(delete=False, suffix=file_extension) as temp_file:
            temp_file_path = temp_file.name
            shutil.copyfileobj(audio.file, temp_file)
        
        print(f"Saved audio file: {temp_file_path} ({audio.content_type})")
        
        # Make prediction
        result = voice_emotion_predictor.predict_emotion(temp_file_path)
        
        return VoiceEmotionResponse(
            emotion=result["emotion"],
            emoji=result["emoji"],
            description=result["description"],
            confidence=result["confidence"],
            all_probabilities=result["all_probabilities"],
            top_emotions=[EmotionProbability(**item) for item in result["top_emotions"]]
        )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"Voice emotion prediction error: {e}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))
    
    finally:
        # Clean up temporary file
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass


@app.on_event("startup")
async def startup_event():
    """Initialize models on startup"""
    print("🚀 Starting Emotion-Aware Chatbot Backend...")
    print("⚡ Emotion model will lazy-load on first request")
    print("⚡ Loading depression prediction model...")
    depression_predictor.load_model()
    print("⚡ Loading voice emotion model...")
    voice_emotion_predictor.load_model()
    print("✅ Server ready!")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
