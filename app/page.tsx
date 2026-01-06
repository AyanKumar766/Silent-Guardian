'use client';

import React, { useState } from 'react';
import { VoiceRecorder } from './components/VoiceRecorder';
import { Journal } from './components/Journal';
import { analyzeStress, VoiceStressMetrics } from './lib/audioAnalysis';
import { analyzeText, AnalysisResult } from './lib/textAnalysis';
import { evaluateStress, StressResult } from './lib/stressEvaluation';
import { saveMetrics } from './lib/db';
import { generateSuggestions, Suggestion } from './lib/suggestionEngine';
import SpotlightCard from './components/SpotlightCard';
import { SuggestionModal } from './components/SuggestionModal';

import { evaluateSafety, SafetyDecision } from './lib/safety';
import { GroundingScreen } from './components/GroundingScreen';
import { AIViewer } from './components/AIViewer';

export default function Home() {
  const [isBlocked, setIsBlocked] = useState(false); // New: Blocks UI if crisis
  const [isProcessingAudio, setIsProcessingAudio] = useState(false);
  const [isSuggestionModalOpen, setIsSuggestionModalOpen] = useState(false);
  const [aiDebugData, setAiDebugData] = useState<{
    prompt: string | null;
    response: any | null;
    model: string;
    error?: string; // New error field
  }>({ prompt: null, response: null, model: '' });

  // State for holding latest analysis data
  const [insights, setInsights] = useState<{
    voiceMetrics: VoiceStressMetrics | null;
    textResult: AnalysisResult | null;
    safetyStatus: StressResult | null;
    safetyDecision: SafetyDecision | null;
    suggestions: Suggestion[];
  }>({
    voiceMetrics: null,
    textResult: null,
    safetyStatus: null,
    safetyDecision: null,
    suggestions: []
  });

  const handleAudioProcessing = async (buffer: AudioBuffer) => {
    // 1. Analyze Audio
    const metrics = analyzeStress(buffer);
    console.log('Voice Metrics:', metrics);

    // 2. Save to DB
    await saveMetrics(metrics.pitchVariance, metrics.energyVariance);

    // 3. Get current state (we can use the ref or just wait for next render, but for safety checks we valid text)
    // Since we can't await inside setInsights, we access the *current* state value from 'insights' directly
    // Note: State might be slightly stale in a closure, but for 'textResult' it's acceptable as it doesn't change every ms.
    const currentTextResult = insights.textResult;

    // 4. Evaluate Safety Rules (Crisis Check)
    const safetyDecision = evaluateSafety({
      text: currentTextResult ? currentTextResult.triggers[Object.keys(currentTextResult.triggers)[0]]?.[0] || '' : '',
      voiceMetrics: metrics
    });

    if (safetyDecision.status === 'CRISIS') {
      setIsBlocked(true);
    }

    const newStatus = evaluateStress({
      pitchVariance: metrics.pitchVariance,
      energyVariance: metrics.energyVariance,
      sentimentTag: currentTextResult?.tags[0]
    });

    // 5. HYBRID SUGGESTION LOGIC
    const activeTags = currentTextResult?.tags || [];
    let generatedSuggestions: Suggestion[] = [];

    try {
      // Attempt API Call
      const response = await fetch('/api/ask-gemini', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stressLevel: newStatus.stressLevel,
          themes: activeTags
        })
      });

      if (response.ok) {
        const data = await response.json();
        if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
          generatedSuggestions = data.suggestions;

          // Capture for Debug Viewer
          setAiDebugData(prev => ({
            ...prev,
            response: data.suggestions,
            model: data.modelUsed || 'Gemini API'
          }));
        }
      }
    } catch (err) {
      console.log("Gemini API unavailable, using local engine.");
    }

    // Fallback
    if (generatedSuggestions.length === 0) {
      generatedSuggestions = generateSuggestions(activeTags, metrics);
    }

    if (generatedSuggestions.length > 0) {
      setIsSuggestionModalOpen(true);
    }

    // 6. Update State ONCE at the end
    setInsights(prev => ({
      ...prev,
      voiceMetrics: metrics,
      safetyStatus: newStatus,
      safetyDecision: safetyDecision,
      suggestions: generatedSuggestions
    }));

    // 7. Verify Safety (Prompt Builder)
    if (safetyDecision.status === 'SAFE') {
      import('./lib/promptBuilder').then(({ buildGroundingPrompt }) => {
        const prompt = buildGroundingPrompt({
          stressLevel: newStatus.stressLevel,
          themes: currentTextResult?.tags || []
        });
        console.log('--- GENERATED AI PROMPT ---');
        console.log(prompt);
        console.log('---------------------------');
      });
    }
  };

  const handleJournalEntry = async (text: string, shouldShowSuggestions = true) => {
    // 1. Analyze Text
    const result = analyzeText(text);
    console.log('Text Analysis:', result);

    // 2. Local State Access
    // We need voice metrics from current state. 
    // Since we are async, 'insights' from closure might be stale if rapid typing, 
    // but for 'Save' it is usually fine.
    const currentVoiceMetrics = insights.voiceMetrics;

    // 3. Safety Firewall Check
    const decision = evaluateSafety({
      text: text,
      voiceMetrics: currentVoiceMetrics || undefined
    });

    if (decision.status === 'CRISIS') {
      setIsBlocked(true);
    }

    const newStatus = evaluateStress({
      pitchVariance: currentVoiceMetrics?.pitchVariance || 0,
      energyVariance: currentVoiceMetrics?.energyVariance || 0,
      sentimentTag: result.tags[0]
    });

    // 4. Hybrid Suggestions (API + Fallback)
    let generatedSuggestions: Suggestion[] = [];

    // Only attempt API if saving (shouldShowSuggestions is true)
    if (shouldShowSuggestions && decision.status === 'SAFE') {
      try {
        const response = await fetch('/api/ask-gemini', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stressLevel: newStatus.stressLevel,
            themes: result.tags
          })
        });

        if (response.ok) {
          const data = await response.json();
          if (Array.isArray(data.suggestions) && data.suggestions.length > 0) {
            generatedSuggestions = data.suggestions;

            // Capture for Debug Viewer
            setAiDebugData(prev => ({
              ...prev,
              response: data.suggestions,
              model: data.modelUsed || 'Gemini API'
            }));
          }
        }
      } catch (e) {
        console.log('Gemini API failed, using local.');
      }
    }

    // Fallback
    if (generatedSuggestions.length === 0) {
      generatedSuggestions = generateSuggestions(result.tags, currentVoiceMetrics);
    }

    if (generatedSuggestions.length > 0 && shouldShowSuggestions) {
      setIsSuggestionModalOpen(true);
    }

    // 5. Build/Capture Prompt (for Debug Viewer)
    if (decision.status === 'SAFE' && shouldShowSuggestions) {
      import('./lib/promptBuilder').then(({ buildGroundingPrompt }) => {
        const generatedPrompt = buildGroundingPrompt({
          stressLevel: newStatus.stressLevel,
          themes: result.tags
        });
        setAiDebugData(prev => ({ ...prev, prompt: generatedPrompt }));
      });
    }

    // 6. Update State
    setInsights(prev => ({
      ...prev,
      textResult: result,
      safetyStatus: newStatus,
      safetyDecision: decision,
      suggestions: generatedSuggestions
    }));
  };

  // Helper for progress bars
  const getProgressColor = (value: number) => {
    if (value > 0.7) return 'bg-rose-500';
    if (value > 0.4) return 'bg-amber-500';
    return 'bg-emerald-500';
  };



  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* GROUNDING SCREEN OVERLAY */}
      {isBlocked && (
        <GroundingScreen
          reason={insights.safetyDecision?.reason}
          onDismiss={() => setIsBlocked(false)}
        />
      )}

      {/* SUGGESTION MODAL POPUP */}
      <SuggestionModal
        isOpen={isSuggestionModalOpen}
        onClose={() => setIsSuggestionModalOpen(false)}
        suggestions={insights.suggestions}
        safetyStatus={insights.safetyStatus}
        textResult={insights.textResult}
      />

      <div className={`grid grid-cols-1 lg:grid-cols-3 gap-8 ${isBlocked || isSuggestionModalOpen ? 'blur-sm pointer-events-none select-none' : ''}`}>

        {/* Left Zone: Main Interaction (2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Voice Card */}
          <SpotlightCard className="transition-colors duration-300" spotlightColor="rgba(16, 185, 129, 0.2)">
            <h2 className="text-lg font-medium text-zinc-800 dark:text-zinc-100 mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2 text-emerald-600 dark:text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
              Voice Check-In
            </h2>
            <div className="flex justify-center">
              <VoiceRecorder
                onProcessingComplete={handleAudioProcessing}
                onTranscriptionComplete={handleJournalEntry}
                onProcessingStateChange={setIsProcessingAudio}
              />
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
              <Journal
                onEntrySaved={(t) => handleJournalEntry(t, true)}
                onContentChange={(t) => handleJournalEntry(t, false)}
              />
            </div>
          </SpotlightCard>
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



              {/* SUGGESTIONS CARD REMOVED (Replaced by Modal) */}
            </div>

            {/* Stress Signals Display */}
            {insights.textResult && insights.textResult.stressSignals && insights.textResult.stressSignals.length > 0 && (
              <div className="mt-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                <h4 className="text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-2">Detected Signals</h4>
                <div className="flex flex-wrap gap-2">
                  {insights.textResult.stressSignals.map((signal, idx) => (
                    <span key={idx} className="px-2 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 bg-rose-100 dark:bg-rose-900/30 rounded-md">
                      {signal}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

      <AIViewer
        lastPrompt={aiDebugData.prompt}
        lastResponse={aiDebugData.response}
        modelUsed={aiDebugData.model}
      />
    </div>
  );
}
