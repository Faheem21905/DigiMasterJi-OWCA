# DigiMasterJi 📚🤖

**Offline-First Multilingual AI Tutoring System for Rural India**

[![Demo Video](https://img.shields.io/badge/Demo-YouTube-red?style=for-the-badge&logo=youtube)](https://youtu.be/dna60bJggGI)
[![Live Prototype](https://img.shields.io/badge/Prototype-Vercel-black?style=for-the-badge&logo=vercel)](https://digimasterji.vercel.app/)
[![Hackathon](https://img.shields.io/badge/AMD-Slingshot%20Hackathon-orange?style=for-the-badge)](https://amdslingshot.in/?utm_source=hack2skill&utm_medium=homepage)

---

## 🎯 Problem Statement

### India's Rural Education Crisis

| Challenge                 | Statistics                                 |
| ------------------------- | ------------------------------------------ |
| 🧑‍🏫 Teacher Vacancies      | **1+ Million** unfilled positions          |
| 📶 Internet Access        | Only **3.7%** have high-speed connectivity |
| 🏫 Single-Teacher Schools | **104,000+** schools with one teacher      |
| 📚 Subject Coverage       | Single teacher for **ALL** subjects        |

**Rural students are being left behind** — not due to lack of capability, but lack of access to quality STEM education and digital resources.

---

## 💡 Our Solution

**DigiMasterJi** is an AI-powered tutoring platform designed specifically for rural and under-resourced students in India, featuring:

### Key Features

| Feature                           | Description                                                                                 |
| --------------------------------- | ------------------------------------------------------------------------------------------- |
| 🎤 **Voice-First Interface**      | Speak naturally — no typing required. Perfect for students with limited keyboard experience |
| 🌐 **Multilingual Support**       | Responds in Hindi, English, and regional Indian languages                                   |
| 📖 **Curriculum-Aligned**         | Follows CBSE/NCERT curriculum with RAG-powered knowledge base                               |
| 📴 **Offline-First Architecture** | Works without internet using WebLLM browser AI                                              |
| 🎮 **Gamified Learning**          | XP system, streaks, badges, and AI-generated quizzes                                        |
| 👨‍👩‍👧‍👦 **Family Profiles**            | Netflix-style multi-profile system for families                                             |
| 🕷️ **Agentic Web Scraper**        | LLM-driven website crawler that intelligently scrapes and adds content to the knowledge base |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           FRONTEND                                  │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   React 19    │  │ Tailwind CSS │  │      WebLLM              │ │
│  │   + Vite 7    │  │      4       │  │   (Gemma-2B Offline)     │ │
│  └───────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │  Dexie.js     │  │ Framer Motion│  │   Service Worker (PWA)   │ │
│  │ (IndexedDB)   │  │              │  │                          │ │
│  └───────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                           BACKEND                                   │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │   FastAPI     │  │  JWT Auth    │  │    Motor (Async)         │ │
│  │   Python      │  │  + Security  │  │    MongoDB Driver        │ │
│  └───────────────┘  └──────────────┘  └──────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         DATABASE                                    │
│  ┌───────────────────────────────────────────────────────────────┐ │
│  │              MongoDB Atlas + Vector Search                     │ │
│  │         (Users, Profiles, Conversations, Knowledge Base)       │ │
│  └───────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          AI / ML STACK                              │
│  ┌───────────────┐  ┌──────────────┐  ┌──────────────────────────┐ │
│  │    Ollama     │  │   Deepgram   │  │   Sentence Transformers  │ │
│  │ (Gemma 3 12B) │  │    (STT)     │  │   (RAG Embeddings)       │ │
│  └───────────────┘  └──────────────┘  └──────────────────────────┘ │
│  ┌───────────────┐  ┌──────────────────────────────────────────┐   │
│  │  Google TTS   │  │         PyMuPDF (PDF Processing)         │   │
│  │              │  │                                           │   │
│  └───────────────┘  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology    | Version | Purpose                       |
| ------------- | ------- | ----------------------------- |
| React         | 19.1.0  | UI Framework                  |
| Vite          | 7.0.0   | Build Tool                    |
| Tailwind CSS  | 4.0.0   | Styling                       |
| WebLLM        | 0.2.91  | Offline Browser AI (Gemma-2B) |
| Dexie.js      | 4.0.11  | IndexedDB for Offline Storage |
| Framer Motion | 12.9.2  | Animations                    |

### Backend

| Technology            | Version  | Purpose                  |
| --------------------- | -------- | ------------------------ |
| FastAPI               | 0.115.12 | API Framework            |
| Motor                 | 3.7.0    | Async MongoDB Driver     |
| Pydantic              | 2.11.3   | Data Validation          |
| Python-Jose           | 3.4.0    | JWT Authentication       |
| Sentence Transformers | 4.1.0    | RAG Embeddings           |
| Ollama                | -        | LLM Server (Gemma 3 12B) |

### AI Services

| Service               | Purpose               |
| --------------------- | --------------------- |
| Ollama + Gemma 3 12B  | Main LLM for tutoring |
| WebLLM + Gemma-2B     | Offline browser AI    |
| Deepgram              | Speech-to-Text        |
| Google TTS            | Text-to-Speech        |
| Sentence Transformers | RAG vector embeddings |

---

## 🔴 AMD Product Usage

### Current Implementation

**Oracle Cloud Infrastructure with AMD EPYC Processors**

- **Instance:** VM.Standard.E2.1.Micro on AMD EPYC
- **Purpose:** Backend API hosting
- **Benefits:** Cost-effective compute for FastAPI + Ollama workloads

### Future Roadmap

**AMD Ryzen AI NPUs for Edge Deployment**

- Deploy lightweight inference on AMD NPU-enabled devices
- Enable true offline AI in rural schools without cloud dependency
- Reduce latency and bandwidth requirements

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.10
- **MongoDB Atlas** account (or local MongoDB)
- **Ollama** installed locally (for LLM)

### Backend Setup

```bash
# Navigate to backend directory
cd Backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your credentials

# Start Ollama (in separate terminal)
ollama serve
ollama pull gemma3:12b

# Run the server
uvicorn app.main:app --reload --port 8000
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd Frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_BASE_URL=http://localhost:8000" > .env

# Start development server
npm run dev
```

### Environment Variables

#### Backend (.env)

```env
MONGODB_URI=mongodb+srv://your-connection-string
SECRET_KEY=your-secret-key-here
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=gemma3:12b
DEEPGRAM_API_KEY=your-deepgram-key
```

#### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000
```

---

## 📁 Project Structure

```
DigiMasterJi/
├── Backend/
│   ├── app/
│   │   ├── database/       # MongoDB collections & queries
│   │   ├── models/         # Pydantic schemas
│   │   ├── routers/        # API endpoints
│   │   ├── services/       # Business logic (LLM, RAG, TTS, STT)
│   │   ├── utils/          # Security utilities
│   │   └── main.py         # FastAPI application
│   └── requirements.txt
│
├── Frontend/
│   ├── public/
│   │   ├── sw.js           # Service Worker for PWA
│   │   └── manifest.json   # PWA manifest
│   ├── src/
│   │   ├── api/            # API client functions
│   │   ├── components/     # Reusable UI components
│   │   ├── contexts/       # React contexts
│   │   ├── db/             # Dexie.js IndexedDB
│   │   ├── hooks/          # Custom React hooks
│   │   ├── pages/          # Page components
│   │   ├── services/       # Sync service
│   │   └── App.jsx         # Main application
│   └── package.json
│
└── Documentation/
    └── sprintplan.md       # Development sprint plan
```

---

## 🎮 Features Deep Dive

### 1. Voice-First Interface

- Record voice messages using browser MediaRecorder API
- Server-side transcription with Deepgram STT
- AI responses with optional TTS playback

### 2. Offline-First Architecture

- **PWA Support:** Installable as native app
- **IndexedDB Storage:** Conversations, profiles, quizzes cached locally
- **WebLLM Integration:** Gemma-2B runs entirely in browser when offline
- **Smart Sync:** Automatic data synchronization when connection restored

### 3. RAG-Enhanced Knowledge Base

- Upload curriculum PDFs through admin panel
- Automatic chunking with sentence-transformers embeddings
- MongoDB Atlas Vector Search for semantic retrieval
- Context-aware AI responses grounded in curriculum

### 4. Gamification System

- **XP Points:** Earn XP for chat interactions and quiz completion
- **Daily Streaks:** Maintain learning consistency
- **Badges:** Unlock achievements for milestones
- **AI Quizzes:** Auto-generated quizzes based on conversation topics

### 5. Multi-Profile System

- Netflix-style profile selection
- Parent/guardian master accounts
- Individual child profiles with separate progress
- Profile-specific learning analytics

### 6. Agentic Web Scraper

- **LLM-Driven Crawling:** Uses Gemma 3 4B via Ollama to make intelligent decisions instead of regex rules
- **3 AI Decision Points:** Should I visit this URL? → Is this content relevant? → Which links should I follow?
- **Playwright Browser Automation:** Full headless browser for JavaScript-rendered content
- **Auto RAG Integration:** Scraped content is automatically chunked, embedded, and added to the knowledge base
- **Admin Dashboard UI:** Configurable settings, live progress with agent decision log, and job history

---

## 🔗 Links

| Resource          | Link                                                        |
| ----------------- | ----------------------------------------------------------- |
| 🎬 Demo Video     | [YouTube](https://youtu.be/dna60bJggGI)                     |
| 🌐 Live Prototype | [digimasterji.vercel.app](https://digimasterji.vercel.app/) |

---

## 👥 Team

### OOPs We Coded Again

| Role        | Name                   |
| ----------- | ---------------------- |
| Team Leader | **Faheemuddin Sayyed** |
| Team Member | **Sanidhya Awasthi**   |
| Team Member | **Raghav Sonchhatra**  |

---

## 🙏 Acknowledgments

- **AMD** for hosting the Slingshot Hackathon
- **Oracle Cloud** for AMD EPYC-powered infrastructure

---

<p align="center">
  <em>DigiMasterJi - Bridging the Education Gap with AI</em>
</p>
