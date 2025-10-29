/**
 * Game Telemetry Service
 * Handles session tracking and event recording for all games
 */

import axios from './axios';
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';


export interface GameSession {
  sessionId: string;
  userId: string;
  mode: 'training' | 'reinforcement' | 'assessment';
  startTime: Date;
}

export interface PopupInteraction {
  session_id: string;
  popup_id: string;
  timestamp_spawned: Date;
  timestamp_resolved: Date;
  action_taken: 'click' | 'close' | 'ignore';
  was_correct: boolean;
  reaction_time_ms: number;
}

export interface SessionStats {
  session_id: string;
  total_popups: number;
  total_correct: number;
  total_mistakes: number;
  false_positives: number;
  false_negatives: number;
  avg_reaction_time_ms: number;
  reaction_score: number;
  confidence_score: number;
  confidence_rating: 'reckless' | 'balanced' | 'paranoid';
}

export interface QuizResult {
  userId: string;
  score: number;
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  completedAt: Date;
  questions: Array<{
    questionType: string;
    popupId: string;
    userAnswer: string;
    correctAnswer: string;
    isCorrect: boolean;
    reactionTime: number;
  }>;
}

class GameTelemetryService {
  private currentSession: GameSession | null = null;

  /**
   * Get first user from database (fallback for testing)
   */
  async getFirstUser(): Promise<string | null> {
    try {
      const response = await axios.get('/api/users/first');
      debugLog('⚠️ Using test user for telemetry:', response.data.username);
      return response.data._id;
    } catch (error) {
      debugWarn('Could not fetch test user:', error);
      return null;
    }
  }

  /**
   * Start a new game session
   */
  async startSession(userId: string | null = null, mode: 'training' | 'reinforcement' | 'assessment' = 'training'): Promise<GameSession> {
    // If no userId provided, try to get first user
    if (!userId) {
      userId = await this.getFirstUser();
      if (!userId) {
        throw new Error('No user available for telemetry');
      }
    }
    try {
      const response = await axios.post('/api/session/start', {
        user_id: userId,
        mode
      });

      this.currentSession = {
        sessionId: response.data._id,
        userId,
        mode,
        startTime: new Date(response.data.start_time)
      };

      debugLog('✅ Game session started:', this.currentSession.sessionId);
      return this.currentSession;
    } catch (error: any) {
      debugError('❌ Failed to start session:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * End the current game session
   */
  async endSession(sessionId?: string): Promise<void> {
    const id = sessionId || this.currentSession?.sessionId;
    if (!id) {
      debugWarn('⚠️ No active session to end');
      return;
    }

    try {
      await axios.post(`/api/session/end/${id}`);
      debugLog('✅ Game session ended:', id);
      this.currentSession = null;
    } catch (error: any) {
      debugError('❌ Failed to end session:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Record a popup interaction event
   */
  async recordPopupEvent(event: PopupInteraction): Promise<void> {
    try {
      await axios.post('/api/popupEvent', event);
      debugLog('✅ Popup event recorded');
    } catch (error: any) {
      debugError('❌ Failed to record popup event:', error.response?.data || error.message);
      // Don't throw - allow game to continue even if telemetry fails
    }
  }

  /**
   * Save session statistics
   */
  async saveSessionStats(stats: SessionStats): Promise<void> {
    try {
      await axios.post('/api/sessionStats', stats);
      debugLog('✅ Session stats saved');
    } catch (error: any) {
      debugError('❌ Failed to save session stats:', error.response?.data || error.message);
      // Don't throw - allow game to continue
    }
  }

  /**
   * Save quiz results
   */
  async saveQuizResult(result: QuizResult): Promise<void> {
    try {
      await axios.post('/api/quiz-result', result);
      debugLog('✅ Quiz result saved');
    } catch (error: any) {
      debugError('❌ Failed to save quiz result:', error.response?.data || error.message);
      // Don't throw - allow game to continue
    }
  }

  /**
   * Get current session
   */
  getCurrentSession(): GameSession | null {
    return this.currentSession;
  }

  /**
   * Batch record multiple popup events (for performance)
   */
  async recordPopupEventsBatch(events: PopupInteraction[]): Promise<void> {
    try {
      await Promise.all(events.map(event => this.recordPopupEvent(event)));
      debugLog(`✅ ${events.length} popup events recorded`);
    } catch (error: any) {
      debugError('❌ Failed to record popup events batch:', error);
    }
  }
}

// Export singleton instance
export const gameTelemetry = new GameTelemetryService();
