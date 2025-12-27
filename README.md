# 🛡️ Silent Guardian

<<<<<<< HEAD
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
    GEMINI_API_KEY=YOUR_API_KEY_HERE
    ```
    *(Note: Get this from Google AI Studio)*

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

    Open [http://localhost:3000](http://localhost:3000) to see the app.
=======
**Silent Guardian** is a **privacy-first mental health support web app** that helps users express their feelings safely using AI — without compromising personal data.  
The core idea is simple: *your emotions stay on your device*.

---

## 🌱 Why Silent Guardian?

Mental health support often comes with a trade-off:
- 🧠 Helpful AI
- 🔒 But poor privacy

Silent Guardian aims to break this trade-off by offering:
- **Local / user-controlled AI usage**
- **No forced login**
- **No data stored on servers by default**

---

## ✨ Key Features (MVP)

- 🎙️ **Voice or Text Input**  
  Express emotions through short recordings or text.

- 🧠 **AI-Based Emotional Understanding**  
  Speech-to-text conversion with emotion or stress pattern detection using keywords and tone.

- 🔐 **Privacy-First Design**  
  No mandatory authentication, no cloud storage by default, and support for user-provided AI API keys.

- 💬 **Supportive AI Responses**  
  Calm, reassuring replies with grounding or breathing suggestions.

- 📊 **Local History (Optional)**  
  Conversations can be stored locally with full user control over deletion.

---

## 🧠 Tech Stack

- **Frontend:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **AI (Optional):** Google Gemini API, OpenAI API
- **Speech:** Browser Speech-to-Text (Web Speech API)

---
>>>>>>> def3dedc0f7f58b73527be87f013cd99b844f612

## 🧠 AI Configuration

The application is currently configured to prioritize **Gemma 3** models (Instruction Tuned) for high-quality, efficient responses.

**Model Priority:**
1.  `gemma-3-12b-it` (High Intelligence)
2.  `gemma-3-27b-it` (Complex Reasoning)
3.  `gemma-3-4b-it` (Fast/Lightweight)

This configuration can be modified in `app/api/ask-gemini/route.ts`.

<<<<<<< HEAD
## 📦 Deployment

The easiest way to deploy is via **Vercel**:

1.  Push your code to GitHub.
2.  Import the project in Vercel.
3.  **Crucial Step**: Add `GEMINI_API_KEY` to the **Environment Variables** in Vercel Project Settings.
4.  Deploy!

---

*Built with ❤️ for Mental Health Awareness.*
=======

## 🚀 Getting Started

Clone the repository, install dependencies, start the development server, and open the app locally:

```bash
git clone https://github.com/AyanKumar766/Silent-Guardian.git
cd Silent-Guardian
npm install
npm run dev
```
## ⚠️ Disclaimer

Silent Guardian is not a medical or diagnostic tool.
It provides emotional support only and is not a substitute for professional therapy.

If you are in crisis, please contact a licensed mental health professional or local emergency services.
## 🤝 Contributing

This is an early-stage project.

Feedback, ideas, and contributions are welcome.
>>>>>>> def3dedc0f7f58b73527be87f013cd99b844f612
