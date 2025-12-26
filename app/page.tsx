'use client';

import React, { useState } from 'react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { Journal } from './components/Journal';
import { Settings } from './components/Settings';
import { ApiKeyManager } from './components/ApiKeyManager';
import { analyzeStress, VoiceStressMetrics } from './lib/audioAnalysis';
import { analyzeText, AnalysisResult } from './lib/textAnalysis';
import { evaluateStress, StressResult } from './lib/stressEvaluation';
import { saveMetrics } from './lib/db';
import SpotlightCard from './components/SpotlightCard';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'journal' | 'settings'>('journal');

  // State for holding latest analysis data
  const [insights, setInsights] = useState<{
    voiceMetrics: VoiceStressMetrics | null;
    textResult: AnalysisResult | null;
    safetyStatus: StressResult | null;
  }>({
    voiceMetrics: null,
    textResult: null,
    safetyStatus: null
  });

  const handleAudioProcessing = async (buffer: AudioBuffer) => {
    // 1. Analyze Audio
    const metrics = analyzeStress(buffer);
    console.log('Voice Metrics:', metrics);

    // 2. Save to DB
    await saveMetrics(metrics.pitchVariance, metrics.energyVariance);

    // 3. Update State & Run Safety Evaluation
    setInsights(prev => {
      const newStatus = evaluateStress({
        pitchVariance: metrics.pitchVariance,
        energyVariance: metrics.energyVariance,
        sentimentTag: prev.textResult?.tags[0] // Use primary tag if available
      });

      return {
        ...prev,
        voiceMetrics: metrics,
        safetyStatus: newStatus
      };
    });
  };

  const handleJournalEntry = (text: string) => {
    // 1. Analyze Text
    const result = analyzeText(text);
    console.log('Text Analysis:', result);

    // 2. Update State & Run Safety Evaluation
    setInsights(prev => {
      // Use existing voice metrics if available, else defaults (0) for safety check
      const currentPitch = prev.voiceMetrics?.pitchVariance || 0;
      const currentEnergy = prev.voiceMetrics?.energyVariance || 0;

      const newStatus = evaluateStress({
        pitchVariance: currentPitch,
        energyVariance: currentEnergy,
        sentimentTag: result.tags[0] // Primary tag
      });

      return {
        ...prev,
        textResult: result,
        safetyStatus: newStatus
      };
    });
  };

  // Helper for progress bars
  const getProgressColor = (value: number) => {
    if (value > 0.7) return 'bg-rose-500';
    if (value > 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* Left Zone: Main Interaction (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Dashboard Header / Tab Switcher (Mobile/Desktop) */}
          <div className="flex items-center space-x-4 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-4">
            <button
              onClick={() => setActiveTab('journal')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'journal'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-500'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              Journal & Voice
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`pb-2 px-1 text-sm font-medium transition-colors ${activeTab === 'settings'
                ? 'text-emerald-700 dark:text-emerald-400 border-b-2 border-emerald-600 dark:border-emerald-500'
                : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
            >
              Settings
            </button>
          </div>

          {activeTab === 'journal' ? (
            <>
              {/* Voice Card */}
              <SpotlightCard className="transition-colors duration-300" spotlightColor="rgba(16, 185, 129, 0.2)">
                <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
                  <svg className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                  Voice Check-In
                </h2>
                <div className="flex justify-center">
                  <VoiceRecorder onProcessingComplete={handleAudioProcessing} />
                </div>
              </SpotlightCard>

              {/* Journal Card */}
              <SpotlightCard className="transition-colors duration-300 p-0 overflow-hidden" spotlightColor="rgba(16, 185, 129, 0.2)">
                <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/50">
                  <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Daily Journal
                  </h2>
                </div>
                <div className="p-0">
                  <Journal onEntrySaved={handleJournalEntry} />
                </div>
              </SpotlightCard>
            </>
          ) : (
            <div className="space-y-6">
              <Settings />
              <ApiKeyManager />
            </div>
          )}
        </div>

        {/* Right Zone: System Insights (1/3) */}
        <div className="lg:col-span-1 space-y-6">
          {/* Safety Status Card */}
          <SpotlightCard className="transition-colors duration-300" spotlightColor="rgba(16, 185, 129, 0.2)">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-3">Safety Status</h3>

            {insights.safetyStatus ? (
              <div className={`flex items-center space-x-3 p-3 rounded-lg border transition-colors ${insights.safetyStatus.stressLevel === 'HIGH' ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-900/30' :
                insights.safetyStatus.stressLevel === 'MODERATE' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-900/30' :
                  'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-100 dark:border-emerald-900/30'
                }`}>
                <div className={`w-2.5 h-2.5 rounded-full animate-pulse ${insights.safetyStatus.stressLevel === 'HIGH' ? 'bg-rose-500' :
                  insights.safetyStatus.stressLevel === 'MODERATE' ? 'bg-amber-500' :
                    'bg-emerald-500'
                  }`} />
                <span className={`font-medium ${insights.safetyStatus.stressLevel === 'HIGH' ? 'text-rose-800 dark:text-rose-300' :
                  insights.safetyStatus.stressLevel === 'MODERATE' ? 'text-amber-800 dark:text-amber-300' :
                    'text-emerald-800 dark:text-emerald-300'
                  }`}>
                  {insights.safetyStatus.stressLevel === 'LOW' ? 'Stable' : insights.safetyStatus.stressLevel}
                </span>
              </div>
            ) : (
              <div className="flex items-center space-x-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-100 dark:border-zinc-800 p-3 rounded-lg">
                <div className="w-2.5 h-2.5 bg-zinc-300 dark:bg-zinc-600 rounded-full" />
                <span className="text-zinc-500 dark:text-zinc-400 font-medium">Monitoring...</span>
              </div>
            )}

            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {insights.safetyStatus?.message || "Monitoring voice stress and text sentiment patterns locally."}
            </p>
          </SpotlightCard>

          {/* Insights Card */}
          <SpotlightCard className="transition-colors duration-300" spotlightColor="rgba(16, 185, 129, 0.2)">
            <h3 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-4">Latest Insights</h3>

            <div className="space-y-4">
              {/* Voice Stress Bar */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Voice Stress</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {insights.voiceMetrics ? (insights.voiceMetrics.pitchVariance * 100).toFixed(0) + '%' : '--'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${getProgressColor(insights.voiceMetrics?.pitchVariance || 0)}`}
                    style={{ width: `${Math.min(100, (insights.voiceMetrics?.pitchVariance || 0) * 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Text Sentiment Bar */}
              <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-medium text-zinc-600 dark:text-zinc-300">Text Mood</span>
                  <span className="text-xs text-zinc-400 dark:text-zinc-500">
                    {insights.textResult ? (insights.textResult.score > 0 ? 'Positive' : insights.textResult.score < 0 ? 'Negative' : 'Neutral') : '--'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-1.5 overflow-hidden relative">
                  {/* Centered Neutral Marker */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-zinc-300 dark:bg-zinc-600 z-10" />
                  {/* Bar mapped from -1..1 to 0..100% */}
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${insights.textResult?.score && insights.textResult.score > 0 ? 'bg-emerald-500' : 'bg-rose-500'}`}
                    style={{
                      width: `${Math.abs(insights.textResult?.score || 0) * 50}%`,
                      marginLeft: `${(insights.textResult?.score || 0) < 0 ? 50 - Math.abs((insights.textResult?.score || 0) * 50) : 50}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              {!insights.voiceMetrics && !insights.textResult ? (
                <p className="text-xs text-zinc-400 dark:text-zinc-500 italic">
                  Start a journal entry or record a voice note to see analysis.
                </p>
              ) : (
                <div className="text-xs text-left space-y-2">
                  {insights.safetyStatus?.suggestions.map((suggestion, idx) => (
                    <p key={idx} className="flex items-start text-zinc-600 dark:text-zinc-400">
                      <span className="mr-2 text-emerald-500">•</span>
                      {suggestion}
                    </p>
                  ))}
                </div>
              )}
            </div>
          </SpotlightCard>
        </div>

      </div>
    </div>
  );
}
