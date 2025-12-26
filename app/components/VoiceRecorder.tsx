'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';

interface VoiceRecorderProps {
    /**
     * Callback received when the 10-second recording is finished and decoded.
     * The raw audio data is passed as an AudioBuffer for analysis.
     */
    onProcessingComplete: (audioBuffer: AudioBuffer) => void;
}

export function VoiceRecorder({ onProcessingComplete }: VoiceRecorderProps) {
    const [isRecording, setIsRecording] = useState(false);
    const [timeLeft, setTimeLeft] = useState(10);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const chunksRef = useRef<Blob[]>([]);
    const timerRef = useRef<NodeJS.Timeout | null>(null);
    const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);

    const cleanup = useCallback(() => {
        // Stop tracks
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
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
        setTimeLeft(10);
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            cleanup();
        };
    }, [cleanup]);

    const processAudio = async (blob: Blob) => {
        setIsProcessing(true);
        try {
            const arrayBuffer = await blob.arrayBuffer();
            const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();

            try {
                const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
                onProcessingComplete(audioBuffer);
            } finally {
                await audioContext.close();
            }
        } catch (err) {
            console.error('Error processing audio:', err);
            setError('Failed to process audio recording.');
        } finally {
            setIsProcessing(false);
            // Data is already passed to parent, we can let the Blob be GC'd
        }
    };

    const startRecording = async () => {
        setError(null);
        chunksRef.current = [];

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

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
                await processAudio(blob);
                chunksRef.current = []; // Immediate cleanup of raw data
            };

            mediaRecorder.start();
            setIsRecording(true);

            // Countdown logic
            setTimeLeft(10);
            countdownIntervalRef.current = setInterval(() => {
                setTimeLeft((prev) => {
                    if (prev <= 1) return 0;
                    return prev - 1;
                });
            }, 1000);

            // Auto-stop after 10 seconds
            timerRef.current = setTimeout(() => {
                stopRecording();
            }, 10000);

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
                    00:{timeLeft.toString().padStart(2, '0')}
                </div>

                {isProcessing ? (
                    <div className="flex items-center space-x-2 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-4 py-2 rounded-full border border-emerald-100 dark:border-emerald-900/30">
                        <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span className="text-sm font-medium">Processing Audio...</span>
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
                            </svg>
                        )}
                    </button>
                )}

                <p className="text-xs text-zinc-400 dark:text-zinc-500 text-center max-w-[200px]">
                    {isRecording
                        ? "Recording in progress..."
                        : "Tap to record a 10s sample"}
                </p>
            </div>
        </div>
    );
}
