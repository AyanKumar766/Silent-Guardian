
import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import { buildSuggestionPrompt } from "../../lib/promptBuilder";

// Initialize Gemini (lazy load in handler)
// const apiKey = process.env.GEMINI_API_KEY; // Moved inside

export async function POST(req: Request) {
    // Load API Key safely
    const apiKey = process.env.GEMINI_API_KEY;

    console.log("--- Ask Gemini API Request ---");
    console.log("API Key Status:", apiKey ? "Present" : "MISSING");

    if (!apiKey) {
        console.error("Error: GEMINI_API_KEY is missing from process.env");
        return NextResponse.json(
            { error: "GEMINI_API_KEY not configured" },
            { status: 503 }
        );
    }

    try {
        const body = await req.json();
        const { stressLevel, themes } = body;

        // Validation
        if (!stressLevel) {
            return NextResponse.json({ error: "Missing stressLevel" }, { status: 400 });
        }

        const genAI = new GoogleGenerativeAI(apiKey);

        // Model Priority List: STRICTLY User requested models
        const modelsToTry = [
            "gemma-3-1b-it",
            "gemma-3-4b-it",
            "gemma-3-12b-it",
            "gemma-3-27b-it"
        ];

        const prompt = buildSuggestionPrompt({
            stressLevel,
            themes: themes || []
        });

        for (const modelName of modelsToTry) {
            try {
                console.log(`Attempting generation with model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                let text = response.text();

                // Cleanup: Sometimes models output markdown code blocks despite instructions
                text = text.replace(/```json/g, "").replace(/```/g, "").trim();

                // Parse JSON
                const suggestions = JSON.parse(text);

                return NextResponse.json({ suggestions, modelUsed: modelName });

            } catch (error) {
                console.warn(`Model ${modelName} failed or quota exceeded. Trying next...`);
                // Continue to next model in loop
            }
        }

        // If we get here, ALL models failed
        return NextResponse.json(
            { error: "All AI models failed or busy" },
            { status: 500 }
        );

    } catch (error) {
        console.error("Gemini API Route Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
