# 🛡️ Silent Guardian

**Silent Guardian** is a privacy-focused mental health companion application. It uses real-time voice stress analysis and sentiment tracking to provide immediate grounding techniques and AI-powered coping strategies.

## ✨ Key Features

*   **🎙️ Voice Check-In**: Analyzes pitch and energy variance in your voice to detect stress levels in real-time (Privacy-first: Audio is processed locally in the browser).
*   **📓 Intelligent Journal**: Write your thoughts and get instant sentiment analysis.
*   **🤖 AI Coping Engine**: Powered by **Google Gemini** & **Gemma 3** models. It understands your stress context and suggests personalized breathing exercises or framing techniques.
*   **🔒 Privacy-First**: 
    *   Voice analysis happens entirely on your device (Web Audio API).
    *   Text sentiment is evaluated locally.
    *   AI suggestions are only generated when you explicitly request them (e.g., saving an entry).
*   **🔍 AI Logic Inspector**: A built-in transparent viewer to see exactly what data is sent to the AI and what model is being used (e.g., `gemma-3-12b-it`).

## 🛠️ Tech Stack

*   **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/)
*   **AI Models**: Google Gemini API (accessing Gemma 3 instruction-tuned models)
*   **Analysis**: Web Audio API (Spectral analysis), Sentiment VADER-like local rule engine.

## 🚀 Getting Started

### Prerequisites

*   Node.js 18+
*   A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/AyanKumar766/Silent-Guardian.git
    cd Silent-Guardian
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env.local` file in the root directory and add your API Key:
    ```bash
    GEMINI_API_KEY=AIzaSyDZj7bmKEpRWj116ToI8ngNRZsrRyheU1E
    ```
    *(Note: Replace with your actual key if different)*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.

## 🧠 AI Configuration

The application is currently configured to prioritize **Gemma 3** models (Instruction Tuned) for high-quality, efficient responses.

**Model Priority:**
1.  `gemma-3-12b-it` (High Intelligence)
2.  `gemma-3-27b-it` (Complex Reasoning)
3.  `gemma-3-4b-it` (Fast/Lightweight)

This configuration can be modified in `app/api/ask-gemini/route.ts`.

## 📦 Deployment

The easiest way to deploy is via **Vercel**:

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  **Crucial Step**: Add `GEMINI_API_KEY` to the **Environment Variables** in Vercel Project Settings.
4.  Deploy!

---

*Built with ❤️ for Mental Health Awareness.*
