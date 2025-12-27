import { VoiceStressMetrics } from './audioAnalysis';
import { analyzeText, SentimentTag } from './textAnalysis';
import { evaluateStress, StressLevel } from './stressEvaluation';

/**
 * Deterministic Safety Firewall Module
 * 
 * Provides an absolute hard-stop mechanism.
 * If inputs cross specific thresholds, the system ENFORCES a CRISIS state.
 * This skips any generative logic and defaults to hard-coded safety protocols.
 */

export interface SafetyInput {
    text: string;
    voiceMetrics?: VoiceStressMetrics; // Optional, voice might not be used
}

export type SafetyStatus = 'SAFE' | 'CRISIS';

export interface SafetyDecision {
    status: SafetyStatus;
    reason: string;
    actions: SafetyAction[];
}

export interface SafetyAction {
    type: 'BLOCK_GENERATION' | 'SHOW_GROUNDING' | 'SHOW_HELPLINE';
    content?: string;
    suggestions?: string[]; // Added to carry specific grounding tips
}

// Configuration Constants (Auditable Configuration)
const CONFIG = {
    // Text Rules
    CRISIS_KEYWORDS: [
        'suicide', 'kill myself', 'end it all', 'die', 'hurt myself',
        'want to die', 'no way out', 'better off dead', 'can\'t go on'
    ],
    NEGATIVE_SENTIMENT_THRESHOLD: -0.6, // From textAnalysis (-1 to 1)
};

/**
 * Evaluates inputs against deterministic safety rules.
 */
export function evaluateSafety(input: SafetyInput): SafetyDecision {
    const analysis = analyzeText(input.text);
    const textScore = analysis.score;
    const lowercaseText = input.text.toLowerCase();

    // RULE 1: Self-Harm Keyword Hard Match (Highest Priority)
    for (const keyword of CONFIG.CRISIS_KEYWORDS) {
        if (lowercaseText.includes(keyword)) {
            return createCrisisDecision(`Detected high-risk keyword: "${keyword}"`);
        }
    }

    // RULE 2: Extreme Negative Sentiment Magnitude
    if (textScore <= CONFIG.NEGATIVE_SENTIMENT_THRESHOLD) {
        return createCrisisDecision('Detected extreme negative sentiment score.');
    }

    // RULE 3: High Voice Stress Integration
    if (input.voiceMetrics) {
        // We map text sentiment tags to a single representative tag for the stress evaluator
        // Logic: if we have 'stress', 'anxiety', etc., pass that.
        let sentimentTagForStress = 'neutral';
        if (analysis.tags.includes('stress')) sentimentTagForStress = 'stress';
        else if (analysis.tags.includes('anxiety')) sentimentTagForStress = 'anxiety';
        else if (analysis.tags.includes('depression')) sentimentTagForStress = 'depression';
        else if (analysis.tags.includes('positivity')) sentimentTagForStress = 'positivity';

        const stressResult = evaluateStress({
            pitchVariance: normalizeMetric(input.voiceMetrics.pitchVariance, 100), // approx normalization
            energyVariance: normalizeMetric(input.voiceMetrics.energyVariance, 0.5), // approx normalization
            sentimentTag: sentimentTagForStress
        });

        if (stressResult.stressLevel === 'HIGH') {
            return createCrisisDecision(
                'Detected HIGH physiological stress markers.',
                stressResult.suggestions
            );
        }
    }

    // DEFAULT: SAFE
    return {
        status: 'SAFE',
        reason: 'No safety thresholds breached.',
        actions: []
    };
}

/**
 * Helper to normalize raw metrics to 0-1 range for the evaluator
 */
function normalizeMetric(val: number, max: number): number {
    return Math.min(1, Math.max(0, val / max));
}

/**
 * Helper to construct the standardized CRISIS response.
 */
function createCrisisDecision(reason: string, specificSuggestions?: string[]): SafetyDecision {
    return {
        status: 'CRISIS',
        reason,
        actions: [
            {
                type: 'BLOCK_GENERATION',
                content: 'AI response disabled for safety.'
            },
            {
                type: 'SHOW_GROUNDING',
                content: `take_break_breathing`,
                suggestions: specificSuggestions
            },
            {
                type: 'SHOW_HELPLINE',
                content: 'Please contact immediate professional help or a trusted person.'
            }
        ]
    };
}

// --- Example Audit Log (for documentation) ---
/*
Input: { text: "I just want to end it all", voiceMetrics: null }
Output: {
  status: 'CRISIS',
  reason: 'Detected high-risk keyword: "end it all"',
  actions: [BLOCK_GENERATION, SHOW_GROUNDING, SHOW_HELPLINE]
}
*/
