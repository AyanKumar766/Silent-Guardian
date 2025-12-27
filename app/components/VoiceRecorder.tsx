'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

// Type definitions for Web Speech API
interface SpeechRecognition extends EventTarget {
    continuous: boolean;
    interimResults: boolean;
    lang: string;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onresult: (event: SpeechRecognitionEvent) => void;
    onerror: (event: SpeechRecognitionErrorEvent) => void;
    onend: () => void;
}

interface SpeechRecognitionConstructor {
    new(): SpeechRecognition;
}

interface SpeechRecognitionEvent {
    resultIndex: number;
    results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}

interface SpeechRecognitionErrorEvent extends Event {
    error: string;
    message: string;
}

declare global {
    interface Window {
        SpeechRecognition?: SpeechRecognitionConstructor;
        webkitSpeechRecognition?: SpeechRecognitionConstructor;
    }
}

interface VoiceRecorderProps {
    /**
     * Callback received when the 10-second recording is finished and decoded.
     * The raw audio data is passed as an AudioBuffer for analysis.
     */
    onProcessingComplete: (audioBuffer: AudioBuffer) => void;
    /**
     * Callback received when speech is transcribed to text.
     */
    onTranscriptionComplete?: (text: string) => void;
    /**
     * Callback for processing state changes (for UI loaders in parent)
     */
    onProcessingStateChange?: (isProcessing: boolean) => void;
}

export function VoiceRecorder({ onProcessingComplete, onTranscriptionComplete, onProcessingStateChange }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const transcriptRef = useRef<string>('');
    const [realtimeText, setRealtimeText] = useState(''); // Trigger re-renders

    const [volume, setVolume] = useState(0); // Audio level 0-100

    const cleanup = useCallback(() => {
        // Stop tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        // Stop recognition
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Ignore errors if already stopped
            }
        }

        // Clear intervals
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }

        mediaRecorderRef.current = null;
        chunksRef.current = []; // Clear stored chunks explicitly
        setIsRecording(false);
        setElapsedTime(0);
        transcriptRef.current = '';
        setVolume(0);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const transcribeWithBackend = async (blob: Blob): Promise<string | null> => {
        // Don't send tiny blobs (likely silence)
        if (blob.size < 1000) return null;

        const formData = new FormData();
        formData.append('file', blob, 'recording.webm');

        try {
            const response = await fetch('http://localhost:5000/transcribe', {
                method: 'POST',
                body: formData,
            });

            if (!response.ok) {
                // If backend returns 500/404, throw to fall back
                throw new Error('Backend transcription failed');
            }

            const data = await response.json();
            // If backend returned "error" field or empty text, fallback might be needed 
            // but usually Whisper is authoritative. 
            if (data.text) return data.text;
            return null;

        } catch (error) {
            console.log('Offline or Backend unavailable, falling back to Web Speech API.');
            return null;
        }
    };

    const processAudio = async (blob: Blob) => {
        setIsProcessing(true);
        if (onProcessingStateChange) onProcessingStateChange(true);

        try {
            // Parallel: Process stress analysis locally AND Try Whisper Backend
            const arrayBuffer = await blob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                onProcessingComplete(audioBuffer);
            } finally {
                await audioContext.close();
            }

            // Try Python Backend for better accuracy
            const backendText = await transcribeWithBackend(blob);

            if (backendText && onTranscriptionComplete) {
                // Use backend text if available
                onTranscriptionComplete(backendText);
                setRealtimeText(backendText); // Update UI
            } else if (onTranscriptionComplete && transcriptRef.current) {
                // Fallback to Web Speech API text
                onTranscriptionComplete(transcriptRef.current.trim());
            }

        } catch (err) {
            console.error('Error processing audio:', err);
            setError('Failed to process audio recording.');
        } finally {
            setIsProcessing(false);
            if (onProcessingStateChange) onProcessingStateChange(false);
        }
    };

    const startRecording = async () => {
        setError(null);
        chunksRef.current = [];
        transcriptRef.current = '';
        setRealtimeText('');

        try {
            // Setup Speech Recognition
            const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

            if (SpeechRecognition) {
                const recognition = new SpeechRecognition();
                recognition.continuous = true;
                recognition.interimResults = true;
                recognition.lang = 'en-US';

                recognition.onresult = (event) => {
                    // Standard Web Speech API Loop
                    // We must rebuild interim every time because it's volatile
                    let interimTranscript = '';
                    let finalTranscriptChunk = '';

                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        if (event.results[i].isFinal) {
                            finalTranscriptChunk += event.results[i][0].transcript;
                        } else {
                            interimTranscript += event.results[i][0].transcript;
                        }
                    }

                    if (finalTranscriptChunk) {
                        transcriptRef.current += finalTranscriptChunk + ' ';
                    }

                    // Display: Persistent Final + Volatile Interim
                    setRealtimeText(transcriptRef.current + interimTranscript);
                };

                recognition.onerror = (event) => {
                    const offlineErrors = ['network', 'service-not-allowed', 'aborted', 'language-not-supported'];

                    if (offlineErrors.includes(event.error)) {
                        console.log('Switched to Offline Mode (Web Speech API error):', event.error);
                        setError(null); // Force clear error
                        setRealtimeText('(Offline mode: Waiting for Whisper...)');
                        return;
                    }

                    console.warn('Speech recognition error code:', event.error); // Warning only for unhandled errors

                    if (event.error !== 'no-speech') {
                        setError(`Speech Recognition Error: ${event.error}`);
                    }
                };

                recognitionRef.current = recognition;
                try {
                    recognition.start();
                } catch (e) {
                    console.error("Failed to start recognition:", e);
                }
            } else {
                console.warn("Speech Recognition not supported or callback missing.");
                if (!SpeechRecognition) {
                    setError("Speech Recognition is not supported in this browser. Please use Chrome or Edge.");
                }
            }

            // Setup Media Recorder
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            // --- AUDIO LEVEL VISUALIZER ---
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const checkVolume = () => {
                if (!setIsRecording) return; // Stop if unmounted/stopped
                analyser.getByteFrequencyData(dataArray);
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;
                setVolume(average); // 0 to 255 typically, but average might be lower

                if (stream.active) {
                    requestAnimationFrame(checkVolume);
                } else {
                    setVolume(0);
                    audioContext.close();
                }
            };
            checkVolume();
            // -----------------------------

            const mediaRecorder = new MediaRecorder(stream);
            mediaRecorderRef.current = mediaRecorder;

            mediaRecorder.ondataavailable = (e) => {
                if (e.data.size > 0) {
                    chunksRef.current.push(e.data);
                }
            };

            mediaRecorder.onstop = async () => {
                const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
                // Immediately cleanup stream to release mic
                if (streamRef.current) {
                    streamRef.current.getTracks().forEach(track => track.stop());
                    streamRef.current = null;
                }

                // Stop recognition logic
                if (recognitionRef.current) {
                    recognitionRef.current.stop();
                    // Note: We delay the final callback until after processAudio 
                    // to give the backend a chance to override.
                }

                await processAudio(blob);
                chunksRef.current = []; // Immediate cleanup of raw data
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Timer logic (Count Up)
            setElapsedTime(0);
            countdownIntervalRef.current = setInterval(() => {
                setElapsedTime((prev) => {
                    if (prev >= 60) return 60;
                    return prev + 1;
                });
            }, 1000);

            // Auto-stop after 60 seconds (1 minute)
            timerRef.current = setTimeout(() => {
                stopRecording();
            }, 60000);

        } catch (err) {
            console.error('Error accessing microphone:', err);
            setError('Could not access microphone. Please check permissions.');
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
            mediaRecorderRef.current.stop();
        }
        if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
        }
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
        setIsRecording(false);
    };

    return (
        <div className="bg-white dark:bg-zinc-900 p-6 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 w-full max-w-md mx-auto transition-colors duration-300">
            <h3 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest mb-6 text-center">Voice Stress Analysis</h3>

            {error && (
                <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg text-sm border border-rose-100 dark:border-rose-900/30">
                    {error}
                </div>
            )}

            <div className="flex flex-col items-center space-y-6">
                <div className={`text-5xl font-mono font-bold tracking-widest transition-colors ${isRecording ? 'text-rose-500 delay-75' : 'text-zinc-300 dark:text-zinc-700'}`}>
                    00:{elapsedTime.toString().padStart(2, '0')}
                </div>

                {/* Mic Volume Meter */}
                {isRecording && (
                    <div className="w-24 h-1 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden mt-2">
                        <div
                            className="h-full bg-emerald-500 transition-all duration-75"
                            style={{ width: `${Math.min(100, volume * 2)}%` }} // Scale up sensitivity
                        />
                    </div>
                )}

                {isProcessing ? (
                    <div className="flex flex-col items-center space-y-2">
                        <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                            <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span className="text-sm font-medium">Processing Audio...</span>
                        </div>
                        <span className="text-xs text-zinc-400">Optimizing with Whisper AI...</span>
                    </div>
                ) : (
                    <button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isProcessing}
                        className={`
              w-20 h-20 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4
              ${isRecording
                                ? 'bg-rose-500 text-white hover:bg-rose-600 ring-4 ring-rose-100 dark:ring-rose-900/40 animate-pulse'
                                : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 hover:bg-rose-500 hover:text-white dark:hover:text-white hover:ring-4 hover:ring-rose-100 dark:hover:ring-rose-900/40'}
              ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
            `}
                        aria-label={isRecording ? "Stop Recording" : "Start Recording"}
                    >
                        {isRecording ? (
                            <div className="w-8 h-8 bg-white rounded-md shadow-sm" />
                        ) : (
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5a3 3 0 013 3v6a3 3 0 11-6 0V8a3 3 0 013-3z" />
                            </svg>
                        )}
                    </button>
                )}

                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-[200px]">
                    {isRecording ? (
                        <span className="animate-pulse text-emerald-600 dark:text-emerald-400 font-medium">
                            Listening...
                        </span>
                    ) : (
                        "Tap to record voice & transcribe"
                    )}
                </p>

                {/* Real-time Transcript Display */}
                {/* We use a min-height to prevent layout jump, but allow expansion */}
                <div className={`w-full transition-all duration-300 ${isRecording || realtimeText ? 'opacity-100 max-h-32' : 'opacity-0 max-h-0'} overflow-hidden`}>
                    <p className="text-center text-sm text-zinc-600 dark:text-zinc-300 italic px-4">
                        "{realtimeText || (isRecording ? "..." : "")}"
                    </p>
                </div>
            </div>
        </div>
    );
}
