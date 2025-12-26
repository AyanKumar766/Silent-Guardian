/**
 * Audio Analysis Module for Voice Stress Detection
 * 
 * Uses basic Digital Signal Processing (DSP) techniques to extract features
 * correlated with psychological stress:
 * - Pitch Variance (Jitter): Micro-fluctuations in vocal fold vibration.
 * - Energy Variance (Shimmer): Micro-fluctuations in amplitude.
 * - Speaking Rate: Syllable/voiced-segment count over time.
 * 
 * Note: This is a heuristic estimation and not a clinical diagnostic tool.
 */

export interface VoiceStressMetrics {
    pitchVariance: number;  // Standard Deviation of F0 (Hz)
    energyVariance: number; // Standard Deviation of RMS Amplitude
    speakingRate: number;   // Estimated syllables per second (Hz)
    duration: number;       // Total duration processed (seconds)
}

/**
 * Main function to analyze an AudioBuffer and extract stress metrics.
 * @param buffer The Web Audio API AudioBuffer to analyze
 * @returns VoiceStressMetrics object containing numerical feature values
 */
export function analyzeStress(buffer: AudioBuffer): VoiceStressMetrics {
    const channelData = buffer.getChannelData(0); // Use first channel (mono)
    const sampleRate = buffer.sampleRate;

    // Configuration for analysis windows
    const windowSize = 2048; // ~46ms at 44.1kHz
    const hopSize = 1024;    // 50% overlap

    const pitches: number[] = [];
    const energies: number[] = [];

    // Loop through audio data in windows
    for (let i = 0; i < channelData.length - windowSize; i += hopSize) {
        const window = channelData.slice(i, i + windowSize);

        // 1. Calculate Energy (RMS)
        const rms = calculateRMS(window);
        energies.push(rms);

        // 2. Calculate Pitch (F0) using Autocorrelation
        // Only calculate pitch if there is sufficient energy (voicing detection)
        if (rms > 0.01) { // Threshold for silence/noise
            const pitch = detectPitchAutocorrelation(window, sampleRate);
            if (pitch > 0) {
                pitches.push(pitch);
            }
        }
    }

    // 3. Compute Metrics
    const pitchVariance = calculateStandardDeviation(pitches);
    const energyVariance = calculateStandardDeviation(energies);
    const speakingRate = estimateSpeakingRate(energies, buffer.duration);

    return {
        pitchVariance: Number.isNaN(pitchVariance) ? 0 : pitchVariance,
        energyVariance: Number.isNaN(energyVariance) ? 0 : energyVariance,
        speakingRate: Number.isNaN(speakingRate) ? 0 : speakingRate,
        duration: buffer.duration
    };
}

// --- Helper Functions ---

/**
 * Calculates Root Mean Square (energy) of a signal window.
 */
function calculateRMS(samples: Float32Array): number {
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
        sum += samples[i] * samples[i];
    }
    return Math.sqrt(sum / samples.length);
}

/**
 * Detects fundamental frequency (F0) using simplified Autocorrelation.
 * Search range: 80Hz to 400Hz (typical human fundamental frequency range)
 */
function detectPitchAutocorrelation(samples: Float32Array, sampleRate: number): number {
    // Min/Max lags for human voice
    // 80Hz -> sampleRate/80 samples
    // 400Hz -> sampleRate/400 samples
    const minPeriod = Math.floor(sampleRate / 400);
    const maxPeriod = Math.floor(sampleRate / 80);

    let bestCorrelation = -1;
    let bestPeriod = 0;

    // Cross-correlate signal with itself at different lags (periods)
    for (let lag = minPeriod; lag <= maxPeriod; lag++) {
        let sum = 0;
        // Sum of products
        for (let i = 0; i < samples.length - lag; i++) {
            sum += samples[i] * samples[i + lag];
        }

        // Normalize (simple approach) or directly compare sums
        // For pure F0 detection in this range, the peak sum is usually sufficient
        if (sum > bestCorrelation) {
            bestCorrelation = sum;
            bestPeriod = lag;
        }
    }

    // Refinement could be done here (parabolic interpolation), 
    // but for variance estimation, raw peak is okay.

    if (bestPeriod > 0) {
        return sampleRate / bestPeriod;
    }
    return 0; // Pitch not found
}

/**
 * Calculates Standard Deviation of an array of numbers.
 * Used for Jitter (Pitch Variance) and Shimmer (Energy Variance).
 */
function calculateStandardDeviation(data: number[]): number {
    if (data.length === 0) return 0;

    const mean = data.reduce((a, b) => a + b, 0) / data.length;
    const variance = data.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / data.length;

    return Math.sqrt(variance);
}

/**
 * Estimates speaking rate by counting "energy peaks" that resemble syllables.
 * Uses a dynamic threshold based on average local energy.
 */
function estimateSpeakingRate(energyEnvelope: number[], durationInSeconds: number): number {
    if (durationInSeconds <= 0 || energyEnvelope.length === 0) return 0;

    // 1. Smooth the envelope slightly to remove jitter
    const smoothed = smoothArray(energyEnvelope, 3);

    // 2. Calculate dynamic threshold
    const avgEnergy = smoothed.reduce((a, b) => a + b, 0) / smoothed.length;
    const threshold = avgEnergy * 0.8; // Arbitrary 80% of mean energy

    // 3. Count peaks above threshold with basic hysteresis
    let peaks = 0;
    let isAbove = false;

    for (let i = 0; i < smoothed.length; i++) {
        if (!isAbove && smoothed[i] > threshold) {
            isAbove = true;
            peaks++;
        } else if (isAbove && smoothed[i] < threshold * 0.5) {
            // Hysteresis: must drop below 50% of threshold to reset
            isAbove = false;
        }
    }

    return peaks / durationInSeconds; // Syllables per second
}

/**
 * Simple moving average for smoothing
 */
function smoothArray(data: number[], radius: number): number[] {
    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        let count = 0;
        for (let j = Math.max(0, i - radius); j <= Math.min(data.length - 1, i + radius); j++) {
            sum += data[j];
            count++;
        }
        result.push(sum / count);
    }
    return result;
}
