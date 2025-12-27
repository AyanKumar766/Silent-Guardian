
import { SentimentTag } from './textAnalysis';
import { VoiceStressMetrics } from './audioAnalysis';

export interface Suggestion {
    title: string;
    description: string;
    actionType: 'BREATHING' | 'EXERCISE' | 'JOURNAL' | 'MEDITATION' | 'NONE';
}

/**
 * Generates tailored suggestions based on text mood and voice stress.
 */
const SUGGESTION_POOL: Record<string, Suggestion[]> = {
    'CALM_VOICE': [
        { title: "Calm Your Voice", description: "Your voice indicates high tension. Take a slow drink of water and pause.", actionType: "BREATHING" },
        { title: "Lower Your Pitch", description: "Try speaking slower and deeper to signal safety to your body.", actionType: "BREATHING" },
    ],
    'ANXIETY': [
        { title: "4-7-8 Breathing", description: "Inhale for 4s, hold for 7s, exhale for 8s to calm your nervous system.", actionType: "BREATHING" },
        { title: "Grounding 5-4-3-2-1", description: "Name 5 things you see, 4 you touch, 3 hear, 2 smell, 1 taste.", actionType: "MEDITATION" },
        { title: "Cold Water Splash", description: "Splash cold water on your face to trigger the mammalian dive reflex.", actionType: "NONE" },
        { title: "Shake It Out", description: "Physically shake your hands and limbs to release built-up adrenaline.", actionType: "EXERCISE" },
    ],
    'STRESS': [
        { title: "Box Breathing", description: "Inhale 4s, Hold 4s, Exhale 4s, Hold 4s. Reset your rhythm.", actionType: "BREATHING" },
        { title: "Brain Dump", description: "Write down everything bothering you right now to release the mental load.", actionType: "JOURNAL" },
        { title: "Shoulder Drop", description: "Drop your shoulders away from your ears and unclench your jaw.", actionType: "EXERCISE" },
        { title: "Walk Away", description: "Take a 5-minute walk outside or in another room to break the cycle.", actionType: "EXERCISE" },
    ],
    'DEPRESSION': [
        { title: "Small Step", description: "Don't overwhelm yourself. Do just one tiny task (e.g., wash one cup).", actionType: "NONE" },
        { title: "Connect", description: "Reach out to a close friend or family member, even just via text.", actionType: "NONE" },
        { title: "Sunlight", description: "Try to get 5 minutes of direct sunlight or bright light exposure.", actionType: "NONE" },
        { title: "Comfort Comfort", description: "Wrap yourself in a warm blanket or wear your favorite hoodie.", actionType: "NONE" },
    ],
    'INSOMNIA': [
        { title: "Screen Detox", description: "Dim the lights and put away screens 30 minutes before bed.", actionType: "NONE" },
        { title: "Body Scan", description: "Lie down and mentally scan your body from toes to head, relaxing each part.", actionType: "MEDITATION" },
        { title: "Write Tomorrow", description: "Write down your to-do list for tomorrow so your brain can stop rehearsing it.", actionType: "JOURNAL" },
        { title: "4-7-8 Sleep", description: "Use the 4-7-8 breathing technique to lower your heart rate for sleep.", actionType: "BREATHING" },
    ],
    'POSITIVITY': [
        { title: "Gratitude Journal", description: "Write down 3 things that made you feel good specifically.", actionType: "JOURNAL" },
        { title: "Share the Joy", description: "Tell someone else about your good news to amplify the feeling.", actionType: "NONE" },
        { title: "Savoring", description: "Take a moment to fully appreciate this positive emotion. Where do you feel it?", actionType: "MEDITATION" },
    ],
    'NEUTRAL': [
        { title: "Hydrate", description: "Take a moment to drink a full glass of water. hydration supports brain function.", actionType: "NONE" },
        { title: "Creative Flow", description: "Spend 5 minutes doodling or drawing whatever comes to mind.", actionType: "JOURNAL" },
        { title: "Box Breathing", description: "Practice a round of Box Breathing to maintain your calm state.", actionType: "BREATHING" },
        { title: "Stretch", description: "Stand up and do a quick stretch to release any subtle tension.", actionType: "EXERCISE" },
        { title: "Mindful Pause", description: "Close your eyes for 60 seconds and just listen to the sounds around you.", actionType: "MEDITATION" },
    ]
};

function getRandomSuggestions(key: string, count: number): Suggestion[] {
    const pool = SUGGESTION_POOL[key] || [];
    // Shuffle and slice
    return [...pool].sort(() => 0.5 - Math.random()).slice(0, count);
}

/**
 * Generates tailored suggestions based on text mood and voice stress.
 */
export function generateSuggestions(
    tags: SentimentTag[],
    voiceMetrics: VoiceStressMetrics | null
): Suggestion[] {
    const suggestions: Suggestion[] = [];
    const uniqueTags = new Set(tags);

    // 1. Voice Stress Handling
    if (voiceMetrics) {
        if (voiceMetrics.pitchVariance > 0.4) {
            suggestions.push(...getRandomSuggestions('CALM_VOICE', 1));
        }
    }

    // 2. Text Mood Handling
    if (uniqueTags.has('anxiety')) {
        suggestions.push(...getRandomSuggestions('ANXIETY', 2));
    }
    if (uniqueTags.has('stress')) {
        suggestions.push(...getRandomSuggestions('STRESS', 2));
    }
    if (uniqueTags.has('depression')) {
        suggestions.push(...getRandomSuggestions('DEPRESSION', 2));
    }
    if (uniqueTags.has('insomnia')) {
        suggestions.push(...getRandomSuggestions('INSOMNIA', 2));
    }
    if (uniqueTags.has('positivity')) {
        suggestions.push(...getRandomSuggestions('POSITIVITY', 1));
    }

    // 3. Fallback / Neutral Handling
    // If no negative/specific tags were triggered, offer maintenance tips
    if (suggestions.length === 0) {
        suggestions.push(...getRandomSuggestions('NEUTRAL', 2));
    }

    // Limit to top 3 suggestions
    return suggestions.slice(0, 3);
}
