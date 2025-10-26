/**
 * Universal Game Telemetry Script
 * Can be included in any HTML game to enable backend tracking
 * Usage: <script src="../game-telemetry.js"></script>
 */

(function() {
  'use strict';

  const BACKEND_URL = 'http://localhost:5000';
  let currentSession = null;
  let gameStartTime = null;
  let interactions = [];

  /**
   * Get auth token from parent window or localStorage
   */
  function getAuthToken() {
    try {
      // Try to get from parent window first (if in iframe)
      if (window.parent && window.parent !== window) {
        const parentAuth = window.parent.localStorage.getItem('auth');
        if (parentAuth) {
          const authData = JSON.parse(parentAuth);
          return authData.accessToken;
        }
      }
      
      // Fallback to own localStorage
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        return authData.accessToken;
      }
    } catch (e) {
      console.warn('Could not access auth token:', e);
    }
    return null;
  }

  /**
   * Get user ID from auth or use default test user
   */
  async function getUserId() {
    try {
      if (window.parent && window.parent !== window) {
        const parentAuth = window.parent.localStorage.getItem('auth');
        if (parentAuth) {
          const authData = JSON.parse(parentAuth);
          return authData.userId;
        }
      }
      
      const auth = localStorage.getItem('auth');
      if (auth) {
        const authData = JSON.parse(auth);
        return authData.userId;
      }
    } catch (e) {
      console.warn('Could not access user ID:', e);
    }
    
    // Fallback: Get first user from database for testing
    try {
      const response = await fetch(`${BACKEND_URL}/api/users/first`);
      if (response.ok) {
        const data = await response.json();
        console.log('⚠️ Using test user for telemetry:', data.username);
        return data._id;
      }
    } catch (e) {
      console.warn('Could not fetch test user:', e);
    }
    
    return null;
  }

  /**
   * Make API request with auth
   */
  async function apiRequest(endpoint, method = 'GET', data = null) {
    const token = getAuthToken();
    if (!token) {
      console.warn('⚠️ No auth token, skipping telemetry');
      return null;
    }

    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await fetch(`${BACKEND_URL}${endpoint}`, options);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ API request failed (${endpoint}):`, error);
      return null;
    }
  }

  /**
   * Start a new game session
   */
  window.GameTelemetry = {
    async startSession(mode = 'training') {
      const userId = await getUserId();
      if (!userId) {
        console.warn('⚠️ No user available, telemetry disabled');
        return null;
      }

      try {
        const response = await apiRequest('/api/session/start', 'POST', {
          user_id: userId,
          mode
        });

        if (response) {
          currentSession = {
            sessionId: response._id,
            userId,
            mode,
            startTime: new Date(response.start_time)
          };
          gameStartTime = Date.now();
          interactions = [];
          console.log('✅ Game session started:', currentSession.sessionId);
          return currentSession;
        }
      } catch (error) {
        console.error('❌ Failed to start session:', error);
      }
      return null;
    },

    /**
     * End the current session
     */
    async endSession() {
      if (!currentSession) {
        console.warn('⚠️ No active session to end');
        return;
      }

      try {
        await apiRequest(`/api/session/end/${currentSession.sessionId}`, 'POST');
        console.log('✅ Game session ended:', currentSession.sessionId);
        currentSession = null;
        gameStartTime = null;
      } catch (error) {
        console.error('❌ Failed to end session:', error);
      }
    },

    /**
     * Record a popup/phish interaction
     */
    async recordInteraction(popupId, action, wasCorrect, reactionTimeMs) {
      if (!currentSession) {
        console.warn('⚠️ No active session, skipping interaction');
        return;
      }

      const interaction = {
        session_id: currentSession.sessionId,
        popup_id: popupId,
        timestamp_spawned: new Date(Date.now() - reactionTimeMs),
        timestamp_resolved: new Date(),
        action_taken: action,
        was_correct: wasCorrect,
        reaction_time_ms: reactionTimeMs
      };

      interactions.push(interaction);

      try {
        await apiRequest('/api/popup-event', 'POST', interaction);
        console.log('✅ Interaction recorded');
      } catch (error) {
        console.error('❌ Failed to record interaction:', error);
      }
    },

    /**
     * Save session statistics
     */
    async saveStats(stats) {
      if (!currentSession) {
        console.warn('⚠️ No active session, skipping stats');
        return;
      }

      const sessionStats = {
        session_id: currentSession.sessionId,
        total_popups: stats.totalPopups || 0,
        total_correct: stats.correctCount || 0,
        total_mistakes: stats.mistakeCount || 0,
        false_positives: stats.falsePositives || 0,
        false_negatives: stats.falseNegatives || 0,
        avg_reaction_time_ms: stats.avgReactionTime || 0,
        reaction_score: stats.reactionScore || 50,
        confidence_score: stats.confidenceScore || 50,
        confidence_rating: stats.confidenceRating || 'balanced'
      };

      try {
        await apiRequest('/api/session-stats', 'POST', sessionStats);
        console.log('✅ Session stats saved');
      } catch (error) {
        console.error('❌ Failed to save stats:', error);
      }
    },

    /**
     * Get current session info
     */
    getCurrentSession() {
      return currentSession;
    },

    /**
     * Get all interactions for current session
     */
    getInteractions() {
      return interactions;
    }
  };

  // Auto-start session when page loads (if user is logged in)
  window.addEventListener('load', async () => {
    const userId = getUserId();
    if (userId) {
      await window.GameTelemetry.startSession();
    }
  });

  // Auto-end session when page unloads
  window.addEventListener('beforeunload', () => {
    if (currentSession) {
      // Use sendBeacon for reliable delivery during page unload
      const token = getAuthToken();
      if (token) {
        navigator.sendBeacon(
          `${BACKEND_URL}/api/session/end/${currentSession.sessionId}`,
          JSON.stringify({})
        );
      }
    }
  });

  console.log('🎮 Game Telemetry loaded and ready');
})();
