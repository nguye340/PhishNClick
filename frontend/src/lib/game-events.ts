/**
 * Game Event Dispatcher
 * Allows games to emit events for telemetry tracking without tight coupling
 */

export interface PopupInteractionEvent {
  popupId: string;
  action: 'click' | 'close' | 'ignore';
  wasCorrect: boolean;
  reactionTime: number;
  spawnTime: number;
}

export interface GameEndEvent {
  stats: {
    totalPopups: number;
    correctCount: number;
    mistakeCount: number;
    falsePositives: number;
    falseNegatives: number;
    avgReactionTime: number;
    reactionScore: number;
    confidenceScore: number;
    confidenceRating: 'reckless' | 'balanced' | 'paranoid';
  };
}

export interface QuizCompleteEvent {
  quizData: {
    score: number;
    totalQuestions: number;
    correctAnswers: number;
    incorrectAnswers: number;
    questions: Array<{
      questionType: string;
      popupId: string;
      userAnswer: string;
      correctAnswer: string;
      isCorrect: boolean;
      reactionTime: number;
    }>;
  };
}

export class GameEvents {
  /**
   * Dispatch popup interaction event
   */
  static emitPopupInteraction(data: PopupInteractionEvent) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('popup-interaction', { detail: data });
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch game end event
   */
  static emitGameEnd(data: GameEndEvent) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('game-end', { detail: data });
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch quiz complete event
   */
  static emitQuizComplete(data: QuizCompleteEvent) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('quiz-complete', { detail: data });
      window.dispatchEvent(event);
    }
  }

  /**
   * Dispatch generic game event
   */
  static emit(eventName: string, data: any) {
    if (typeof window !== 'undefined') {
      const event = new CustomEvent(eventName, { detail: data });
      window.dispatchEvent(event);
    }
  }
}
