"use client"

import { useEffect, useRef } from 'react';
import { useAuth } from '@/context/auth.context';
import { gameTelemetry } from '@/lib/game-telemetry';
import PopupManicGame from './popup-manic-game';
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';


/**
 * Wrapper component that adds telemetry tracking to Popup Manic game
 * This approach allows us to add backend integration without modifying the complex game logic
 */
export default function PopupManicWithTelemetry() {
  const { auth } = useAuth();
  const sessionIdRef = useRef<string | null>(null);
  const gameStartTimeRef = useRef<number | null>(null);
  const popupInteractionsRef = useRef<any[]>([]);

  // Start session when component mounts
  useEffect(() => {
    const startSession = async () => {
      try {
        // Use auth userId if available, otherwise fallback to first user
        const session = await gameTelemetry.startSession(auth?.userId || null, 'training');
        sessionIdRef.current = session.sessionId;
        gameStartTimeRef.current = Date.now();
        debugLog('✅ Popup Manic session started:', session.sessionId);
      } catch (error) {
        debugError('❌ Failed to start session:', error);
      }
    };

    startSession();

    // End session when component unmounts
    return () => {
      if (sessionIdRef.current) {
        gameTelemetry.endSession(sessionIdRef.current);
      }
    };
  }, [auth?.userId]);

  // Listen for game events via custom events
  useEffect(() => {
    const handlePopupInteraction = (event: CustomEvent) => {
      const { popupId, action, wasCorrect, reactionTime, spawnTime } = event.detail;
      
      debugLog('🎮 [Telemetry] Popup interaction received:', { popupId, action, wasCorrect });
      
      if (!sessionIdRef.current) {
        debugWarn('⚠️ [Telemetry] No session ID, skipping interaction');
        return;
      }

      const interaction = {
        session_id: sessionIdRef.current,
        popup_id: popupId,
        timestamp_spawned: new Date(spawnTime),
        timestamp_resolved: new Date(),
        action_taken: action,
        was_correct: wasCorrect,
        reaction_time_ms: reactionTime
      };

      popupInteractionsRef.current.push(interaction);
      debugLog('📊 [Telemetry] Recording popup event:', interaction);
      gameTelemetry.recordPopupEvent(interaction);
    };

    const handleGameEnd = async (event: CustomEvent) => {
      debugLog('🏁 [Telemetry] Game end received:', event.detail);
      
      if (!sessionIdRef.current) {
        debugWarn('⚠️ [Telemetry] No session ID, skipping game end');
        return;
      }

      const { stats } = event.detail;
      
      // Save session stats
      await gameTelemetry.saveSessionStats({
        session_id: sessionIdRef.current,
        total_popups: stats.totalPopups || 0,
        total_correct: stats.correctCount || 0,
        total_mistakes: stats.mistakeCount || 0,
        false_positives: stats.falsePositives || 0,
        false_negatives: stats.falseNegatives || 0,
        avg_reaction_time_ms: stats.avgReactionTime || 0,
        reaction_score: stats.reactionScore || 50,
        confidence_score: stats.confidenceScore || 50,
        confidence_rating: stats.confidenceRating || 'balanced'
      });

      // End session
      await gameTelemetry.endSession(sessionIdRef.current);
      sessionIdRef.current = null;
    };

    const handleQuizComplete = async (event: CustomEvent) => {
      if (!auth?.userId) return;

      const { quizData } = event.detail;
      
      await gameTelemetry.saveQuizResult({
        userId: auth.userId,
        score: quizData.score || 0,
        totalQuestions: quizData.totalQuestions || 10,
        correctAnswers: quizData.correctAnswers || 0,
        incorrectAnswers: quizData.incorrectAnswers || 0,
        completedAt: new Date(),
        questions: quizData.questions || []
      });
    };

    // Add event listeners
    window.addEventListener('popup-interaction' as any, handlePopupInteraction);
    window.addEventListener('game-end' as any, handleGameEnd);
    window.addEventListener('quiz-complete' as any, handleQuizComplete);

    return () => {
      window.removeEventListener('popup-interaction' as any, handlePopupInteraction);
      window.removeEventListener('game-end' as any, handleGameEnd);
      window.removeEventListener('quiz-complete' as any, handleQuizComplete);
    };
  }, [auth?.userId]);

  return <PopupManicGame />;
}
