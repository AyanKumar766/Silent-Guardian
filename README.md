# 🛡️ Silent Guardian

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

## 🧠 AI Configuration

The application is currently configured to prioritize **Gemma 3** models (Instruction Tuned) for high-quality, efficient responses.

**Model Priority:**
1.  `gemma-3-12b-it` (High Intelligence)
2.  `gemma-3-27b-it` (Complex Reasoning)
3.  `gemma-3-4b-it` (Fast/Lightweight)

This configuration can be modified in `app/api/ask-gemini/route.ts`.


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