/**
 * Deterministic Stress Evaluation Module
 * 
 * Takes normalized metrics and sentiment tags to categorize stress levels.
 * DESIGN: Offline-first, rule-based, non-diagnostic.
 */

export type StressLevel = 'LOW' | 'MODERATE' | 'HIGH';

export interface StressInput {
    pitchVariance: number;   // Normalized 0.0 to 1.0 (0 = monotonic, 1 = chaotic)
    energyVariance: number;  // Normalized 0.0 to 1.0 (0 = flat, 1 = explosive)
    sentimentTag?: string;   // e.g., "neutral", "stress", "anxiety", "positivity"
}

export interface StressResult {
    stressLevel: StressLevel;
    message: string;
    suggestions: string[];
}

/**
 * Evaluates stress based on voice metrics and text sentiment.
 * 
 * LOGIC:
 * - Calculates a weighted base score from voice metrics.
 * - Adjusts score based on sentiment tags.
 * - Maps final score to LOW/MODERATE/HIGH categories.
 */
export function evaluateStress(input: StressInput): StressResult {
    const { pitchVariance, energyVariance, sentimentTag } = input;

    // 1. Base Voice Score (0.0 - 1.0)
    // Pitch variance (jitter-like) is often a strong indicator of stress/tremor.
    // Energy variance (shimmer-like) indicates instability.
    let voiceScore = (pitchVariance * 0.6) + (energyVariance * 0.4);

    // 2. Sentiment Adjustment
    // We bump the score up/down based on explicit text signals.
    // KEY CHANGE: We also set a 'minimum floor' for negative tags so calm voice doesn't mask text stress.
    let minScore = 0;

    if (sentimentTag) {
        switch (sentimentTag.toLowerCase()) {
            case 'stress':
            case 'anxiety':
            case 'insomnia':
            case 'concern':
                voiceScore += 0.3;
                minScore = 0.45; // Guarantee at least MODERATE
                break;
            case 'depression':
            case 'hopeless':
                voiceScore += 0.4;
                minScore = 0.5; // Guarantee at least MODERATE+
                break;
            case 'positivity':
            case 'happy':
                voiceScore -= 0.2;
                break;
            case 'neutral':
            default:
                break;
        }
    }

    // Clamp score 0-1 AND ensure it meets the minimum floor from text analysis
    const finalScore = Math.max(minScore, Math.min(1, voiceScore));

    // 3. Categorization
    // Thresholds: Low < 0.4 <= Moderate < 0.7 <= High

    if (finalScore >= 0.7) {
        return {
            stressLevel: 'HIGH',
            message: "Your signals indicate a moment of high intensity.",
            suggestions: [
                "Pause and take three deep, slow breaths.",
                "Step away for a quiet moment if possible."
            ]
        };
    }

    if (finalScore >= 0.4) {
        return {
            stressLevel: 'MODERATE',
            message: "Your signals suggest some tension or unease.",
            suggestions: [
                "Try rolling your shoulders to release tension.",
                "Focus on your breathing for a few seconds."
            ]
        };
    }

    // Low Stress
    return {
        stressLevel: 'LOW',
        message: "Your signals appear calm and balanced.",
        suggestions: [
            "A good moment to reflect or journal.",
            "Continue with your current steady pace."
        ]
    };
}

// --- Example Outputs for Documentation ---
/*
Example 1:
Input: { pitchVariance: 0.2, energyVariance: 0.1, sentimentTag: "neutral" }
Score: (0.2*0.6) + (0.1*0.4) = 0.16 -> LOW
Output: {
  stressLevel: "LOW",
  message: "You seem relatively calm and steady.",
  suggestions: ["Great time to reflect...", "Keep this flow going."]
}

Example 2:
Input: { pitchVariance: 0.6, energyVariance: 0.5, sentimentTag: "stress" }
Score: (0.36 + 0.2) + 0.3 = 0.86 -> HIGH
Output: {
  stressLevel: "HIGH",
  message: "It seems like things are quite heavy right now.",
  suggestions: ["Take a moment...", "Consider stepping away..."]
}
*/
