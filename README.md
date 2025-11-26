# 🌿 Mental Wellness Platform

A comprehensive AI-powered mental health support platform that combines emotion-aware chatbot, depression risk assessment, voice emotion detection, and personalized content discovery to support mental wellness journeys.

## ✨ Features

### 🤖 Emotion-Aware Chatbot

- Real-time emotion detection from text messages
- Context-aware responses using Google Gemini AI
- Dynamic YouTube video recommendations based on detected emotions
- Session-based conversation history

### 🧠 Depression Risk Assessment

- ML-based depression probability prediction
- Personalized recommendations based on risk levels
- Comprehensive mental wellness questionnaire
- Evidence-based assessment criteria

### 🎤 Voice Emotion Detection

- Real-time audio recording and analysis
- CNN-based emotion recognition from voice
- Support for 8 emotion categories (neutral, calm, happy, sad, angry, fearful, disgust, surprised)
- Visual confidence breakdown

### 🔍 Content Discovery (RAG)

- Web scraping with intelligent content extraction
- Vector-based semantic search using FAISS
- Retrieval-Augmented Generation pipeline
- Top relevant results with source attribution

## 🏗️ Architecture

```
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   │   ├── chatbot/
│   │   │   ├── depression-analysis/
│   │   │   ├── voice-emotion/
│   │   │   └── sentiment-analysis/
│   │   └── components/
│   └── public/
│
└── backend/
    ├── main.py
    ├── scraper.py
    ├── depression_predictor.py
    ├── voice_emotion_predictor.py
    └── models/
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** 20.9.0 or higher
- **Python** 3.9 or higher
- **npm** or **yarn**
- **pip**

### Environment Variables

Create `.env` files in both frontend and backend directories:

**Backend (`backend/.env`)**

```env
GEMINI_API_KEY=your_gemini_api_key
YOUTUBE_API_KEY=your_youtube_api_key
SERPAPI_KEY=your_serpapi_key
```

**Frontend (`frontend/.env.local`)**

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Installation

#### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at:

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000
- **API Documentation**: http://localhost:8000/docs

## 📦 Tech Stack

### Frontend

- **Framework**: Next.js 16 (React 19)
- **Styling**: Tailwind CSS 4
- **UI Components**: Lucide React icons
- **TypeScript**: Type-safe development

### Backend

- **Framework**: FastAPI
- **AI/ML**:
  - Google Gemini 2.5 Flash (conversational AI)
  - HuggingFace Transformers (emotion detection)
  - TensorFlow/Keras (depression prediction)
  - PyTorch (voice emotion CNN)
- **Data Processing**:
  - Librosa (audio processing)
  - Pandas, NumPy (data manipulation)
- **RAG Pipeline**:
  - SerpAPI (web search)
  - Trafilatura (content extraction)
  - FastEmbed (embeddings)
  - FAISS (vector search)
- **APIs**: YouTube Data API v3

## 🎯 Key Features Detail

### Chatbot System

- **Emotion Detection**: Uses DistilBERT for text emotion classification
- **Response Generation**: Context-aware responses via Gemini AI
- **Tone Adaptation**: Adjusts communication style based on detected emotions
- **Video Recommendations**: Emotion-appropriate YouTube content

### Depression Assessment

- **Input Features**: Age, academic pressure, study satisfaction, work hours, financial stress, sleep, diet, mental health history
- **ML Model**: Trained neural network for probability prediction
- **Risk Levels**: Low, Mild, Moderate, High, Critical with tailored recommendations
- **Resources**: Actionable mental health resources and guidance

### Voice Emotion Detection

- **Audio Processing**: 22.05kHz sampling, MFCC feature extraction
- **CNN Architecture**: Convolutional neural network for emotion classification
- **Real-time Analysis**: Browser-based recording with instant results
- **Multi-format Support**: WebM, OGG, MP4 audio formats

### Content Discovery

- **Web Scraping**: Automated content extraction from top search results
- **Chunking**: Intelligent text segmentation for better retrieval
- **Embedding**: FastEmbed for semantic vector representations
- **Ranking**: FAISS-powered similarity search for relevant content

⚠️ Disclaimer
This application is designed to support mental wellness and is not a substitute for professional medical advice, diagnosis, or treatment. If you're experiencing mental health concerns, please consult with a qualified healthcare professional.

## 📧 Contact

For questions, feedback, or support, please open an issue on GitHub.

---

**Built with ❤️ for mental wellness**
