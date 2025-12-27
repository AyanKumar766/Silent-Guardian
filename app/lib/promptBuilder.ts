/**
 * AI Prompt Builder
 * 
 * Constructs safe, contextual prompts for AI generation based on local analysis.
 * Implements strict constraints to prevent diagnostic or medical output.
 */

interface PromptContext {
    stressLevel: string; // 'LOW', 'MODERATE', 'HIGH'
    themes: string[];    // e.g. ['stress', 'fatigue', 'anxiety']
}

/**
 * Builds the effective prompt to be sent to the AI service.
 * Enforces safety guardrails directly in the system instructions within the prompt.
 */
export function buildGroundingPrompt(context: PromptContext): string {
    const themeString = context.themes.length > 0 ? context.themes.join(', ') : 'general balance';

    return `User stress level: ${context.stressLevel}
Detected themes: ${themeString}

Generate 2 short, non-medical, grounding suggestions.
No diagnosis. No therapy. No emergency language.
Tone: calm and supportive.`;
}

/**
 * Builds a prompt specifically for generating JSON suggestions.
 */
export function buildSuggestionPrompt(context: PromptContext): string {
    const themeString = context.themes.length > 0 ? context.themes.join(', ') : 'general balance';

    return `You are a supportive mental health companion.
Context:
- User Stress Level: ${context.stressLevel} (Low/Moderate/High)
- Detected Mood/Themes: ${themeString}

Task:
Generate 3 actionable, short, and calming suggestions.
The output MUST be a strict JSON array with no markdown formatting.
Each object in the array must have:
- "title": string (max 5 words)
- "description": string (max 15 words)
- "actionType": one of ["BREATHING", "JOURNAL", "MEDITATION", "EXERCISE", "NONE"]

Example Output:
[
  { "title": "Deep Breath", "description": "Take a deep breath for 4 seconds.", "actionType": "BREATHING" }
]

Do not include \`\`\`json blocks. Just the raw JSON string.`;
}

// Example Usage:
// const prompt = buildGroundingPrompt({ stressLevel: 'MODERATE', themes: ['stress', 'fatigue'] });
// Output:
// User stress level: MODERATE
// Detected themes: stress, fatigue
//
// Generate 2 short, non-medical, grounding suggestions.
// No diagnosis. No therapy. No emergency language.
// Tone: calm and supportive.
