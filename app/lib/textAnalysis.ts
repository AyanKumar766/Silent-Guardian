/**
 * Lightweight Rule-Based Text Analysis for Mental Health Signals.
 * 
 * DESIGN PHILOSOPHY:
 * - Deterministic: Same input always leads to same output.
 * - Explainable: We can point to exactly which words triggered a tag.
 * - Privacy-First: No data leaves the device.
 */

export type SentimentTag = 'neutral' | 'stress' | 'anxiety' | 'depression' | 'insomnia' | 'positivity' | 'concern';

export interface AnalysisResult {
    tags: SentimentTag[];
    score: number; // Rough sentiment score (-1 to +1)
    triggers: Record<string, string[]>; // Map of Tag -> causing words
    stressSignals: string[]; // Flattened list of all stress/anxiety/concern keywords found
}

// Keyword Dictionaries
// Expanded lists for better coverage
const DICTIONARIES: Record<Exclude<SentimentTag, 'neutral'>, string[]> = {
    stress: [
        'overwhelmed', 'too much', 'can\'t handle', 'pressure', 'busy', 'deadline',
        'stressed', 'exhausted', 'burden', 'snap', 'tension', 'conflict',
        'burnout', 'rushing', 'behind', 'chaotic'
    ],
    anxiety: [
        'nervous', 'scared', 'worry', 'worried', 'panic', 'dread', 'fear',
        'shaking', 'uneasy', 'restless', 'what if', 'anxious',
        'paranoia', 'on edge', 'butterflies', 'terrified'
    ],
    depression: [
        'sad', 'hopeless', 'empty', 'worthless', 'guilty', 'dark', 'pain',
        'lonely', 'tired of', 'give up', 'failed', 'heavy', 'numb',
        'grief', 'crying', 'depressed', 'suicide', 'kill myself'
    ],
    insomnia: [
        'awake', 'can\'t sleep', 'no sleep', 'tired', 'insomnia', 'nightmare',
        'tossing and turning', 'up all night', 'exhausted',
        'sleepless', 'waking up'
    ],
    concern: [
        'concerned', 'issue', 'problem', 'trouble', 'doubt', 'unsafe',
        'risk', 'bothered', 'questioning', 'unsure', 'skeptical',
        'warning', 'careful', 'danger'
    ],
    positivity: [
        'happy', 'good', 'great', 'hope', 'better', 'love', 'excited',
        'calm', 'peace', 'accomplished', 'proud', 'grateful', 'thanks',
        'joy', 'wonderful', 'safe', 'secure'
    ]
};

/**
 * Analyzes journal text for specific mental health signals.
 * @param text The input journal entry
 * @returns AnalysisResult containing tags, score, and explanation
 */
export function analyzeText(text: string): AnalysisResult {
    const lowerText = text.toLowerCase();
    const foundTags: Set<SentimentTag> = new Set();
    const triggers: Record<string, string[]> = {};
    const stressSignals: string[] = [];

    let sentimentScore = 0;

    // Helper to add trigger
    const addTrigger = (tag: SentimentTag, word: string) => {
        foundTags.add(tag);
        if (!triggers[tag]) {
            triggers[tag] = [];
        }
        if (!triggers[tag].includes(word)) { // Avoid dupes
            triggers[tag].push(word);
        }

        // Aggregate stress signals
        if (['stress', 'anxiety', 'concern', 'depression', 'insomnia'].includes(tag)) {
            if (!stressSignals.includes(word)) {
                stressSignals.push(word);
            }
        }
    };

    // 1. Scan against dictionaries
    Object.entries(DICTIONARIES).forEach(([tag, keywords]) => {
        const currentTag = tag as SentimentTag;

        keywords.forEach(keyword => {
            // Use boundary detection for simple phrases to avoid false positives
            // e.g., "scared" inside "sacred" (bad example but concept holds)
            // For multi-word phrases, simple includes is safer than regex without NLP tokenization
            if (lowerText.includes(keyword)) {
                addTrigger(currentTag, keyword);

                // Simple scoring logic
                if (currentTag === 'positivity') {
                    sentimentScore += 1;
                } else {
                    sentimentScore -= 1;
                }
            }
        });
    });

    // 2. Default to 'neutral' if nothing found
    if (foundTags.size === 0) {
        foundTags.add('neutral');
    }

    // 3. Normalize score roughly between -1 and 1
    // We use a sigmoid-like squashing or simple clamping
    const normalizedScore = Math.max(-1, Math.min(1, sentimentScore * 0.2));

    return {
        tags: Array.from(foundTags),
        score: Number(normalizedScore.toFixed(2)),
        triggers,
        stressSignals
    };
}

// Example Usage (for documentation/testing):
/*
const example1 = analyzeText("I am feeling so overwhelmed and I can't sleep at all.");
// Output: 
// { 
//   tags: ['stress', 'insomnia'], 
//   triggers: { stress: ['overwhelmed'], insomnia: ['can't sleep'] },
//   score: -0.4
// }
*/
