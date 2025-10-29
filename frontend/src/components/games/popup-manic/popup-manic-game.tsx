"use client"

import React, { useState, useEffect, useRef, useReducer } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fish, LogIn, User, Settings, Info } from "lucide-react"
import { AboutUsModal } from "../../modals/about-us-modal"
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { DraggableWindow } from './draggable-window'
import ModernPopupIntegration from './modern-popup-integration';
import { 
  GameMechanics, 
  initializeGameMechanics,
  handleCorrectAction,
  handleIncorrectAction,
  getCurrentDifficulty,
  generatePopupBehavior,
  setComboTimer,
  calculateGameSummary,
  PopupBehavior,
} from './game-mechanics'
import { GameHUD, ScorePopup, BadgeNotification, DifficultyUpNotification, VirusOutbreakHint } from './game-hud'
import { AnimatedPopup, TrapGIF, InfectionOverlay, FreezeEffect, SlowMotionEffect, InfectedGIF } from './animated-popup'
import { GameSummaryModal } from './game-summary-modal'
import { logEvent } from '../../../lib/telemetry'
import { GameEvents } from '../../../lib/game-events'

// Default dimensions for legacy popups
const DEFAULT_POPUP_SIZE = {
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';

  width: 450, // BIGGER for better visibility
  height: 350  // BIGGER for better visibility
};

// Constants for popup dimensions are defined within the component

// Define the popup model that combines both old and new properties
type PopupStyle = {
  theme: 'windows' | 'mac' | 'modern' | 'retro' | 'custom'
  headerColor: string
  bodyColor: string
  borderColor: string
  borderWidth: number
  borderRadius: number
  fontFamily: string
  fontSize: string
  boxShadow: string
}

type PopupPosition = {
  x: number
  y: number
}

type PopupSize = {
  width: number
  height: number
}

type PopupButton = {
  text: string
  is_safe: boolean
}

type PopupIndicator = {
  element: string
  indicator_type: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

type PopupBrandElements = {
  impersonated_brand_name?: string
  logo_url?: string
}

type PopupPhishingIndicators = {
  misspellings: boolean
  urgencyLanguage: boolean
  suspiciousURL: boolean
  poorFormatting: boolean
  inconsistentBranding: boolean
  grammaticalErrors: boolean
  requestForPersonalInfo: boolean
  unexpectedAttachment: boolean
  threatLanguage: boolean
}

type PopupElements = {
  hasLogo?: boolean
  logoPath?: string
  hasButton?: boolean
  buttonText?: string
  hasInputField?: boolean
  inputFieldLabel?: string
  hasAttachment?: boolean
  attachmentName?: string
  videoGifPath?: string // Path to video GIF for video popups
}

// New popup class that handles both old and new properties
class Popup {
  // Required properties
  id: string
  title: string
  message: string
  style: PopupStyle
  position: PopupPosition
  size: PopupSize
  
  // New model properties
  is_malicious: boolean
  ui_type: string
  category: string
  subtype?: string
  correct_action: string
  
  // UI state properties
  minimized?: boolean
  zIndex?: number
  
  // Optional properties
  brand_elements?: PopupBrandElements
  buttons?: PopupButton[]
  indicators_of_compromise?: PopupIndicator[]
  difficulty_level?: 'easy' | 'medium' | 'hard' | 'expert'
  time_limit_ms?: number
  explanation?: {
    why_this_popup_is_X_type?: string
    what_to_look_for?: string[]
    real_world_impact?: string
    prevention_tips?: string[]
  }
  
  // Legacy properties
  phishingIndicators?: PopupPhishingIndicators
  elements?: PopupElements
  hint?: string
  
  constructor(data: Partial<Popup>) {
    // Required properties with defaults
    const generatedId = data.id || `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    debugLog(`[POPUP CONSTRUCTOR] Creating popup with ID:`, generatedId, 'from data.id:', data.id);
    this.id = generatedId;
    this.title = data.title || ''
    this.message = data.message || ''
    this.style = data.style || {
      theme: 'windows',
      headerColor: '#0078D7',
      bodyColor: '#ffffff',
      borderColor: '#cccccc',
      borderWidth: 1,
      borderRadius: 3,
      fontFamily: 'Segoe UI, sans-serif',
      fontSize: '14px',
      boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
    }
    this.position = data.position || { x: 0, y: 0 }
    this.size = data.size || { width: 300, height: 200 }
    
    // New model properties with defaults
    this.is_malicious = data.is_malicious !== undefined ? data.is_malicious : true
    this.ui_type = data.ui_type || 'system_alert'
    this.category = data.category || (this.is_malicious ? 'security_warning' : 'benign_notification')
    this.correct_action = data.correct_action || (this.is_malicious ? 'FORCE_CLOSE_OS_LEVEL' : 'CLOSE_LEGITIMATE_NATIVE')
    
    // Optional properties
    this.subtype = data.subtype
    this.brand_elements = data.brand_elements
    this.buttons = data.buttons
    this.indicators_of_compromise = data.indicators_of_compromise
    this.difficulty_level = data.difficulty_level
    this.time_limit_ms = data.time_limit_ms
    this.explanation = data.explanation
    
    // Legacy properties
    this.phishingIndicators = data.phishingIndicators
    this.elements = data.elements
    this.hint = data.hint
  }
  
  // Compatibility getters for old code
  get type(): 'malicious' | 'benign' | 'neutral' {
    return this.is_malicious ? 'malicious' : 'benign'
  }
  
  get closeMethod(): 'click_x' | 'click_x_after_time' | 'click_button' | 'slide_away' | 'run_antivirus' | 'hang_up' | 'drag_to_trash' | 'shake_to_close' | 'solve_puzzle' | 'click_all_iocs' | 'no_action' {
    // Map from correct_action to closeMethod
    switch (this.correct_action) {
      case 'CLOSE_LEGITIMATE_NATIVE':
        return 'click_x'
      case 'FORCE_CLOSE_OS_LEVEL':
        return 'click_x_after_time'
      case 'ACCEPT_OFFER':
      case 'DECLINE_OFFER':
      case 'PROCEED_LEGITIMATE_LOGIN':
        return 'click_button'
      case 'IGNORE_UNTIL_AUTOCLOSE':
        return 'no_action'
      case 'HANG_UP_CALL':
        return 'hang_up'
      default:
        return 'click_x' // Default fallback
    }
  }
  
  get correctAction(): 'click' | 'close' | 'ignore' {
    // Map from correct_action to correctAction
    if (this.is_malicious) {
      return 'close'
    } else {
      return this.correct_action.includes('ACCEPT') || 
             this.correct_action.includes('PROCEED') ? 'click' : 'ignore'
    }
  }
}

interface DesktopIcon {
  name: string
  imagePath: string
  action: () => void
}

// Function to fetch a random popup from the database
export async function fetchRandomPopup(type?: string) {
  try {
    // Use the Next.js API route which will proxy the request to the backend
    let url = '/api/popup/random';
    if (type) {
      url += `?type=${type}`;
    }
    debugLog('Fetching popup from:', url);
    
    // Add timeout to avoid long waiting periods
    const response = await axios.get(url, { timeout: 5000 });
    
    // Validate the response data
    if (response.data && response.data.success && response.data.data) {
      debugLog('Successfully fetched popup from API:', response.data.data);
      return response.data.data;
    } else {
      debugWarn('API response missing expected data structure:', response.data);
      throw new Error('Invalid API response format');
    }
  } catch (error: any) {
    // Provide more detailed error information
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      debugError('Cannot connect to backend server. Make sure it is running at:', 
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    } else if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      debugError('API error response:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      debugError('No response received from API. Backend server might be down.');
    } else {
      // Something happened in setting up the request
      debugError('Error setting up request:', error.message);
    }
    
    // Return mock popup data if API call fails
    debugLog('Using mock popup data instead');
    const mockPopup = getMockPopup(type as 'malicious' | 'benign' | 'neutral');
    debugLog('Generated mock popup:', mockPopup);
    return mockPopup;
  }
}

// Get a pre-defined mock popup for testing
export function getMockPopup(type: 'malicious' | 'benign' | 'neutral' = 'benign'): Popup {
  const popupType = type || 'benign';
  const id = uuidv4();
  const position = { 
    x: Math.random() * 500 + 100, 
    y: Math.random() * 300 + 100 
  };
  const size = { width: 400, height: 250 };
  
  // Create a complete Popup object using our class constructor
  return new Popup({
    id: id,
    title: popupType === 'malicious' ? 'Security Alert!' : 'System Notification',
    message: popupType === 'malicious' 
      ? 'Your computer has been infected with a virus! Click here to clean your system.' 
      : 'System update available. Would you like to install now?',
    is_malicious: popupType === 'malicious',
    ui_type: popupType === 'malicious' ? 'system_alert' : 'browser_notification',
    category: popupType === 'malicious' ? 'security_warning' : 'benign_notification',
    correct_action: popupType === 'malicious' ? 'FORCE_CLOSE_OS_LEVEL' : 'ACCEPT_OFFER',
    style: {
      theme: 'windows',
      headerColor: '#0078D7',
      bodyColor: '#ffffff',
      borderColor: '#cccccc',
      borderWidth: 1,
      borderRadius: 4,
      fontFamily: 'Segoe UI, Arial, sans-serif',
      fontSize: '14px',
      boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)'
    },
    position,
    size,
    // Legacy elements for backward compatibility
    elements: {
      hasButton: true,
      buttonText: popupType === 'malicious' ? 'Remove Virus Now' : 'Install Update',
      hasLogo: true,
      logoPath: popupType === 'malicious' ? '/warning.png' : '/info.png',
      hasInputField: false
    },
    // Add buttons for the new model
    buttons: [
      {
        text: popupType === 'malicious' ? 'Remove Virus Now' : 'Install Update',
        is_safe: popupType !== 'malicious'
      },
      {
        text: 'Cancel',
        is_safe: popupType === 'malicious'
      }
    ],
    // Add indicators of compromise for the new model
    indicators_of_compromise: popupType === 'malicious' ? [
      { element: 'message', indicator_type: 'urgency', description: 'The popup uses urgent language to pressure the user', severity: 'high' },
      { element: 'message', indicator_type: 'jargon', description: 'The popup uses technical terms to confuse the user', severity: 'medium' },
      { element: 'title', indicator_type: 'spelling', description: 'The popup contains spelling mistakes', severity: 'medium' }
    ] : [],
    // Legacy phishing indicators for backward compatibility
    phishingIndicators: popupType === 'malicious' ? {
      misspellings: true,
      urgencyLanguage: true,
      suspiciousURL: true,
      poorFormatting: false,
      inconsistentBranding: false,
      grammaticalErrors: false,
      requestForPersonalInfo: true,
      unexpectedAttachment: false,
      threatLanguage: true
    } : undefined
  });
}

// Function to transform API popup to match our Popup interface
// (Removed duplicate; keeping the earlier definition)

// Generate phishing indicators for malicious popups
const generatePhishingIndicators = (): NonNullable<Popup['phishingIndicators']> => {
  const indicators = {
    misspellings: false,
    urgencyLanguage: false,
    suspiciousURL: false,
    poorFormatting: false,
    inconsistentBranding: false,
    grammaticalErrors: false,
    requestForPersonalInfo: false,
    unexpectedAttachment: false,
    threatLanguage: false
  }
  
  // Randomly select 2-4 indicators
  const numIndicators = Math.floor(Math.random() * 3) + 2 // 2-4 indicators
  const allIndicators = Object.keys(indicators)
  const selectedIndicators: string[] = []
  
  // Create a copy of allIndicators to avoid modifying the original
  const availableIndicators = [...allIndicators]
  
  for (let i = 0; i < numIndicators && availableIndicators.length > 0; i++) {
    const randomIndex = Math.floor(Math.random() * availableIndicators.length)
    selectedIndicators.push(availableIndicators.splice(randomIndex, 1)[0])
  }
  
  // Set selected indicators to true
  selectedIndicators.forEach(indicator => {
    if (indicator in indicators) {
      (indicators as any)[indicator] = true
    }
  });
  
  return indicators
}

// Generate random style for a popup based on its type
// (Removed duplicate; keeping the more comprehensive version later in the file)

// Generate random elements for a popup based on its type
// (Removed duplicate; keeping the more comprehensive version later in the file)

// Function to transform API popup to match our Popup interface
const transformPopupFromAPI = (apiPopup: any, position = { x: 0, y: 0 }, size = { width: 300, height: 200 }): Popup => {
  // Generate style based on UI type and category
  const uiType = apiPopup.ui_type || 'system_alert';
  const defaultStyle = generateStyleFromUIType(uiType, apiPopup.is_malicious);
  
  // Create a popup object using our class constructor
  // Always generate a unique ID for each popup instance, even if same API data is used
  return new Popup({
    id: `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: apiPopup.title,
    message: apiPopup.message,
    // Map backend fields directly
    is_malicious: apiPopup.is_malicious,
    ui_type: apiPopup.ui_type,
    category: apiPopup.category,
    subtype: apiPopup.subtype,
    // Frontend positioning
    position,
    size,
    // Map brand elements if available
    brand_elements: apiPopup.brand_elements,
    // Map buttons if available
    buttons: apiPopup.buttons,
    // Map correct action
    correct_action: apiPopup.correct_action,
    // Map indicators of compromise
    indicators_of_compromise: apiPopup.indicators_of_compromise,
    // Game mechanics
    difficulty_level: apiPopup.difficulty_level,
    time_limit_ms: apiPopup.time_limit_ms,
    // Educational content
    explanation: apiPopup.explanation,
    // Frontend styling
    style: defaultStyle
  });
};

// Tutorial content removed - now using educational modal system

// Helper function to generate style based on UI type and malicious status
const generateStyleFromUIType = (uiType: string, isMalicious: boolean) => {
  // Default style
  const style = {
    theme: 'windows' as 'windows' | 'mac' | 'modern' | 'retro' | 'custom',
    headerColor: '#0078D7',
    bodyColor: '#ffffff',
    borderColor: '#cccccc',
    borderWidth: 1,
    borderRadius: 3,
    fontFamily: 'Segoe UI, sans-serif',
    fontSize: '14px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
  };

  // Adjust style based on UI type
  switch (uiType) {
    case 'system_alert':
      style.theme = 'windows';
      if (isMalicious) {
        style.headerColor = '#d9534f'; // Red for malicious
      }
      break;
    case 'browser_notification':
      style.theme = 'modern';
      style.borderRadius = 8;
      break;
    case 'login_form':
      style.theme = 'custom';
      style.borderWidth = 0;
      style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
      break;
    case 'chat_message':
      style.theme = 'modern';
      style.borderRadius = 12;
      style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.1)';
      break;
    // Add more cases for other UI types
    default:
      // Default already set
  }

  return style;
}

// Constants for popup dimensions
const chatWidth = 350;
const chatHeight = 400;
// Video popup default dimensions
const videoWidth = 640;
const videoHeight = 360;

// Define types for the game state
type GameState = {
  score: number;
  level: number;
  gameActive: boolean;
  gameOver: boolean;
  paused: boolean;
  popups: Popup[];
  activePrograms: string[];
  infectedGifs: Array<{id: string, x: number, y: number, rotation: number}>;
  isInfected: boolean;
  showVirusWarning: boolean;
  virusWarningText: string;
  glitchEffect: number;
  popupPositions: {[key: string]: {x: number, y: number}};
  minimizedPopups: Set<string>;
  activePopupId: string | null;
  hintModal: {
    active: boolean;
    popup: Popup | null;
    slide: number;
    currentSlide: number;
  };
  systemCrashed: boolean;
  crashSoundPlayed: boolean;
  showInstructions: boolean;
  mistakes: number;
  puzzleSolved: {[key: string]: boolean};
  shakeCount: {[key: string]: number};
  mousePosition: {x: number, y: number};
  popupTimers: {[key: string]: NodeJS.Timeout};
  xButtonVisible: {[key: string]: boolean};
  clickedIoCs: {[key: string]: string[]};
  lastMousePositions: {[key: string]: {x: number, y: number}[]};
  useModernPopups: boolean;
  levelPassMessage: {show: boolean, level: number};
  quizScore: number;
  quizActive: boolean;
  currentQuiz: any;
  quizQuestions: any[];
  currentQuestionIndex: number;
  quizAnswers: any[];
  showAnswerFeedback: any;
};

type GameAction =
  | { type: 'SET_SCORE'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'SET_GAME_ACTIVE'; payload: boolean }
  | { type: 'SET_GAME_OVER'; payload: boolean }
  | { type: 'SET_PAUSED'; payload: boolean }
  | { type: 'SET_POPUPS'; payload: Popup[] }
  | { type: 'SET_POPUP_POSITIONS'; payload: Record<string, { x: number; y: number }> }
  | { type: 'SET_MINIMIZED_POPUPS'; payload: string[] }
  | { type: 'ADD_POPUP'; payload: Popup }
  | { type: 'REMOVE_POPUP'; payload: string }
  | { type: 'SET_ACTIVE_PROGRAMS'; payload: string[] }
  | { type: 'ADD_INFECTED_GIF'; payload: {id: string, x: number, y: number, rotation: number} }
  | { type: 'SET_INFECTED'; payload: boolean }
  | { type: 'SET_VIRUS_WARNING'; payload: {show: boolean, text?: string} }
  | { type: 'SET_GLITCH_EFFECT'; payload: number }
  | { type: 'UPDATE_POPUP_POSITION'; payload: {id: string, x: number, y: number} }
  | { type: 'TOGGLE_MINIMIZED_POPUP'; payload: string }
  | { type: 'SET_ACTIVE_POPUP'; payload: string | null }
  | { type: 'SET_HINT_MODAL'; payload: Partial<GameState['hintModal']> }
  | { type: 'SET_SYSTEM_CRASHED'; payload: boolean }
  | { type: 'SET_CRASH_SOUND_PLAYED'; payload: boolean }
  | { type: 'SET_SHOW_INSTRUCTIONS'; payload: boolean }
  | { type: 'SET_MISTAKES'; payload: number }
  | { type: 'SET_PUZZLE_SOLVED'; payload: {id: string, solved: boolean} }
  | { type: 'SET_SHAKE_COUNT'; payload: {id: string, count: number} }
  | { type: 'SET_MOUSE_POSITION'; payload: {x: number, y: number} }
  | { type: 'SET_POPUP_TIMER'; payload: {id: string, timer: NodeJS.Timeout | null} }
  | { type: 'SET_X_BUTTON_VISIBLE'; payload: {id: string, visible: boolean} }
  | { type: 'ADD_CLICKED_IOC'; payload: {popupId: string, iocId: string} }
  | { type: 'ADD_MOUSE_POSITION'; payload: { popupId: string, position: { x: number; y: number } } }
  | { type: 'SET_USE_MODERN_POPUPS'; payload: boolean }
  | { type: 'SET_LEVEL_PASS_MESSAGE'; payload: { show: boolean, level: number } }
  | { type: 'SET_QUIZ_SCORE'; payload: number }
  | { type: 'SET_QUIZ_ACTIVE'; payload: boolean }
  | { type: 'SET_CURRENT_QUIZ'; payload: any }
  | { type: 'SET_QUIZ_QUESTIONS'; payload: any[] }
  | { type: 'SET_CURRENT_QUESTION_INDEX'; payload: number }
  | { type: 'SET_QUIZ_ANSWERS'; payload: any[] }
  | { type: 'SET_SHOW_ANSWER_FEEDBACK'; payload: any }
  | { type: 'SET_IS_INFECTED'; payload: boolean }
  | { type: 'SET_INFECTED_GIFS'; payload: Array<{id: string, x: number, y: number, rotation: number}> }
  | { type: 'SET_ACTIVE_POPUP_ID'; payload: string | null };

// Reducer function for game state
function gameReducer(state: GameState, action: GameAction): GameState {
  switch (action.type) {
    case 'SET_SCORE':
      return { ...state, score: action.payload };
    case 'SET_LEVEL':
      return { ...state, level: action.payload };
    case 'SET_GAME_ACTIVE':
      return { ...state, gameActive: action.payload };
    case 'SET_GAME_OVER':
      return { ...state, gameOver: action.payload };
    case 'SET_PAUSED':
      return { ...state, paused: action.payload };
    case 'SET_POPUPS':
      return { ...state, popups: action.payload };
    case 'ADD_POPUP':
      debugLog('[REDUCER] Adding popup to state:', action.payload.id);
      return { ...state, popups: [...state.popups, action.payload] };
    case 'REMOVE_POPUP':
      debugLog('[REDUCER] Removing popup from state:', action.payload);
      // Clean up popup position when removing
      const newPopupPositions = { ...state.popupPositions };
      delete newPopupPositions[action.payload];
      return { 
        ...state, 
        popups: state.popups.filter(popup => popup.id !== action.payload),
        popupPositions: newPopupPositions
      };
    case 'SET_ACTIVE_PROGRAMS':
      return { ...state, activePrograms: action.payload };
    case 'SET_POPUP_POSITIONS':
      return { ...state, popupPositions: action.payload };
    case 'SET_MINIMIZED_POPUPS':
      return { ...state, minimizedPopups: new Set(action.payload) };
    case 'SET_MISTAKES':
      return { ...state, mistakes: action.payload };
    case 'SET_VIRUS_WARNING':
      return {
        ...state,
        showVirusWarning: action.payload.show,
        virusWarningText: action.payload.text || state.virusWarningText
      };
    case 'SET_GLITCH_EFFECT':
      return { ...state, glitchEffect: action.payload };
    case 'UPDATE_POPUP_POSITION':
      return {
        ...state,
        popupPositions: {
          ...state.popupPositions,
          [action.payload.id]: { x: action.payload.x, y: action.payload.y }
        }
      };
    case 'TOGGLE_MINIMIZED_POPUP':
      const minimized = new Set(state.minimizedPopups);
      if (minimized.has(action.payload)) {
        minimized.delete(action.payload);
      } else {
        minimized.add(action.payload);
      }
      return { ...state, minimizedPopups: minimized };
    case 'SET_ACTIVE_POPUP':
      return { ...state, activePopupId: action.payload };
    case 'SET_HINT_MODAL':
      return { ...state, hintModal: { ...state.hintModal, ...action.payload } };
    case 'SET_SYSTEM_CRASHED':
      return { ...state, systemCrashed: action.payload };
    case 'SET_CRASH_SOUND_PLAYED':
      return { ...state, crashSoundPlayed: action.payload };
    case 'SET_SHOW_INSTRUCTIONS':
      return { ...state, showInstructions: action.payload };
    case 'SET_IS_INFECTED':
      return { ...state, isInfected: action.payload };
    case 'SET_INFECTED_GIFS':
      return { ...state, infectedGifs: action.payload };
    case 'SET_PUZZLE_SOLVED':
      return {
        ...state,
        puzzleSolved: {
          ...state.puzzleSolved,
          [action.payload.id]: action.payload.solved
        }
      };
    case 'SET_SHAKE_COUNT':
      return {
        ...state,
        shakeCount: {
          ...state.shakeCount,
          [action.payload.id]: action.payload.count
        }
      };
    case 'SET_MOUSE_POSITION':
      return { ...state, mousePosition: action.payload };
    case 'SET_POPUP_TIMER':
      const timers = { ...state.popupTimers };
      if (action.payload.timer === null) {
        delete timers[action.payload.id];
      } else {
        timers[action.payload.id] = action.payload.timer;
      }
      return { ...state, popupTimers: timers };
    case 'SET_X_BUTTON_VISIBLE':
      return {
        ...state,
        xButtonVisible: {
          ...state.xButtonVisible,
          [action.payload.id]: action.payload.visible
        }
      };
    case 'ADD_CLICKED_IOC':
      const clicked = { ...state.clickedIoCs };
      if (!clicked[action.payload.popupId]) {
        clicked[action.payload.popupId] = [];
      }
      if (!clicked[action.payload.popupId].includes(action.payload.iocId)) {
        clicked[action.payload.popupId].push(action.payload.iocId);
      }
      return { ...state, clickedIoCs: clicked };
    case 'ADD_MOUSE_POSITION':
      const positions = { ...state.lastMousePositions };
      if (!positions[action.payload.popupId]) {
        positions[action.payload.popupId] = [];
      }
      positions[action.payload.popupId].push(action.payload.position);
      // Keep only the last 5 positions
      if (positions[action.payload.popupId].length > 5) {
        positions[action.payload.popupId].shift();
      }
      return { ...state, lastMousePositions: positions };
    case 'SET_USE_MODERN_POPUPS':
      return { ...state, useModernPopups: action.payload };
    case 'SET_LEVEL_PASS_MESSAGE':
      return { ...state, levelPassMessage: action.payload };
    case 'SET_ACTIVE_POPUP_ID':
      return { ...state, activePopupId: action.payload };
    case 'SET_QUIZ_SCORE':
      return { ...state, quizScore: action.payload };
    case 'SET_QUIZ_ACTIVE':
      return { ...state, quizActive: action.payload };
    case 'SET_CURRENT_QUIZ':
      return { ...state, currentQuiz: action.payload };
    case 'SET_QUIZ_QUESTIONS':
      return { ...state, quizQuestions: action.payload };
    case 'SET_CURRENT_QUESTION_INDEX':
      return { ...state, currentQuestionIndex: action.payload };
    case 'SET_QUIZ_ANSWERS':
      return { ...state, quizAnswers: action.payload };
    case 'SET_SHOW_ANSWER_FEEDBACK':
      return { ...state, showAnswerFeedback: action.payload };
    default:
      return state;
  }
}

export default function PopupManicGame() {
  // State management with useReducer
  const [state, dispatch] = useReducer(gameReducer, {
  score: 0,
  level: 1,
  gameActive: false,
  gameOver: false,
  paused: false,
  popups: [],
  activePrograms: [],
  infectedGifs: [],
  isInfected: false,
  showVirusWarning: false,
  virusWarningText: '',
  glitchEffect: 0,
  popupPositions: {},
  minimizedPopups: new Set<string>(),
  
  activePopupId: null,
  hintModal: {
    active: false,
    popup: null,
    slide: 0,
    currentSlide: 1
  },
  systemCrashed: false,
  crashSoundPlayed: false,
  showInstructions: true,
  mistakes: 0,
  puzzleSolved: {},
  shakeCount: {},
  mousePosition: { x: 0, y: 0 },
  popupTimers: {},
  xButtonVisible: {},
  clickedIoCs: {},
  lastMousePositions: {},
  useModernPopups: true,
  levelPassMessage: { show: false, level: 1 },
  quizScore: 0,
  quizActive: false,
  currentQuiz: null,
  quizQuestions: [],
  currentQuestionIndex: 0,
  quizAnswers: [],
  showAnswerFeedback: null
});

// Action creators for type safety
const setScore = (score: number) => dispatch({ type: 'SET_SCORE', payload: score });
const setLevel = (level: number) => dispatch({ type: 'SET_LEVEL', payload: level });
const setGameActive = (active: boolean) => dispatch({ type: 'SET_GAME_ACTIVE', payload: active });
const setGameOver = (over: boolean) => dispatch({ type: 'SET_GAME_OVER', payload: over });
const setPaused = (paused: boolean) => dispatch({ type: 'SET_PAUSED', payload: paused });
const setPopups = (popups: Popup[]) => dispatch({ type: 'SET_POPUPS', payload: popups });
const setPopupPositions = (positions: Record<string, { x: number; y: number }>) => 
  dispatch({ type: 'SET_POPUP_POSITIONS', payload: positions });
const setMinimizedPopups = (minimized: Set<string>) => 
  dispatch({ type: 'SET_MINIMIZED_POPUPS', payload: Array.from(minimized) });
const setMistakes = (mistakes: number) => dispatch({ type: 'SET_MISTAKES', payload: mistakes });
const setShowVirusWarning = (show: boolean, text: string = '') => 
  dispatch({ type: 'SET_VIRUS_WARNING', payload: { show, text } });
const setActivePrograms = (programs: string[]) =>
  dispatch({ type: 'SET_ACTIVE_PROGRAMS', payload: programs });
const setShowInstructions = (show: boolean) =>
  dispatch({ type: 'SET_SHOW_INSTRUCTIONS', payload: show });
const setActivePopupId = (id: string | null) =>
  dispatch({ type: 'SET_ACTIVE_POPUP_ID', payload: id });
const setLevelPassMessage = (payload: { show: boolean; level: number }) =>
  dispatch({ type: 'SET_LEVEL_PASS_MESSAGE', payload });
const setHintModal = (payload: Partial<typeof state.hintModal>) =>
  dispatch({ type: 'SET_HINT_MODAL', payload });
const setSystemCrashed = (crashed: boolean) =>
  dispatch({ type: 'SET_SYSTEM_CRASHED', payload: crashed });
const setIsInfected = (infected: boolean) =>
  dispatch({ type: 'SET_IS_INFECTED', payload: infected });
const setInfectedGifs = (gifs: Array<{id: string, x: number, y: number, rotation: number}>) =>
  dispatch({ type: 'SET_INFECTED_GIFS', payload: gifs });
const addClickedIoC = (popupId: string, iocId: string) =>
  dispatch({ type: 'ADD_CLICKED_IOC', payload: { popupId, iocId } });
const addPopup = (popup: Popup) => {
  // SOUNDS DISABLED - User requested removal of annoying alert audio
  // if (popup.ui_type === 'chat_message' && systemAlertSound2Ref.current) {
  //   // Play chat message sound
  //   systemAlertSound2Ref.current.currentTime = 0;
  //   systemAlertSound2Ref.current.play().catch(err => debugError('Error playing chat sound:', err));
  // } else if ((popup.ui_type === 'system_alert' || popup.ui_type === 'browser_notification') && systemAlertSound1Ref.current) {
  //   // Play system alert sound
  //   systemAlertSound1Ref.current.currentTime = 0;
  //   systemAlertSound1Ref.current.play().catch(err => debugError('Error playing alert sound:', err));
  // } else if (notificationSoundRef.current) {
  //   // Default notification sound for other types
  //   notificationSoundRef.current.currentTime = 0;
  //   notificationSoundRef.current.play().catch(err => debugError('Error playing notification sound:', err));
  // }
  dispatch({ type: 'ADD_POPUP', payload: popup });
};
const removePopup = (id: string) =>
  dispatch({ type: 'REMOVE_POPUP', payload: id });

// Note: removePopupById helper exists later in the file and operates on a popup object.

// NEW GAME MECHANICS STATE
const [mechanics, setMechanics] = useState<GameMechanics>(initializeGameMechanics());
const [popupBehaviors, setPopupBehaviors] = useState<Map<string, PopupBehavior>>(new Map());
const [cursorPosition, setCursorPosition] = useState({ x: 0, y: 0 });
const [popupSpawnTimes, setPopupSpawnTimes] = useState<Map<string, number>>(new Map());
const [scorePopups, setScorePopups] = useState<Array<{id: string, x: number, y: number, value: number, isCombo: boolean}>>([]);
const [showBadge, setShowBadge] = useState<string | null>(null);
const [showDifficultyUp, setShowDifficultyUp] = useState<number | null>(null);
const [showInfection, setShowInfection] = useState(false);
const [trapGIFs, setTrapGIFs] = useState<Array<{id: string, x: number, y: number}>>([]);
const [sillyGifs, setSillyGifs] = useState<Array<{id: string, x: number, y: number, url: string, size: number}>>([]);
const [draggingPopups, setDraggingPopups] = useState<Set<string>>(new Set()); // Track which popups are being dragged
const [showGameSummary, setShowGameSummary] = useState(false);

// Hidden malware system state
const [hiddenMalware, setHiddenMalware] = useState({
  active: false,
  phase: 0, // 0: none, 1: wifi slow, 2: suspicious files, 3: apps crashed
  detectedPopups: [] as string[], // Track malicious popups for scanning
  scanInProgress: false,
  scanResults: null as any,
  quarantineInProgress: false
});
const [safeMode, setSafeMode] = useState(false);
const [suspiciousFiles, setSuspiciousFiles] = useState<Array<{id: string, name: string, icon: string, x: number, y: number}>>([]);
const [infectionEndsAt, setInfectionEndsAt] = useState<number | null>(null);
const [nowTs, setNowTs] = useState<number>(Date.now());

useEffect(() => {
  if (!infectionEndsAt) return;
  const t = setInterval(() => setNowTs(Date.now()), 120);
  return () => clearInterval(t);
}, [infectionEndsAt]);

// Crash the system if infection countdown completes without quarantine
useEffect(() => {
  if (!infectionEndsAt) return;
  if (nowTs >= infectionEndsAt) {
    setInfectionEndsAt(null)
    setSystemCrashed(true)
    setGameOver(true)
    setGameActive(false)
    setHintModal({ active: false, popup: null, slide: 0, currentSlide: 0 })
    if (crashSoundRef.current) { try { crashSoundRef.current.currentTime = 0; crashSoundRef.current.play() } catch {} }
    // Show game summary after crash
    setTimeout(() => setShowGameSummary(true), 3000)
  }
}, [nowTs, infectionEndsAt])

// Request to show the end-game summary; delays if infection countdown is active
const requestShowSummary = React.useCallback(() => {
  if (!infectionEndsAt || nowTs >= infectionEndsAt) {
    setShowGameSummary(true)
  } else {
    const delay = Math.max(0, infectionEndsAt - nowTs + 50)
    setTimeout(() => setShowGameSummary(true), delay)
  }
}, [infectionEndsAt, nowTs])

// Audio refs
const systemAlertSound1Ref = useRef<HTMLAudioElement | null>(null);
const systemAlertSound2Ref = useRef<HTMLAudioElement | null>(null);
const crashSoundRef = useRef<HTMLAudioElement | null>(null);
const notificationSoundRef = useRef<HTMLAudioElement | null>(null);
const virusAlertSoundRef = useRef<HTMLAudioElement | null>(null);
const virusSirenSoundRef = useRef<HTMLAudioElement | null>(null);
const cheerfulSoundRef = useRef<HTMLAudioElement | null>(null);

useEffect(() => {
  // System alert sound for system alerts and warnings
  systemAlertSound1Ref.current = new Audio('/sounds/error-call-to-attention-129258.mp3');
  systemAlertSound1Ref.current.volume = 0.4;
  
  // Chat message sound for chat and messaging popups
  systemAlertSound2Ref.current = new Audio('/sounds/message-incoming-02-199577.mp3');
  systemAlertSound2Ref.current.volume = 0.3;

  // System crash sound
  crashSoundRef.current = new Audio('/sounds/windows-crash.mp3');
  crashSoundRef.current.volume = 0.7;

  // Legacy notification sound (keeping for backward compatibility)
  notificationSoundRef.current = new Audio('/sounds/notification.mp3');
  notificationSoundRef.current.volume = 0.5;

  // Virus outbreak alert sound - play ONCE only
  virusAlertSoundRef.current = new Audio('/sounds/alert-369027.mp3');
  virusAlertSoundRef.current.volume = 0.6;
  virusAlertSoundRef.current.loop = false; // Play once and stop

  // Virus outbreak siren sound - play ONCE only
  virusSirenSoundRef.current = new Audio('/sounds/siren-alert-96052.mp3');
  virusSirenSoundRef.current.volume = 0.1;
  virusSirenSoundRef.current.loop = false; // Play once and stop

  // Cheerful sound for clearing virus outbreak
  cheerfulSoundRef.current = new Audio('/sounds/cartoon-sfx-cheerful-wow-wah-cute-adorable-surprised-338343.mp3');
  cheerfulSoundRef.current.volume = 0.7;

  debugLog('All audio elements initialized with specific sounds including virus outbreak sounds');
}, [])

// Cleanup audio when component unmounts or user leaves the game
React.useEffect(() => {
  return () => {
    debugLog('[Cleanup] Stopping all virus outbreak audio on component unmount');
    
    // Stop virus outbreak sounds
    if (virusAlertSoundRef.current) {
      virusAlertSoundRef.current.pause();
      virusAlertSoundRef.current.currentTime = 0;
      debugLog('[Cleanup] Stopped virus alert sound');
    }
    
    if (virusSirenSoundRef.current) {
      virusSirenSoundRef.current.pause();
      virusSirenSoundRef.current.currentTime = 0;
      debugLog('[Cleanup] Stopped virus siren sound');
    }
    
    // Stop all other audio elements
    if (systemAlertSound1Ref.current) {
      systemAlertSound1Ref.current.pause();
    }
    
    if (systemAlertSound2Ref.current) {
      systemAlertSound2Ref.current.pause();
    }
    
    if (cheerfulSoundRef.current) {
      cheerfulSoundRef.current.pause();
    }
    
    // Clear any global references
    if ((window as any).clearVirusOutbreak) {
      delete (window as any).clearVirusOutbreak;
    }
    
    debugLog('[Cleanup] All audio cleanup completed');
  };
}, [])

// Track cursor position for avoiding popups
useEffect(() => {
  const handleMouseMove = (e: MouseEvent) => {
    setCursorPosition({ x: e.clientX, y: e.clientY });
  };
  
  window.addEventListener('mousemove', handleMouseMove);
  return () => window.removeEventListener('mousemove', handleMouseMove);
}, []);

// ...
  const [updatingSoftware, setUpdatingSoftware] = useState(false)
  const [softwareUpdateProgress, setSoftwareUpdateProgress] = useState<{[key: string]: number}>({
    'Firecat Browser': 0,
    'Nyantivirus': 0,
    'Windows Security': 0
  })
  
  // Firecat browser state
  const [firecatOpen, setFirecatOpen] = useState(false);
  const [taskManagerOpen, setTaskManagerOpen] = useState(false);
  const [updateWindowOpen, setUpdateWindowOpen] = useState(false);
  const [notepadOpen, setNotepadOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialFocus, setTutorialFocus] = useState<string | null>(null);
  const [firecatUrl, setFirecatUrl] = useState('https://www.meowgle.com')
  const [browserHistory, setBrowserHistory] = useState<string[]>(['https://www.meowgle.com'])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState('meowgle')
  const [bookmarks, setBookmarks] = useState([
    { name: 'Meowgle', url: 'https://www.meowgle.com' },
    { name: 'CatBook', url: 'https://www.catbook.com' },
    { name: 'Purr-mail', url: 'https://mail.purr.com' },
    { name: 'Whisker News', url: 'https://www.whiskernews.com' }
  ])

  // Tutorial content for onboarding
  const tutorialContent = React.useMemo(() => ([
    {
      title: 'Nyantivirus (Critical)',
      lines: [
        'Run Scan often: checks system health, finds malware, and quarantines threats.',
        'Quarantine removes malicious popups, infected GIFs, and suspicious files immediately.',
        'Keep it Updated: open Software Update Center to update Nyantivirus.',
        'Requires Internet for updates.'
      ]
    },
    {
      title: 'Software Update Center',
      lines: [
        'Keeps core apps updated (Nyantivirus, Windows Security, Firecat).',
        'Click Update All. If WiFi is off, updates are blocked with an error.',
        'Update regularly to reduce infections.'
      ]
    },
    {
      title: 'Task Manager',
      lines: [
        'Check system health (CPU/Memory/Disk/Network).',
        'Find and end suspicious background tasks (e.g., coolbeans, totallysafe).',
        'Use it to stop runaway malware processes.'
      ]
    },
    {
      title: 'WiFi / Internet',
      lines: [
        'Turning WiFi off can slow ads for a moment.',
        'But you cannot update Nyantivirus or use Firecat when offline.'
      ]
    },
    {
      title: 'Firecat Browser',
      lines: [
        'Requires Internet connection.',
        'Used for browsing educational links. Disabled when offline.'
      ]
    },
    {
      title: 'Notes / Manuals (Notepad)',
      lines: [
        'Open anytime to review the step-by-step containment checklist.',
        'Contains tips on scanning, quarantining, updating and using Task Manager.'
      ]
    }
  ]), [])
  
  // Tutorial is shown AFTER user presses Start Game. No pre-start auto-open.
  useEffect(() => {
    // intentionally empty
  }, [])

  // Tutorial helper: just spotlight the relevant icon (no app auto-open)
  const openRelevantAppForStep = React.useCallback(() => {
    const map = ['meowarebytes', 'updatesoftware', 'taskmanager', 'wifi', 'firecat', 'notepad'] as const
    setTutorialFocus(map[Math.min(map.length - 1, Math.max(0, tutorialStep))])
  }, [tutorialStep])

  // Keep spotlight in sync with current tutorial step
  useEffect(() => {
    if (!showTutorial) return
    openRelevantAppForStep()
  }, [tutorialStep, showTutorial, openRelevantAppForStep])
  
  // Task Manager state
  const [taskManagerTab, setTaskManagerTab] = useState<'processes' | 'performance'>('processes')
  const [systemResources, setSystemResources] = useState({
    cpu: 30,
    memory: 45,
    disk: 20,
    network: 15
  })
  const [malwareDetected, setMalwareDetected] = useState(false)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [wifiMenuOpen, setWifiMenuOpen] = useState(false)
  const [wifiStatus, setWifiStatus] = useState<'connected' | 'poor' | 'disconnected'>('connected')

  // Software Update Center: drive progress while updatingSoftware is true
  useEffect(() => {
    if (!updatingSoftware) return
    const tick = setInterval(() => {
      setSoftwareUpdateProgress(prev => {
        const next = { ...prev }
        Object.keys(next).forEach((k) => {
          if (next[k] < 100) {
            // Nyantivirus a bit faster to emphasize urgency
            const inc = k === 'Nyantivirus' ? 4 + Math.floor(Math.random() * 4) : 2 + Math.floor(Math.random() * 3)
            next[k] = Math.min(100, next[k] + inc)
          }
        })
        return next
      })
    }, 220)
    return () => clearInterval(tick)
  }, [updatingSoftware])

  // Stop updating when all reach 100%
  useEffect(() => {
    if (!updatingSoftware) return
    const done = Object.values(softwareUpdateProgress).every(v => v >= 100)
    if (done) setUpdatingSoftware(false)
  }, [softwareUpdateProgress, updatingSoftware])
  
  // Tutorial system removed - now using educational modal system
  const [seenPopupCategories, setSeenPopupCategories] = useState<Set<string>>(new Set())
  
  // Track popup interactions to prevent spam clicking
  const [interactedPopups, setInteractedPopups] = useState<Set<string>>(new Set())
  
  // Quiz system state (using reducer state, not separate useState)
  const [encounteredPopups, setEncounteredPopups] = useState<Popup[]>([])
  const [quizStartTime, setQuizStartTime] = useState<number>(0)
  const [questionStartTime, setQuestionStartTime] = useState<number>(0)
  const [completedQuizzes, setCompletedQuizzes] = useState<any[]>([])
  const [dragDropSelections, setDragDropSelections] = useState<{[key: string]: string}>({})
  const [dragDropSubmitted, setDragDropSubmitted] = useState<boolean>(false)
  
  // Use hardcoded mock session data instead of actual authentication
  useEffect(() => {
    // Mock session data
    const mockSession = {
      user: {
        id: '123456',
        name: 'Test User',
        email: 'test@example.com',
      },
      expires: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    }
    
    // Set the mock session
    const setSession = (_: any) => {} // no-op to satisfy legacy reference
    setSession(mockSession)
    debugLog('Using mock session:', mockSession)
    
    // CRITICAL: Ensure game stays inactive until user clicks START GAME
    debugLog('[AUTO-START FIX] Ensuring game remains inactive on component mount')
    setGameActive(false)
    setShowInstructions(true)
  }, [])

  // Random virus outbreak system
  useEffect(() => {
    if (!state.gameActive || state.gameOver || state.systemCrashed) {
      return;
    }

    // Schedule random virus outbreak between 50-120 seconds
    const scheduleVirusOutbreak = () => {
      const randomDelay = Math.random() * (120000 - 50000) + 50000; // 50-120 seconds in milliseconds
      debugLog(`[VirusOutbreak] Next outbreak scheduled in ${Math.round(randomDelay / 1000)} seconds`);
      
      return setTimeout(() => {
        // Double-check game is still active before triggering
        if (state.gameActive && !state.gameOver && !state.hintModal.active) {
          triggerRandomVirusOutbreak();
          // Schedule the next outbreak only if game is still active
          if (state.gameActive) {
            const nextTimer = scheduleVirusOutbreak();
            return nextTimer;
          }
        } else {
          debugLog('[VirusOutbreak] Skipping outbreak scheduling - game not active');
        }
      }, randomDelay);
    };

    let virusTimer: any = null; // Disabled: random virus outbreaks
    // virusTimer = scheduleVirusOutbreak();

    return () => {
      if (virusTimer) {
        clearTimeout(virusTimer);
      }
    };
  }, [state.gameActive, state.gameOver, state.systemCrashed]);

  // Game loop for automatic popup spawning
  useEffect(() => {
    if (!state.gameActive || state.gameOver || state.systemCrashed) {
      return;
    }

    // Use difficulty-based spawn interval from new mechanics
    const difficulty = getCurrentDifficulty(mechanics);
    const spawnInterval = difficulty.spawnInterval;
    debugLog(`[GameLoop] Starting popup spawn timer, interval: ${spawnInterval}ms, difficulty level: ${mechanics.difficulty + 1}`);

    const spawnTimer = setInterval(async () => {
      // Don't spawn if too many popups already exist
      if (state.popups.length >= 5) {
        return;
      }

      debugLog(`[GameLoop] Spawning new popup, current count: ${state.popups.length}`);
      
      try {
        // Fetch a random popup from the API
        const apiPopup = await fetchRandomPopup();
        
        if (apiPopup) {
          // Force phone UI type occasionally (25% chance)
          if (Math.random() < 0.25) {
            apiPopup.ui_type = 'phone_call_ui';
          }
          
          // Transform the API popup to match our Popup interface
          const randomPopup = transformPopupFromAPI(apiPopup);
          
          // Generate position for the popup
          const popupPosition = generateRandomPosition(randomPopup.ui_type);
          
          // Filter out debug messages from popup titles
          if (randomPopup.title && (randomPopup.title.includes('DEBUG') || randomPopup.title.includes('Generic Browser'))) {
            debugLog(`[GameLoop] Skipping debug popup: ${randomPopup.title}`);
            return; // Skip this popup
          }
          
          // Add the popup to the state using addPopup action
          debugLog(`[GameLoop] Adding popup ${randomPopup.id} to state`);
          addPopup(randomPopup);
          setPopupPositions({
            ...state.popupPositions,
            [randomPopup.id]: popupPosition
          });
          
          // Generate behavior for new mechanics
          const difficulty = getCurrentDifficulty(mechanics);
          const behavior = generatePopupBehavior(randomPopup.id, difficulty);
          setPopupBehaviors(prev => new Map(prev).set(randomPopup.id, behavior));
          setPopupSpawnTimes(prev => new Map(prev).set(randomPopup.id, Date.now()));
          
          // Spawn trap GIF if this is a trap popup
          if (behavior.isTrap) {
            const trapX = popupPosition.x + (randomPopup.size?.width || 450) / 2 - 50;
            const trapY = popupPosition.y + (randomPopup.size?.height || 350) / 2 - 50;
            setTrapGIFs(prev => [...prev, { id: `trap-${randomPopup.id}`, x: trapX, y: trapY }]);

            // Also spawn a clickable infected GIF near the trap starting at level >= 3
            if (state.level >= 3) {
              spawnSillyGifNear(trapX, trapY);
            }
          }
          
          playPopupSound();
          
          debugLog(`[GameLoop] Spawned popup ${randomPopup.id} at position:`, popupPosition, 'behavior:', behavior.type);
        } else {
          // Fallback to generating a random popup if API fails
          const fallbackPopup = generateFallbackPopup();
          const popupPosition = generateRandomPosition(fallbackPopup.ui_type);
          
          debugLog(`[GameLoop] Adding fallback popup ${fallbackPopup.id} to state`);
          addPopup(fallbackPopup);
          setPopupPositions({
            ...state.popupPositions,
            [fallbackPopup.id]: popupPosition
          });
          
          // Generate behavior for fallback popup too
          const difficulty = getCurrentDifficulty(mechanics);
          const behavior = generatePopupBehavior(fallbackPopup.id, difficulty);
          setPopupBehaviors(prev => new Map(prev).set(fallbackPopup.id, behavior));
          setPopupSpawnTimes(prev => new Map(prev).set(fallbackPopup.id, Date.now()));
          
          if (behavior.isTrap) {
            const trapX = popupPosition.x + (fallbackPopup.size?.width || 450) / 2 - 50;
            const trapY = popupPosition.y + (fallbackPopup.size?.height || 350) / 2 - 50;
            setTrapGIFs(prev => [...prev, { id: `trap-${fallbackPopup.id}`, x: trapX, y: trapY }]);

            // Also spawn a clickable infected GIF near the trap starting at level >= 3
            if (state.level >= 3) {
              spawnSillyGifNear(trapX, trapY);
            }
          }
          
          playPopupSound();
          
          debugLog(`[GameLoop] Spawned fallback popup ${fallbackPopup.id} at position:`, popupPosition, 'behavior:', behavior.type);
        }
      } catch (error) {
        debugError('[GameLoop] Error spawning popup:', error);
      }
    }, spawnInterval);

    return () => {
      debugLog(`[GameLoop] Clearing spawn timer`);
      clearInterval(spawnTimer);
    };
  }, [state.gameActive, state.gameOver, state.systemCrashed, state.level, state.popups.length, mechanics.difficulty])

  // Infected GIF assets (subset paths from public/silly-gif)
  const SILLY_GIF_URLS = React.useMemo(
    () => [
      '/silly-gif/silly-gif (1).gif','/silly-gif/silly-gif (2).gif','/silly-gif/silly-gif (3).gif','/silly-gif/silly-gif (4).gif','/silly-gif/silly-gif (5).gif',
      '/silly-gif/silly-gif (6).gif','/silly-gif/silly-gif (7).gif','/silly-gif/silly-gif (8).gif','/silly-gif/silly-gif (9).gif','/silly-gif/silly-gif (10).gif'
    ],
    []
  )

  // Spawn a clickable infected GIF near given coordinates
  function spawnSillyGifNear(x: number, y: number) {
    const url = SILLY_GIF_URLS[Math.floor(Math.random() * SILLY_GIF_URLS.length)] || '/silly-gif/silly-gif (1).gif'
    const size = 96 + Math.floor(Math.random() * 48)
    const offsetX = (Math.random() - 0.5) * 160
    const offsetY = (Math.random() - 0.5) * 120
    const gx = Math.max(16, Math.min(window.innerWidth - size - 16, x + offsetX))
    const gy = Math.max(16, Math.min(window.innerHeight - size - 80, y + offsetY))
    const id = `gif-${Date.now()}-${Math.random().toString(36).slice(2,8)}`
    setSillyGifs(prev => [...prev, { id, x: gx, y: gy, url, size }])
  }

  // Handle infected GIF click (triggers infection like trap)
  function handleInfectedGifClick(gifId: string) {
    setShowInfection(true)
    setTimeout(() => setShowInfection(false), 3000)
    const newMechanics = handleIncorrectAction(mechanics, true)
    setMechanics(newMechanics)
    setSillyGifs(prev => prev.filter(g => g.id !== gifId))
    // Trigger full-system infection visuals and countdown
    setMalwareDetected(true)
    try { startFullSystemInfection() } catch {}
    if (newMechanics.lives === 0) {
      if (crashSoundRef.current) {
        try { crashSoundRef.current.currentTime = 0; crashSoundRef.current.play() } catch {}
      }
      setGameOver(true)
      setGameActive(false)
      setTimeout(requestShowSummary, 3000)
    }
  }

  // Disable random virus outbreak scheduling – infection appears only on bomb/GIF clicks
  useEffect(() => {
    return () => {}
  }, [])

  // Desktop icons configuration - organized in two columns
  const leftColumnIcons: DesktopIcon[] = [
    {
      name: "Firecat",
      imagePath: "/img/firecat-taskbar.png",
      action: () => {
        debugLog("Opening Firecat browser")
        setFirecatOpen(true)
        const programs = state.activePrograms.includes("firecat")
          ? state.activePrograms
          : [...state.activePrograms, "firecat"]
        setActivePrograms(programs)
      }
    },
    {
      name: "Nyantivirus",
      imagePath: "/img/meowareBytes-taskbar.png",
      action: () => {
        debugLog("Opening Nyantivirus")
        setActivePrograms([...state.activePrograms, "meowarebytes"])
        
        // If there are popups that require running antivirus to close
        const antivirusPopups = state.popups.filter(p => p.closeMethod === 'run_antivirus')
        if (antivirusPopups.length > 0) {
          antivirusPopups.forEach(popup => {
            handlePopupAction(popup, 'close')
          })
        }
      }
    },
    {
      name: "Notepad",
      imagePath: "/img/notepad-taskbar.png",
      action: () => {
        debugLog("Opening Notepad")
        setActivePrograms([...state.activePrograms, "notepad"])
      }
    }
  ]
  
  const rightColumnIcons: DesktopIcon[] = [
    {
      name: "Task Manager",
      imagePath: "/img/TaskManager-taskbar.png",
      action: () => {
        debugLog("Opening Task Manager")
        setTaskManagerOpen(true)
        const programs = state.activePrograms.includes("taskmanager")
          ? state.activePrograms
          : [...state.activePrograms, "taskmanager"]
        setActivePrograms(programs)
        
        // Randomly increase system resources when Task Manager is opened
        // to simulate background processes
        if (malwareDetected) {
          setSystemResources(prev => ({
            cpu: Math.min(95, prev.cpu + 15),
            memory: Math.min(90, prev.memory + 20),
            disk: Math.min(85, prev.disk + 10),
            network: Math.min(80, prev.network + 25)
          }))
        }
      }
    },
    {
      name: "Recycle Bin",
      imagePath: "/img/RecycleBin-taskbar.png",
      action: () => {
        debugLog("Opening Recycle Bin")
        setActivePrograms([...state.activePrograms, "recyclebin"])
        
        // If there are popups that require dragging to trash
        const trashPopups = state.popups.filter(p => p.closeMethod === 'drag_to_trash')
        if (trashPopups.length > 0) {
          // Consider popups near the recycle bin as dragged to it
          trashPopups.forEach(popup => {
            handlePopupAction(popup, 'close')
          })
        }
      }
    }
  ]

  // --- Lightweight Sound System (Web Audio) ---
  const audioCtxRef = useRef<AudioContext | null>(null)
  const masterGainRef = useRef<GainNode | null>(null)
  const ensureAudio = () => {
    if (!audioCtxRef.current) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
      const gain = ctx.createGain()
      gain.gain.value = 0.15 // overall volume
      gain.connect(ctx.destination)
      audioCtxRef.current = ctx
      masterGainRef.current = gain
    }
  }
  const playBeep = (freq: number, durationMs: number, type: OscillatorType = 'sine') => {
    try {
      ensureAudio()
      const ctx = audioCtxRef.current!
      const out = masterGainRef.current!
      const osc = ctx.createOscillator()
      const env = ctx.createGain()
      osc.type = type
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      env.gain.setValueAtTime(0, ctx.currentTime)
      env.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.01)
      env.gain.linearRampToValueAtTime(0, ctx.currentTime + durationMs / 1000)
      osc.connect(env)
      env.connect(out)
      osc.start()
      osc.stop(ctx.currentTime + durationMs / 1000 + 0.02)
    } catch {}
  }
  const playPopupSound = () => {
    // short bright blip
    playBeep(880, 90, 'triangle')
  }
  const playCorrectSound = () => {
    // quick upward double chime
    playBeep(660, 80, 'sine')
    setTimeout(() => playBeep(990, 100, 'sine'), 90)
  }
  const playWrongSound = () => {
    // short buzzy low tone
    playBeep(220, 140, 'square')
  }

  // React to quiz answer feedback to play sounds
  useEffect(() => {
    const f: any = (state as any)?.showAnswerFeedback;
    if (f == null) return;
    const ok = typeof f === 'boolean' ? f : !!f?.isCorrect;
    if (ok) playCorrectSound(); else playWrongSound();
  }, [(state as any)?.showAnswerFeedback]);

  // Antivirus modal state and handlers
  const [antivirusModalOpen, setAntivirusModalOpen] = useState(false)
  const [antivirusModalStep, setAntivirusModalStep] = useState<'confirm' | 'scanning' | 'done'>('confirm')
  const [antivirusProgress, setAntivirusProgress] = useState(0)
  const [antivirusResult, setAntivirusResult] = useState<'healthy' | 'unhealthy' | 'infected' | null>(null)

  const computeAntivirusResult = (): 'healthy' | 'unhealthy' | 'infected' => {
    // Gate only on AV update and connectivity first
    const nyanProg = (softwareUpdateProgress || {})['Nyantivirus'] ?? 0
    if (nyanProg < 100 || wifiStatus !== 'connected') {
      return 'unhealthy'
    }
    // If AV is updated and system shows active threats, report infected
    if (
      (state.infectedGifs && state.infectedGifs.length > 0) ||
      (hiddenMalware as any)?.active ||
      malwareDetected ||
      (trapGIFs && trapGIFs.length > 0) ||
      (sillyGifs && sillyGifs.length > 0)
    ) {
      return 'infected'
    }
    // Otherwise, if there are suspicious files lingering, still show unhealthy
    if ((suspiciousFiles?.length ?? 0) > 0) return 'unhealthy'
    return 'healthy'
  }

  const startAntivirusScan = () => {
    setAntivirusModalStep('scanning')
    setAntivirusProgress(0)
    // fake progress
    const start = Date.now()
    const interval = setInterval(() => {
      setAntivirusProgress(prev => {
        const elapsed = Date.now() - start
        const base = Math.min(100, Math.round(prev + 5 + Math.random() * 8))
        const capped = elapsed > 1600 ? Math.min(100, Math.max(base, 92)) : base
        if (capped >= 100) {
          clearInterval(interval)
          // complete scan and clean
          setTimeout(() => {
            const result = computeAntivirusResult()
            setAntivirusResult(result)
            setAntivirusModalStep('done')
            // Play a cheerful tone on successful scan completion
            if (cheerfulSoundRef.current) {
              try { cheerfulSoundRef.current.currentTime = 0; cheerfulSoundRef.current.play() } catch {}
            }
            // If system is infected but no outbreak visuals yet, trigger full infection visuals & countdown
            if (result === 'infected' && (!state.infectedGifs || state.infectedGifs.length === 0)) {
              try { startFullSystemInfection() } catch {}
            }
          }, 250)
          return 100
        }
        return capped
      })
    }, 120)
  }

  const closeAntivirusModal = () => {
    setAntivirusModalOpen(false)
    setAntivirusModalStep('confirm')
    setAntivirusProgress(0)
    setAntivirusResult(null)
  }

  // Quiz result modal state
  const [quizResultModal, setQuizResultModal] = useState<{ open: boolean; passed: boolean; correctCount: number; percentage: number }>({ open: false, passed: false, correctCount: 0, percentage: 0 })
  const dismissQuizResultModal = () => {
    // Reset quiz state and resume game
    dispatch({ type: 'SET_QUIZ_ACTIVE', payload: false });
    dispatch({ type: 'SET_CURRENT_QUIZ', payload: null });
    dispatch({ type: 'SET_QUIZ_QUESTIONS', payload: [] });
    dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: 0 });
    dispatch({ type: 'SET_QUIZ_ANSWERS', payload: [] });
    dispatch({ type: 'SET_QUIZ_SCORE', payload: 0 });
    setQuizResultModal({ open: false, passed: false, correctCount: 0, percentage: 0 });
    setPaused(false);
  }

  // Start the game
  const startGame = () => {
    // initialize audio context upon first user interaction
    ensureAudio()
    setShowInstructions(false)
    setGameActive(true)
    try { logEvent({ type: 'game_started', game: 'Popup Manic', ts: Date.now() }); } catch {}
    // Start guided tutorial after game starts
    setShowTutorial(true)
    setTutorialStep(0)
    setTutorialFocus('meowarebytes') // Nyantivirus first
    setScore(0)
    setLevel(1)
    setMistakes(0)
    setGameOver(false)
    dispatch({ type: 'SET_POPUPS', payload: [] }) // Clear popups using dispatch
    setPopupPositions({})
    setMinimizedPopups(new Set())
    setInteractedPopups(new Set())
    setActivePopupId(null)
    setHintModal({active: false, popup: null, slide: 1, currentSlide: 0})
    dispatch({ type: 'SET_QUIZ_ACTIVE', payload: false })
    setEncounteredPopups([])
    setCompletedQuizzes([])
    generatePopups(1) // Start with level 1 popups
  }

  // Generate random popups based on level
  const generatePopups = async (currentLevel: number) => {
    const newPopups: Popup[] = []
    const count = Math.min(currentLevel + 1, 5) // Max 5 popups at once
    
    // Try to fetch popups from API first
    try {
      // For higher levels, increase the chance of malicious popups
      const popupType = currentLevel > 3 ? 'malicious' : undefined
      
      const fetchPromises = []
      
      // Create multiple fetch requests in parallel
      for (let i = 0; i < count; i++) {
        fetchPromises.push(fetchRandomPopup(popupType))
      }
      
      // Wait for all fetch requests to complete
      const apiPopups = await Promise.all(fetchPromises)
      
      // Process the fetched popups
      for (let i = 0; i < count; i++) {
        const apiPopup = apiPopups[i]
        
        if (apiPopup) {
          // Generate random position that doesn't overlap with taskbar
          // Avoid top 100px for desktop icons and bottom 100px for taskbar
          const randomX = 100 + Math.random() * (window.innerWidth - 500)
          const randomY = 100 + Math.random() * (window.innerHeight - 400)
          
          // Random size based on content length
          const contentLength = (apiPopup.title?.length || 0) + (apiPopup.message?.length || 0)
          const randomSize = {
            width: Math.max(250, Math.min(400, 250 + contentLength / 5)),
            height: Math.max(150, Math.min(350, 150 + contentLength / 10))
          }
          
          // Transform the API popup to match our Popup interface
          const popup = transformPopupFromAPI(apiPopup, 
            { x: randomX, y: randomY },
            randomSize
          )
          
          // Add the popup to our collection
          newPopups.push(popup)
        } else {
          // Fallback to generating a random popup if API fetch failed
          newPopups.push(generateFallbackPopup())
        }
      }
    } catch (error) {
      debugError('Error fetching popups from API:', error)
      
      // Fallback to generating random popups if API fails
      for (let i = 0; i < count; i++) {
        newPopups.push(generateFallbackPopup())
      }
    }
    
    // --- Batch position assignment to prevent overlap ---
    const existingPositions = Object.values(state.popupPositions);
    const assignedPositions: { [id: string]: { x: number; y: number } } = {};
    const allOccupiedPositions: { x: number; y: number }[] = [...existingPositions];

    newPopups.forEach((popup, idx) => {
      if (popup.id) {
        // Pass all positions assigned so far in this batch
        const pos = generateRandomPosition(popup.ui_type, allOccupiedPositions);
        assignedPositions[popup.id] = pos;
        allOccupiedPositions.push(pos);
        debugLog(`[PopupManic] Assigned position for popup ${popup.id}:`, pos);
      }
    });

    // Batch update popupPositions state
    setPopupPositions({ ...state.popupPositions, ...assignedPositions });
    
    // Add all popups to the state using the addPopup action
    newPopups.forEach(popup => {
      debugLog(`[PopupManic] Adding popup to state: ${popup.id}`);
      addPopup(popup);
    });
    
    return newPopups;
  }
  
  // Function to generate a random position for a popup based on its UI type
  const generateRandomPosition = (
    uiType?: string,
    extraOccupiedPositions: { x: number; y: number }[] = []
  ): { x: number, y: number } => {
    debugLog(`Generating position for UI type: ${uiType}`);
    debugLog(`Current popup positions:`, Object.keys(state.popupPositions).length, Object.values(state.popupPositions));
    
    // Default popup dimensions - UPDATED to match actual sizes
    let popupWidth = 450;  // DEFAULT_POPUP_SIZE
    let popupHeight = 350; // DEFAULT_POPUP_SIZE

    // Adjust dimensions based on UI type
    if (uiType === 'phone_call_ui') {
      popupWidth = 300;  // ~w-72
      popupHeight = 400;
    } else if (uiType === 'chat_message') {
      popupWidth = 380;
      popupHeight = 500;
    } else if (uiType === 'video_player_overlay' || uiType === 'video') {
      popupWidth = 640;
      popupHeight = 400;
    } else if (uiType === 'browser_notification') {
      popupWidth = 320;
      popupHeight = 160;
    } else if (uiType === 'system_alert' || uiType === 'system_notification') {
      popupWidth = 400;
      popupHeight = 300;
    }
    
    // Special handling for phone popups - always visible on right side
    if (uiType === 'phone_call_ui') {
      const phoneX = Math.max(50, window.innerWidth - popupWidth - 80); // Right side with margin
      const phoneY = Math.max(50, Math.min(window.innerHeight / 3, window.innerHeight - popupHeight - 100)); // Upper-middle area
      return {
        x: phoneX,
        y: phoneY
      };
    }
    
    // Special handling for chat messages - bottom right
    if (uiType === 'chat_message') {
      return {
        x: Math.max(32, window.innerWidth - popupWidth - 32),
        y: Math.max(32, window.innerHeight - popupHeight - 120) // keep above taskbar
      };
    }
    
    // Special handling for video popups - center screen for visibility
    if (uiType === 'video_player_overlay' || uiType === 'video') {
      return {
        x: Math.max(32, (window.innerWidth - popupWidth) / 2),
        y: Math.max(32, (window.innerHeight - popupHeight) / 3)
      };
    }
    
    // Special handling for browser notifications - inside browser window if it's a cookie banner
    if (uiType === 'browser_notification') {
      // Position inside the browser window area (assuming browser is centered)
      const browserLeft = window.innerWidth * 0.1; // 10% from left
      const browserTop = window.innerHeight * 0.15; // 15% from top
      const browserWidth = window.innerWidth * 0.8; // 80% of screen width
      
      return {
        x: browserLeft + Math.random() * (browserWidth - popupWidth - 40), // Ensure it stays inside browser
        y: browserTop + 80 // Position at top of browser content area, below address bar
      };
    }
    
    // General case: pick a random, non-overlapping spot within viewport
    const margin = 32;
    const taskbarHeight = 80;
    const minX = margin;
    const minY = margin;
    const maxX = Math.max(minX, window.innerWidth - popupWidth - margin);
    const maxY = Math.max(minY, window.innerHeight - popupHeight - (margin + taskbarHeight));

    const existingPositions = Object.values(state.popupPositions);
    const allOccupiedPositions = [...existingPositions, ...extraOccupiedPositions];

    const minSeparationX = popupWidth * 0.6;
    const minSeparationY = popupHeight * 0.6;

    // Try up to 40 random positions to avoid clustering
    for (let attempt = 0; attempt < 40; attempt++) {
      const candidate = {
        x: Math.floor(minX + Math.random() * (maxX - minX + 1)),
        y: Math.floor(minY + Math.random() * (maxY - minY + 1)),
      };

      const collides = allOccupiedPositions.some(pos =>
        Math.abs(pos.x - candidate.x) < minSeparationX &&
        Math.abs(pos.y - candidate.y) < minSeparationY
      );

      if (!collides) return candidate;
    }

    // Fallback: pick a deterministic spread along a diagonal
    const diagonalIndex = (existingPositions.length + extraOccupiedPositions.length) % 5;
    return {
      x: Math.min(maxX, minX + diagonalIndex * Math.max(50, (maxX - minX) / 4)),
      y: Math.min(maxY, minY + diagonalIndex * Math.max(40, (maxY - minY) / 4)),
    };
  }
  
  // Video dimensions for video popups - defined as module-level constants
  
  // Generate realistic chat message data for chat_message popups
  const generateChatMessageData = (type: string) => {
    const maliciousChatMessages = [
      {
        senderName: "Sarah Johnson",
        platform: "WhatsApp",
        avatarUrl: "/img/avatars/sarah.png",
        message: "Hey! I found this amazing investment opportunity that's making me $500/day. Want the link? It's only available for 24 hours!",
        explanation: {
          why_this_popup_is_X_type: "This is a classic investment scam using social engineering. Scammers impersonate friends or acquaintances to build trust, then promote fake investment schemes with promises of quick, high returns.",
          what_to_look_for: [
            "Unsolicited investment opportunities from contacts",
            "Promises of unrealistic daily returns ($500/day)",
            "Artificial urgency ('only available for 24 hours')",
            "Vague details about the actual investment",
            "Pressure to act quickly without research"
          ],
          real_world_impact: "Investment scams cost victims billions annually. These 'get rich quick' schemes often target people's financial insecurities and can result in complete loss of invested funds. Many victims lose life savings or retirement funds.",
          prevention_tips: [
            "Be skeptical of unsolicited investment advice, even from known contacts",
            "Research any investment opportunity thoroughly",
            "Remember: if it sounds too good to be true, it probably is",
            "Verify with the person through a different communication method",
            "Consult with financial advisors before making investment decisions"
          ]
        }
      },
      {
        senderName: "Tech Support",
        platform: "Telegram",
        avatarUrl: "/img/avatars/tech-support.png",
        message: "URGENT: Your Microsoft account has been compromised! Click this link immediately to secure your account: bit.ly/secure-account-now",
        explanation: {
          why_this_popup_is_X_type: "This is a phishing attempt impersonating Microsoft support. Legitimate companies never send urgent security messages through chat platforms or use shortened URLs for account security.",
          what_to_look_for: [
            "Urgent language creating panic about account security",
            "Shortened URLs (bit.ly) hiding the real destination",
            "Unsolicited messages from 'tech support'",
            "Generic sender names without official verification",
            "Pressure to click links immediately"
          ],
          real_world_impact: "Account takeover scams can lead to identity theft, financial fraud, and unauthorized access to personal data. Victims may lose access to email, social media, and financial accounts.",
          prevention_tips: [
            "Never click suspicious links in unsolicited messages",
            "Go directly to the official website instead of clicking links",
            "Verify sender identity through official channels",
            "Enable two-factor authentication on all accounts",
            "Be suspicious of urgent security warnings via chat"
          ]
        }
      }
    ];

    const benignChatMessages = [
      {
        senderName: "Mom",
        platform: "iMessage",
        avatarUrl: "/img/avatars/mom.png",
        message: "Hi honey! Just wanted to check in. How was your day? Call me when you get a chance. Love you! ❤️",
        explanation: {
          why_this_popup_is_X_type: "This is a legitimate personal message from a family member. It contains natural, caring language without any suspicious requests or links.",
          what_to_look_for: [
            "Personal, caring tone typical of family communication",
            "No requests for money, information, or urgent actions",
            "Natural use of emojis and casual language",
            "Familiar sender with established relationship",
            "No links or suspicious attachments"
          ],
          real_world_impact: "Legitimate family communications help maintain relationships and provide emotional support. These messages are safe to respond to and engage with normally.",
          prevention_tips: [
            "Respond naturally to genuine family communications",
            "Verify identity if anything seems unusual",
            "Keep family contacts updated in your phone",
            "Be aware that scammers sometimes impersonate family members",
            "Trust your instincts if something feels off"
          ]
        }
      },
      {
        senderName: "Bank of America",
        platform: "SMS",
        avatarUrl: "/img/avatars/boa.png",
        message: "Your account ending in 1234 has a pending transaction of $50.00 at Target. Reply STOP to cancel or ALLOW to approve.",
        explanation: {
          why_this_popup_is_X_type: "This appears to be a legitimate bank fraud alert. Banks do send SMS notifications for suspicious transactions, and the format matches standard banking alerts.",
          what_to_look_for: [
            "Specific account details (last 4 digits)",
            "Reasonable transaction amount and merchant",
            "Standard banking language and format",
            "Simple response options (STOP/ALLOW)",
            "No requests for personal information"
          ],
          real_world_impact: "Legitimate fraud alerts help protect your finances by notifying you of potentially unauthorized transactions. Responding appropriately can prevent fraudulent charges.",
          prevention_tips: [
            "Verify the sender matches your bank's official number",
            "Check your account independently if unsure",
            "Never provide account details over unsolicited calls",
            "Contact your bank directly if the message seems suspicious",
            "Set up account alerts through your bank's official app"
          ]
        }
      }
    ];

    if (type === 'malicious') {
      return maliciousChatMessages[Math.floor(Math.random() * maliciousChatMessages.length)];
    } else {
      return benignChatMessages[Math.floor(Math.random() * benignChatMessages.length)];
    }
  };

  // Generate realistic phone caller data for phone_call_ui popups
  const generatePhoneCallerData = (type: string) => {
    const maliciousCallers = [
      {
        callerName: "Microsoft Support",
        phoneNumber: "+1 (800) 642-7676",
        avatarUrl: "/img/microsoft-logo.png",
        message: "Hello, this is Microsoft Technical Support. We've detected suspicious activity on your computer and need immediate access to resolve critical security issues.",
        explanation: {
          why_this_popup_is_X_type: "This is a classic tech support scam. Microsoft never calls customers unsolicited about computer problems. Legitimate tech companies don't cold-call users claiming to detect issues remotely.",
          what_to_look_for: [
            "Unsolicited call claiming to be from a major tech company",
            "Claims of detecting problems on your computer remotely",
            "Urgent language demanding immediate action",
            "Request for remote access to your computer",
            "Generic phone number that doesn't match official support lines"
          ],
          real_world_impact: "Tech support scams cost victims over $347 million annually. Scammers gain remote access to install malware, steal personal data, or demand payment for fake services. They often target elderly users and can cause significant financial and emotional damage.",
          prevention_tips: [
            "Never give remote access to unsolicited callers",
            "Hang up and call the company's official support number",
            "Remember: legitimate companies don't cold-call about computer issues",
            "Be suspicious of urgent language and pressure tactics",
            "Verify caller identity through official channels before taking any action"
          ]
        }
      },
      {
        callerName: "Bank Security",
        phoneNumber: "+1 (555) 123-4567",
        avatarUrl: "/img/bank-logo.png",
        message: "This is your bank's fraud department. We've detected unauthorized transactions on your account. Please verify your information immediately.",
        explanation: {
          why_this_popup_is_X_type: "This is a banking/financial scam designed to steal personal and financial information. Real banks have specific protocols for fraud alerts and won't ask for sensitive information over unsolicited calls.",
          what_to_look_for: [
            "Unsolicited call claiming to be from your bank",
            "Requests for account numbers, passwords, or PINs",
            "Pressure to act immediately without verification",
            "Generic phone number not matching your bank's official number",
            "Lack of specific account details that your real bank would have"
          ],
          real_world_impact: "Banking scams result in billions in losses annually. Victims may have accounts drained, credit damaged, or identity stolen. Recovery can take months or years, affecting credit scores and financial stability.",
          prevention_tips: [
            "Hang up and call your bank's official number",
            "Never provide account details over unsolicited calls",
            "Banks will never ask for full passwords or PINs over the phone",
            "Check your account online or through official app",
            "Set up account alerts for real-time transaction monitoring"
          ]
        }
      },
      {
        callerName: "IRS Tax Department",
        phoneNumber: "+1 (202) 555-0199",
        avatarUrl: "/img/irs-logo.png",
        message: "This is the Internal Revenue Service. You have unpaid taxes and face immediate legal action. You must pay now to avoid arrest.",
        explanation: {
          why_this_popup_is_X_type: "This is a government impersonation scam. The IRS never initiates contact by phone for tax issues and doesn't threaten immediate arrest. All IRS communication starts with official mail correspondence.",
          what_to_look_for: [
            "Threats of immediate arrest or legal action",
            "Demands for immediate payment over the phone",
            "Requests for payment via gift cards, wire transfers, or cryptocurrency",
            "Aggressive, threatening tone",
            "Caller ID that may appear to be from government agencies"
          ],
          real_world_impact: "IRS impersonation scams have cost Americans over $65 million in recent years. Victims often pay thousands in fake taxes, face financial hardship, and may have their personal information stolen for identity theft.",
          prevention_tips: [
            "Know that the IRS never initiates contact by phone",
            "Hang up immediately on threatening tax calls",
            "The IRS never demands immediate payment or specific payment methods",
            "Report IRS impersonation scams to the Treasury Inspector General",
            "If you owe taxes, contact the IRS directly through official channels"
          ]
        }
      },
      {
        callerName: "Tech Support Plus",
        phoneNumber: "+1 (888) 555-TECH",
        avatarUrl: "/img/tech-support.png",
        message: "Your computer warranty is about to expire! We need to renew it immediately and install security updates.",
        explanation: {
          why_this_popup_is_X_type: "This is a warranty/subscription scam designed to sell unnecessary services or gain computer access. Legitimate warranty providers don't cold-call about expiring warranties, and security updates don't require paid services.",
          what_to_look_for: [
            "Unsolicited calls about expiring warranties",
            "Pressure to renew immediately",
            "Claims about needing to install updates for a fee",
            "Generic company names like 'Tech Support Plus'",
            "Requests for remote computer access or payment information"
          ],
          real_world_impact: "Warranty scams cost consumers millions annually through unnecessary service fees, malware installation, and data theft. Victims often pay for services they don't need or have their computers compromised.",
          prevention_tips: [
            "Verify warranty status through original manufacturer",
            "Don't trust unsolicited warranty expiration calls",
            "Security updates are typically free from legitimate sources",
            "Research company names and check Better Business Bureau ratings",
            "Never provide remote access to unknown callers"
          ]
        }
      }
    ];
    
    const benignCallers = [
      {
        callerName: "Dr. Smith's Office",
        phoneNumber: "+1 (555) 123-4567",
        avatarUrl: "/img/doctor-office.png",
        message: "This is a reminder about your upcoming appointment tomorrow at 2 PM. Please call back to confirm.",
        explanation: {
          why_this_popup_is_X_type: "This is a legitimate appointment reminder from a healthcare provider. Medical offices routinely call patients to confirm appointments, reducing no-shows and improving scheduling efficiency.",
          what_to_look_for: [
            "Call from a known healthcare provider you have appointments with",
            "Specific appointment details (time, date, doctor name)",
            "Professional, courteous tone",
            "Request to confirm, not provide sensitive information",
            "Phone number matches the office's official number"
          ],
          real_world_impact: "Legitimate appointment reminders help patients maintain their healthcare schedules, reducing missed appointments and improving health outcomes. They're a standard practice in healthcare administration.",
          prevention_tips: [
            "Verify the caller by checking the number against your appointment card",
            "It's safe to confirm appointments with known healthcare providers",
            "Be cautious if they ask for insurance or payment information over the phone",
            "If unsure, hang up and call the office directly",
            "Legitimate medical offices won't ask for Social Security numbers in appointment reminders"
          ]
        }
      },
      {
        callerName: "Local Pharmacy",
        phoneNumber: "+1 (555) 987-6543",
        avatarUrl: "/img/pharmacy.png",
        message: "Your prescription is ready for pickup. We're open until 9 PM today.",
        explanation: {
          why_this_popup_is_X_type: "This is a legitimate prescription ready notification from a pharmacy. Pharmacies commonly call customers when prescriptions are filled and ready for pickup.",
          what_to_look_for: [
            "Call from a pharmacy where you have prescriptions",
            "Simple notification about prescription status",
            "No requests for payment or personal information",
            "Professional tone with store hours or pickup information",
            "Phone number matches the pharmacy's official number"
          ],
          real_world_impact: "Prescription ready calls help patients get their medications promptly, improving medication adherence and health outcomes. This is a standard service provided by most pharmacies.",
          prevention_tips: [
            "Verify the pharmacy by checking your prescription bottle for their number",
            "It's safe to acknowledge prescription pickup notifications",
            "Be suspicious if they ask for insurance information or payment over the phone",
            "Legitimate pharmacies won't ask for Social Security or credit card numbers in pickup calls",
            "If in doubt, call the pharmacy directly to verify"
          ]
        }
      },
      {
        callerName: "School District",
        phoneNumber: "+1 (555) 234-5678",
        avatarUrl: "/img/school.png",
        message: "This is an automated message about tomorrow's early dismissal due to weather conditions.",
        explanation: {
          why_this_popup_is_X_type: "This is a legitimate automated notification from a school district about schedule changes. Schools routinely send automated calls to parents about closures, delays, or early dismissals.",
          what_to_look_for: [
            "Call from your child's school district",
            "Automated message about school operations",
            "Specific information about schedule changes or events",
            "No requests for personal or financial information",
            "Phone number matches the school's official contact number"
          ],
          real_world_impact: "School notification calls help parents plan for schedule changes, ensuring student safety and reducing confusion about school operations. These are essential communications for families.",
          prevention_tips: [
            "Verify the school's number matches what's on official documents",
            "Legitimate school calls only provide information, not request data",
            "Be suspicious of any school call asking for payment or personal information",
            "Schools won't ask for Social Security numbers or financial information in automated calls",
            "Contact the school directly if the message seems unusual"
          ]
        }
      }
    ];

    const neutralCallers = [
      {
        callerName: "Survey Research",
        phoneNumber: "+1 (555) 456-7890",
        avatarUrl: "/img/survey.png",
        message: "Would you be interested in participating in a brief survey about your shopping preferences?",
        explanation: {
          why_this_popup_is_X_type: "This is a neutral marketing/research call. While not malicious, these calls can be unwanted and may collect personal information for marketing purposes. The legitimacy depends on whether you've consented to such calls.",
          what_to_look_for: [
            "Unsolicited call from unknown research company",
            "Requests for personal information or preferences",
            "No clear opt-out mechanism mentioned",
            "Vague company identification",
            "Pressure to participate immediately"
          ],
          real_world_impact: "Survey calls can be legitimate market research but may also be used to collect personal data for targeted marketing or sold to third parties. Some may be precursors to sales pitches or scams.",
          prevention_tips: [
            "Ask for company details and privacy policy before participating",
            "You have the right to decline participation",
            "Be cautious about sharing personal information",
            "Verify the company's legitimacy if you're interested",
            "Consider registering with Do Not Call Registry to reduce such calls"
          ]
        }
      },
      {
        callerName: "Local Business",
        phoneNumber: "+1 (555) 345-6789",
        avatarUrl: "/img/business.png",
        message: "We're calling to let you know about our special promotion this week.",
        explanation: {
          why_this_popup_is_X_type: "This is a neutral promotional call from a local business. While not malicious, these unsolicited marketing calls can be annoying and may not always respect Do Not Call preferences.",
          what_to_look_for: [
            "Promotional call from local business",
            "Offers or deals being promoted",
            "May not have clear opt-out instructions",
            "Could be legitimate business or telemarketing",
            "Professional but sales-focused tone"
          ],
          real_world_impact: "Local business promotional calls are generally harmless but contribute to call volume and interruptions. Some may be legitimate businesses while others might be broader telemarketing campaigns.",
          prevention_tips: [
            "Politely decline if not interested",
            "Ask to be removed from their calling list",
            "Verify the business is legitimate if the offer interests you",
            "Don't provide personal information during unsolicited calls",
            "Register with Do Not Call Registry to reduce promotional calls"
          ]
        }
      }
    ];
    
    if (type === 'malicious') {
      return maliciousCallers[Math.floor(Math.random() * maliciousCallers.length)];
    } else if (type === 'benign') {
      return benignCallers[Math.floor(Math.random() * benignCallers.length)];
    } else {
      return neutralCallers[Math.floor(Math.random() * neutralCallers.length)];
    }
  };

  // Helper: Create a simple video popup used by fallback generator
  const createVideoPopup = (): Popup => {
    const position = {
      x: 100 + Math.random() * (window.innerWidth - 500),
      y: 100 + Math.random() * (window.innerHeight - 400)
    };
    const size = { width: 320, height: 220 };
    return new Popup({
      id: `video-${Date.now()}`,
      title: 'Auto-playing Video Ad',
      message: 'This video started playing automatically. Is it safe?',
      is_malicious: true,
      ui_type: 'browser_notification',
      category: 'malvertising',
      correct_action: 'FORCE_CLOSE_OS_LEVEL',
      position,
      size,
      style: {
        theme: 'modern',
        headerColor: '#222',
        bodyColor: '#111',
        borderColor: '#444',
        borderWidth: 1,
        borderRadius: 6,
        fontFamily: 'Segoe UI, sans-serif',
        fontSize: '14px',
        boxShadow: '0 4px 8px rgba(0,0,0,.35)'
      },
      elements: {
        hasLogo: false,
        hasButton: true,
        buttonText: 'Close',
        videoGifPath: '/gifs/autoplay-video.gif'
      }
    });
  };

  // Helpers to inject simple text errors
  const addMisspellings = (text: string): string => text.replace(/e/gi, '3').replace(/i/gi, '1');
  // addGrammaticalErrors defined later; keep single definition to avoid duplicates

  // Generate a fallback popup when API fails
  const generateFallbackPopup = (): Popup => {
    // Occasionally generate a video popup (10% chance)
    if (Math.random() < 0.1) {
      return createVideoPopup()
    }
    
    const type = Math.random() > 0.6 ? 'malicious' : Math.random() > 0.5 ? 'benign' : 'neutral'
    const legacyCorrectAction = type === 'malicious' ? 'close' : type === 'benign' ? 'click' : 'ignore'
    
    // Map legacy type to new model properties
    const is_malicious = type === 'malicious'
    
    // Randomly select UI type with balanced distribution
    const uiTypeRandom = Math.random()
    let ui_type: string
    if (uiTypeRandom < 0.25) {
      ui_type = 'phone_call_ui'
    } else if (uiTypeRandom < 0.50) {
      ui_type = 'chat_message'
    } else if (type === 'malicious') {
      ui_type = 'system_alert'
    } else if (type === 'benign') {
      ui_type = 'browser_notification'
    } else {
      ui_type = 'system_notification'
    }
    
    const category = type === 'malicious' ? 'security_warning' : type === 'benign' ? 'update_notification' : 'information'
    const correct_action = type === 'malicious' ? 'FORCE_CLOSE_OS_LEVEL' : type === 'benign' ? 'ACCEPT_OFFER' : 'DISMISS'
    
    // Generate position and size
    const position = {
      x: 100 + Math.random() * (window.innerWidth - 500),
      y: 100 + Math.random() * (window.innerHeight - 400)
    }
    const size = {
      width: 250 + Math.random() * 150,
      height: 150 + Math.random() * 150
    }
    
    // Generate style and elements
    const style = generateRandomStyle(type)
    const elements = generateRandomElements(type)
    
    // Generate phishing indicators for malicious popups
    let phishingIndicators
    let message = getRandomMessage(type)
    let indicators_of_compromise: PopupIndicator[] = []
    
    if (type === 'malicious') {
      phishingIndicators = generatePhishingIndicators()
      
      // Modify message based on phishing indicators
      if (phishingIndicators.misspellings) {
        message = addMisspellings(message)
        indicators_of_compromise.push({
          element: 'message',
          indicator_type: 'spelling',
          description: 'The message contains spelling errors',
          severity: 'medium'
        })
      }
      if (phishingIndicators.grammaticalErrors) {
        message = addGrammaticalErrors(message)
        indicators_of_compromise.push({
          element: 'message',
          indicator_type: 'grammar',
          description: 'The message contains grammatical errors',
          severity: 'medium'
        })
      }
      if (phishingIndicators.urgencyLanguage) {
        message = addUrgencyLanguage(message)
        indicators_of_compromise.push({
          element: 'message',
          indicator_type: 'urgency',
          description: 'The message uses urgent language to pressure the user',
          severity: 'high'
        })
      }
    }
    
    // Create buttons based on elements
    const buttons: PopupButton[] = []
    if (elements && elements.hasButton) {
      buttons.push({
        text: elements.buttonText || 'OK',
        is_safe: !is_malicious
      })
      
      // Add a second button for cancel options
      if (Math.random() > 0.5) {
        buttons.push({
          text: 'Cancel',
          is_safe: is_malicious
        })
      }
    }
    
    // Generate specific data for phone calls and chat messages
    let brand_elements: any = {}
    if (ui_type === 'phone_call_ui') {
      const phoneCallerData = generatePhoneCallerData(type)
      brand_elements = {
        impersonated_brand_name: phoneCallerData.callerName,
        contact_info: phoneCallerData.phoneNumber,
        logo_url: phoneCallerData.avatarUrl
      }
      message = phoneCallerData.message
    } else if (ui_type === 'chat_message') {
      const chatData = generateChatMessageData(type)
      brand_elements = {
        impersonated_brand_name: chatData.senderName,
        contact_info: chatData.platform,
        logo_url: chatData.avatarUrl
      }
      message = chatData.message
    }
    
    // Create a popup using our class constructor
    return new Popup({
      id: `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: ui_type === 'phone_call_ui' ? brand_elements.impersonated_brand_name : getRandomTitle(type),
      message,
      // New model properties
      is_malicious,
      ui_type,
      category,
      correct_action,
      // Visual properties
      position,
      size,
      style,
      // Brand elements for phone calls
      brand_elements,
      // New model arrays
      buttons,
      indicators_of_compromise,
      // Legacy properties for backward compatibility
      elements,
      phishingIndicators
    })
    
  }


  
  // Get random title based on popup type
  const getRandomTitle = (type: string) => {
    const maliciousTitles = [
      "WARNING: Virus Detected!",
      "Your Computer is Infected",
      "Security Alert",
      "Update Required Now",
      "Claim Your Prize!"
    ]
    
    const benignTitles = [
      "Software Update Available",
      "Cookie Preferences",
      "Notification Settings",
      "Sign in to Continue",
      "Confirm Your Action"
    ]
    
    const neutralTitles = [
      "Did You Know?",
      "Take Our Survey",
      "Rate Your Experience",
      "New Feature Available",
      "Welcome Back"
    ]
    
    if (type === 'malicious') {
      return maliciousTitles[Math.floor(Math.random() * maliciousTitles.length)]
    } else if (type === 'benign') {
      return benignTitles[Math.floor(Math.random() * benignTitles.length)]
    } else {
      return neutralTitles[Math.floor(Math.random() * neutralTitles.length)]
    }
  }
  
  // Get random message based on popup type
  const getRandomMessage = (type: string) => {
    const maliciousMessages = [
      "Your computer has 13 viruses! Click now to remove them!",
      "Your system is at risk! Download our security tool now!",
      "Congratulations! You've won a free iPhone. Claim now!",
      "Your account has been compromised. Verify your details now!",
      "Critical error detected. Call our support line immediately!"
    ]
    
    const benignMessages = [
      "A new update is available for your software. Install now?",
      "We use cookies to improve your experience. Accept or customize your preferences.",
      "Please sign in to continue using this service.",
      "Would you like to enable browser notifications?",
      "Your password will expire in 3 days. Update now?"
    ]
    
    const neutralMessages = [
      "Did you know you can customize your dashboard? Try it now!",
      "Help us improve our service by taking a short survey.",
      "How would you rate your experience with our app?",
      "We've added new features! Check them out in settings.",
      "Welcome back! You've been logged in successfully."
    ]
    
    if (type === 'malicious') {
      return maliciousMessages[Math.floor(Math.random() * maliciousMessages.length)]
    } else if (type === 'benign') {
      return benignMessages[Math.floor(Math.random() * benignMessages.length)]
    } else {
      return neutralMessages[Math.floor(Math.random() * neutralMessages.length)]
    }
  }
  
  // Get random close method
  const getRandomCloseMethod = () => {
    const methods = [
      'click_x',
      'click_x_after_time',
      'click_button',
      'slide_away',
      'run_antivirus',
      'hang_up',
      'drag_to_trash',
      'shake_to_close',
      'solve_puzzle',
      'click_all_iocs',
      'no_action'
    ]
    return methods[Math.floor(Math.random() * methods.length)] as Popup['closeMethod']
  }
  
  // Get hint text for close method
  const getCloseMethodHint = (closeMethod: Popup['closeMethod']): string => {
    switch (closeMethod) {
      case 'click_x':
        return 'Click the X button to close this popup'
      case 'click_x_after_time':
        return 'Wait for the X button to appear, then click it'
      case 'click_button':
        return 'Click the Close or Cancel button'
      case 'slide_away':
        return 'Click and drag this popup off the screen'
      case 'run_antivirus':
        return 'Run Nyantivirus to remove this threat'
      case 'hang_up':
        return 'Click the Hang Up button to end this call'
      case 'drag_to_trash':
        return 'Drag this popup to the Recycle Bin'
      case 'shake_to_close':
        return 'Rapidly move your mouse back and forth over this popup to shake it away'
      case 'solve_puzzle':
        return 'Solve the puzzle to dismiss this popup'
      case 'click_all_iocs':
        return 'Click all suspicious elements before closing'
      case 'no_action':
        return 'Do not interact with this popup - it will close on its own'
      default:
        return 'Close this popup'
    }
  }
  
  // Generate random visual style for popups
  const generateRandomStyle = (type: 'malicious' | 'benign' | 'neutral'): Popup['style'] => {
    const themes = ['windows', 'mac', 'modern', 'retro', 'custom']
    const theme = themes[Math.floor(Math.random() * themes.length)] as 'windows' | 'mac' | 'modern' | 'retro' | 'custom'
    
    // Generate colors based on theme and type, but with more variety
    let headerColor = ''
    let bodyColor = ''
    let borderColor = ''
    let borderWidth = 1
    let borderRadius = 4
    let fontFamily = 'sans-serif'
    let fontSize = '14px'
    let boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)'
    
    switch (theme) {
      case 'windows':
        headerColor = type === 'malicious' ? 
          ['#d32f2f', '#c62828', '#b71c1c', '#ff5252'][Math.floor(Math.random() * 4)] : 
          type === 'benign' ? 
          ['#1976d2', '#1565c0', '#0d47a1', '#2196f3'][Math.floor(Math.random() * 4)] : 
          ['#ffb300', '#ffa000', '#ff8f00', '#ffc107'][Math.floor(Math.random() * 4)]
        bodyColor = '#ffffff'
        borderColor = '#d1d1d1'
        borderWidth = 1
        borderRadius = 3
        fontFamily = '"Segoe UI", sans-serif'
        fontSize = '14px'
        boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'
        break
      
      case 'mac':
        headerColor = '#e4e4e4'
        bodyColor = '#f5f5f5'
        borderColor = '#d1d1d1'
        borderWidth = 1
        borderRadius = 6
        fontFamily = '"SF Pro", "Helvetica Neue", sans-serif'
        fontSize = '13px'
        boxShadow = '0 10px 25px rgba(0, 0, 0, 0.15)'
        break
      
      case 'modern':
        headerColor = type === 'malicious' ? 
          ['#d32f2f', '#c62828', '#b71c1c', '#ff5252'][Math.floor(Math.random() * 4)] : 
          type === 'benign' ? 
          ['#1976d2', '#1565c0', '#0d47a1', '#2196f3'][Math.floor(Math.random() * 4)] : 
          ['#ffb300', '#ffa000', '#ff8f00', '#ffc107'][Math.floor(Math.random() * 4)]
        bodyColor = '#ffffff'
        borderColor = 'transparent'
        borderWidth = 0
        borderRadius = 8
        fontFamily = '"Roboto", "Arial", sans-serif'
        fontSize = '14px'
        boxShadow = '0 12px 24px rgba(0, 0, 0, 0.12)'
        break
      
      case 'retro':
        headerColor = type === 'malicious' ? '#aa0000' : type === 'benign' ? '#000080' : '#808000'
        bodyColor = '#c0c0c0'
        borderColor = '#808080'
        borderWidth = 2
        borderRadius = 0
        fontFamily = '"MS Sans Serif", "Arial", sans-serif'
        fontSize = '12px'
        boxShadow = '4px 4px 0px rgba(0, 0, 0, 0.5)'
        break
      
      case 'custom':
        // Random colors for custom theme
        headerColor = `hsl(${Math.floor(Math.random() * 360)}, ${60 + Math.floor(Math.random() * 40)}%, ${40 + Math.floor(Math.random() * 20)}%)`
        bodyColor = `hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(Math.random() * 30)}%, ${80 + Math.floor(Math.random() * 15)}%)`
        borderColor = `hsl(${Math.floor(Math.random() * 360)}, ${Math.floor(Math.random() * 40)}%, ${50 + Math.floor(Math.random() * 20)}%)`
        borderWidth = 1 + Math.floor(Math.random() * 3)
        borderRadius = Math.floor(Math.random() * 12)
        fontFamily = ['Arial', 'Verdana', 'Georgia', 'Courier New', 'Tahoma'][Math.floor(Math.random() * 5)]
        fontSize = `${12 + Math.floor(Math.random() * 4)}px`
        boxShadow = Math.random() > 0.5 ? 
          `${Math.floor(Math.random() * 10)}px ${Math.floor(Math.random() * 10)}px ${Math.floor(Math.random() * 20)}px rgba(0, 0, 0, ${0.1 + Math.random() * 0.4})` : 
          'none'
        break
    }
    
    // For malicious popups, sometimes use suspicious styling
    if (type === 'malicious' && Math.random() > 0.7) {
      // Intentionally poor design choices for malicious popups
      fontFamily = Math.random() > 0.5 ? 'Comic Sans MS, cursive' : 'Impact, fantasy'
      borderWidth = Math.floor(Math.random() * 5) + 1
      boxShadow = Math.random() > 0.5 ? `0 0 ${Math.floor(Math.random() * 20) + 5}px ${headerColor}` : 'none'
    }
    
    return {
      theme,
      headerColor,
      bodyColor,
      borderColor,
      borderWidth,
      borderRadius,
      fontFamily,
      fontSize,
      boxShadow
    }
  }
  
  // Generate random UI elements for popups
  const generateRandomElements = (type: 'malicious' | 'benign' | 'neutral'): Popup['elements'] => {
    const elements: Popup['elements'] = {}
    
    // Determine if popup has a logo
    elements.hasLogo = Math.random() > 0.4
    if (elements.hasLogo) {
      if (type === 'malicious') {
        // Malicious popups might use recognizable but slightly modified logos
        const maliciousLogos = [
          '/img/fake-logos/microsft.png',
          '/img/fake-logos/goggle.png',
          '/img/fake-logos/amaz0n.png',
          '/img/fake-logos/paypa1.png',
          '/img/fake-logos/appleid.png'
        ]
        elements.logoPath = maliciousLogos[Math.floor(Math.random() * maliciousLogos.length)]
      } else {
        // Legitimate logos for benign popups
        const legitimateLogos = [
          '/img/logos/microsoft.png',
          '/img/logos/google.png',
          '/img/logos/amazon.png',
          '/img/logos/paypal.png',
          '/img/logos/apple.png'
        ]
        elements.logoPath = legitimateLogos[Math.floor(Math.random() * legitimateLogos.length)]
      }
    }
    
    // Determine if popup has buttons
    elements.hasButton = Math.random() > 0.2
    if (elements.hasButton) {
      if (type === 'malicious') {
        const maliciousButtons = [
          'Download Now',
          'Claim Prize',
          'Fix Issues',
          'OK',
          'Continue',
          'Accept',
          'Verify Now',
          'Scan Computer'
        ]
        elements.buttonText = maliciousButtons[Math.floor(Math.random() * maliciousButtons.length)]
      } else {
        const legitimateButtons = [
          'OK',
          'Cancel',
          'Accept',
          'Decline',
          'Continue',
          'Update',
          'Not Now',
          'Learn More'
        ]
        elements.buttonText = legitimateButtons[Math.floor(Math.random() * legitimateButtons.length)]
      }
    }
    
    // Determine if popup has input fields
    elements.hasInputField = type === 'malicious' ? Math.random() > 0.5 : Math.random() > 0.7
    if (elements.hasInputField) {
      if (type === 'malicious') {
        const maliciousInputs = [
          'Credit Card Number',
          'Password',
          'Social Security Number',
          'Bank Account',
          'Email and Password',
          'Full Name',
          'Mother\'s Maiden Name'
        ]
        elements.inputFieldLabel = maliciousInputs[Math.floor(Math.random() * maliciousInputs.length)]
      } else {
        const legitimateInputs = [
          'Email Address',
          'Feedback',
          'Search',
          'Preferences',
          'Username'
        ]
        elements.inputFieldLabel = legitimateInputs[Math.floor(Math.random() * legitimateInputs.length)]
      }
    }
    
    // Determine if popup has attachments
    elements.hasAttachment = type === 'malicious' ? Math.random() > 0.7 : Math.random() > 0.9
    if (elements.hasAttachment) {
      if (type === 'malicious') {
        const maliciousAttachments = [
          'invoice.exe',
          'document.js',
          'important.zip',
          'URGENT_payment.pdf.exe',
          'photo.jpg.scr',
          'setup.bat'
        ]
        elements.attachmentName = maliciousAttachments[Math.floor(Math.random() * maliciousAttachments.length)]
      } else {
        const legitimateAttachments = [
          'report.pdf',
          'invoice.pdf',
          'document.docx',
          'image.jpg',
          'presentation.pptx'
        ]
        elements.attachmentName = legitimateAttachments[Math.floor(Math.random() * legitimateAttachments.length)]
      }
    }
    
    return elements
  }
  
  // Add grammatical errors to text
  const addGrammaticalErrors = (text: string): string => {
    return text + ' Please verify your account information.';
  };

  // Add urgency language to text
  const addUrgencyLanguage = (text: string): string => {
    const urgencyPhrases = [
      'URGENT: ',
      'IMMEDIATE ACTION REQUIRED: ',
      'WARNING: ',
      'CRITICAL ALERT: ',
      'TIME SENSITIVE: '
    ]
    
    const urgencySuffixes = [
      ' (Act now!)',
      ' - Respond immediately!',
      ' [Time sensitive]',
      ' - 24 hours remaining!',
      ' - Limited time offer!'
    ]
    
    let result = text
    
    // Add prefix
    if (Math.random() > 0.5) {
      const prefix = urgencyPhrases[Math.floor(Math.random() * urgencyPhrases.length)]
      result = prefix + result
    }
    
    // Add suffix
    if (Math.random() > 0.5) {
      const suffix = urgencySuffixes[Math.floor(Math.random() * urgencySuffixes.length)]
      result = result + suffix
    }
    
    return result
  }

  // Handle system reboot (defined later with full reset logic)

  // Audio references for sound effects
  const correctSoundRef = useRef<HTMLAudioElement | null>(null)
  const wrongSoundRef = useRef<HTMLAudioElement | null>(null)
  
  // Initialize audio elements
  useEffect(() => {
    correctSoundRef.current = new Audio('/sounds/correct-choice.mp3')
    wrongSoundRef.current = new Audio('/sounds/error-wrong-choice1.mp3')
    
    // Preload sounds
    correctSoundRef.current.load()
    wrongSoundRef.current.load()
    
    return () => {
      // Cleanup
      if (correctSoundRef.current) {
        correctSoundRef.current.pause()
        correctSoundRef.current = null
      }
      if (wrongSoundRef.current) {
        wrongSoundRef.current.pause()
        wrongSoundRef.current = null
      }
    }
  }, [])
  
  // Play sound effect
  const playSound = (isCorrect: boolean) => {
    if (isCorrect && correctSoundRef.current) {
      correctSoundRef.current.currentTime = 0
      correctSoundRef.current.play().catch(err => debugError('Error playing correct sound:', err))
    } else if (!isCorrect && wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0
      wrongSoundRef.current.play().catch(err => debugError('Error playing wrong sound:', err))
    }
  }

  // Function to check if a popup category is new and trigger tutorial
  // Tutorial functions removed - now using educational modal system

  // List of available silly GIFs from the public folder (excluding video files that don't exist)
  const availableSillyGifs = [
    'silly-gif (1).gif', 'silly-gif (2).gif', 'silly-gif (3).gif', 'silly-gif (4).gif', 'silly-gif (5).gif',
    'silly-gif (6).gif', 'silly-gif (7).gif', 'silly-gif (8).gif', 'silly-gif (9).gif', 'silly-gif (10).gif',
    'silly-gif (11).gif', 'silly-gif (12).gif', 'silly-gif (13).gif', 'silly-gif (14).gif', 'silly-gif (15).gif',
    'silly-gif (16).gif', 'silly-gif (17).gif', 'silly-gif (18).gif', 'silly-gif (19).gif', 'silly-gif (20).gif',
    'silly-gif (21).gif', 'silly-gif (22).gif', 'silly-gif (23).gif', 'silly-gif (24).gif', 'silly-gif (25).gif',
    'silly-gif (26).gif', 'silly-gif (27).gif', 'silly-gif (28).gif', 'silly-gif (29).gif', 'silly-gif (30).gif',
    'silly-gif (31).gif', 'silly-gif (32).gif', 'silly-gif (33).gif', 'silly-gif (34).gif', 'silly-gif (35).gif',
    'silly-gif (36).gif', 'silly-gif (37).gif', 'silly-gif (38).gif'
    // Note: Excluded video1.gif, video2.gif, etc. as they don't exist and cause 404 errors
  ];

  // Trigger random virus outbreak with silly GIFs
  const triggerRandomVirusOutbreak = () => {
    // Only trigger virus outbreak if the game is active and not paused
    if (!state.gameActive || state.hintModal.active || state.gameOver) {
      debugLog('[VirusOutbreak] Skipping virus outbreak - game not active');
      return;
    }
    
    debugLog('[VirusOutbreak] Random virus outbreak triggered!');
    
    setIsInfected(true);
    setShowVirusWarning(true);
    
    // Play virus outbreak sounds ONCE only if game is active and not already playing
    if (!state.gameOver && !state.paused) {
      if (virusAlertSoundRef.current && virusAlertSoundRef.current.paused) {
        virusAlertSoundRef.current.currentTime = 0;
        virusAlertSoundRef.current.play().catch(err => debugError('Error playing virus alert sound:', err));
        debugLog('[VirusOutbreak] Playing alert sound ONCE');
      }
      
      if (virusSirenSoundRef.current && virusSirenSoundRef.current.paused) {
        virusSirenSoundRef.current.currentTime = 0;
        virusSirenSoundRef.current.play().catch(err => debugError('Error playing virus siren sound:', err));
        debugLog('[VirusOutbreak] Playing siren sound ONCE');
      }
    } else {
      debugLog('[VirusOutbreak] Skipping audio playback - game is over or paused');
    }
    
    // Flash the warning for 3 seconds
    let flashOn = true;
    const flashInterval = setInterval(() => {
      flashOn = !flashOn;
      setShowVirusWarning(flashOn);
    }, 200);
    
    // Clear the warning after 3 seconds
    setTimeout(() => {
      clearInterval(flashInterval);
      setShowVirusWarning(false);
    }, 3000);

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const taskbarHeight = 64; // Height of the taskbar (16 * 4 = 64px for h-16)
    const gifCount = Math.floor(Math.random() * 15) + 10; // 10-25 GIFs for outbreak
    
    const newGifs: Array<{id: string, x: number, y: number, rotation: number, gifName: string, size: number}> = [];
    for (let i = 0; i < gifCount; i++) {
      const randomGif = availableSillyGifs[Math.floor(Math.random() * availableSillyGifs.length)];
      const randomSize = Math.random() * 100 + 80; // Random size between 80-180px
      const scaledSize = randomSize * 3; // Account for 300% scaling (3x multiplier)
      
      newGifs.push({
        id: `outbreak-gif-${Date.now()}-${i}`,
        x: Math.random() * (viewportWidth - scaledSize), // Keep within viewport width
        y: Math.random() * (viewportHeight - scaledSize - taskbarHeight), // Keep above taskbar
        rotation: Math.random() * 360,
        gifName: randomGif,
        size: randomSize
      });
    }
    
    setInfectedGifs([...state.infectedGifs, ...newGifs]);
    
    debugLog(`[VirusOutbreak] Spawned ${gifCount} silly GIFs. Click Nyantivirus to clear them!`);
  };

  // Generate quiz questions from encountered popups
  const generateQuizQuestions = (popups: Popup[]) => {
    const questions = [];
    const questionTypes = ['categorization', 'correct_action', 'justification', 'prevention'];
    
    // Generate 5 questions from the encountered popups
    for (let i = 0; i < 5 && i < popups.length; i++) {
      const popup = popups[i % popups.length];
      const questionType = questionTypes[i % questionTypes.length];
      
      let question;
      switch (questionType) {
        case 'categorization':
          question = {
            question: `What category does this popup belong to?`,
            format: 'multiple_choice',
            options: ['Malicious', 'Safe', 'Suspicious', 'Educational'],
            correctAnswer: popup.type === 'malicious' ? 'Malicious' : 'Safe',
            popup: popup
          };
          break;
        case 'correct_action':
          question = {
            question: `What is the correct action for this popup?`,
            format: 'interactive_buttons',
            options: ['Close', 'Click Button', 'Ignore', 'Report'],
            correctAnswer: popup.type === 'malicious' ? 'Close' : 'Click Button',
            popup: popup
          };
          break;
        case 'justification':
          question = {
            question: `Why is this popup ${popup.type === 'malicious' ? 'malicious' : 'safe'}?`,
            format: 'multiple_choice',
            options: [
              popup.type === 'malicious' ? 'Contains suspicious links' : 'From trusted source',
              'Has poor grammar',
              'Requests personal information',
              'Uses urgent language'
            ],
            correctAnswer: popup.type === 'malicious' ? 'Contains suspicious links' : 'From trusted source',
            popup: popup
          };
          break;
        case 'prevention':
          question = {
            question: `How can you prevent this type of ${popup.type === 'malicious' ? 'attack' : 'confusion'}?`,
            format: 'multiple_choice',
            options: [
              'Use antivirus software',
              'Verify sender identity',
              'Keep software updated',
              'Be cautious with links'
            ],
            correctAnswer: 'Verify sender identity',
            popup: popup
          };
          break;
      }
      
      if (question) {
        questions.push(question);
      }
    }
    
    return questions;
  };

  // Handle quiz answer selection
  const handleQuizAnswer = (selectedAnswer: string) => {
    if (!state.quizActive || !state.quizQuestions[state.currentQuestionIndex]) {
      return;
    }

    const currentQuestion = state.quizQuestions[state.currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctAnswer;
    
    // Show feedback
    dispatch({ 
      type: 'SET_SHOW_ANSWER_FEEDBACK', 
      payload: { 
        isCorrect, 
        correctAnswer: currentQuestion.correctAnswer 
      } 
    });

    // Update quiz answers
    const newAnswers = [...state.quizAnswers, {
      question: currentQuestion.question,
      selectedAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect,
      reactionTime: Date.now() - questionStartTime
    }];
    dispatch({ type: 'SET_QUIZ_ANSWERS', payload: newAnswers });

    // Update quiz score
    if (isCorrect) {
      dispatch({ type: 'SET_QUIZ_SCORE', payload: state.quizScore + 10 });
    }

    // Wait 2 seconds then move to next question or finish quiz
    setTimeout(() => {
      dispatch({ type: 'SET_SHOW_ANSWER_FEEDBACK', payload: null });
      
      if (state.currentQuestionIndex + 1 >= 5 || newAnswers.length >= 5) {
        // Quiz complete
        finishQuiz(newAnswers);
      } else {
        // Next question
        dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: state.currentQuestionIndex + 1 });
        setQuestionStartTime(Date.now());
      }
    }, 2000);
  };

  // Finish quiz and show results
  const finishQuiz = (answers: any[]) => {
    const correctCount = answers.filter(a => a.isCorrect).length;
    const percentage = Math.round((correctCount / 5) * 100);
    const passed = percentage >= 70;

    debugLog(`[QUIZ] Quiz completed: ${correctCount}/5 correct (${percentage}%)`);

    // Pause game and open in-game modal (no browser alert)
    setPaused(true);
    setQuizResultModal({ open: true, passed, correctCount, percentage });
    try { logEvent({ type: 'quiz_result', game: 'Popup Manic', correct: correctCount, percentage, total: 5, passed, ts: Date.now() }); } catch {}
    
    // Emit telemetry event for backend tracking
    try {
      GameEvents.emitQuizComplete({
        quizData: {
          score: correctCount * 10,
          totalQuestions: 5,
          correctAnswers: correctCount,
          incorrectAnswers: 5 - correctCount,
          questions: state.quizQuestions.map((q: any, i: number) => ({
            questionType: q.type || 'general',
            popupId: q.popupId || 'unknown',
            userAnswer: answers[i]?.selectedAnswer || '',
            correctAnswer: q.correctAnswer || '',
            isCorrect: answers[i]?.isCorrect || false,
            reactionTime: 0
          }))
        }
      });
    } catch (err) {
      debugError('[Telemetry] Failed to emit quiz complete:', err);
    }
  };

  // Start hidden malware progression
  const startHiddenMalware = () => {
    if (hiddenMalware.active) return
    
    debugLog('[HiddenMalware] Starting hidden malware progression...')
    setHiddenMalware(prev => ({ ...prev, active: true, phase: 1 }))
    
    // Phase 1: Slow down WiFi after 30 seconds
    setTimeout(() => {
      debugLog('[HiddenMalware] Phase 1: Slowing down WiFi connection')
      setWifiStatus('poor')
    }, 30000)
    
    // Phase 2: Spawn suspicious files after 60 seconds
    setTimeout(() => {
      if (hiddenMalware.phase < 3) {
        debugLog('[HiddenMalware] Phase 2: Spawning suspicious files on desktop')
        setHiddenMalware(prev => ({ ...prev, phase: 2 }))
        spawnSuspiciousFiles()
      }
    }, 60000)
    
    // Phase 3: Crash applications after 120 seconds
    setTimeout(() => {
      if (hiddenMalware.phase < 3) {
        debugLog('[HiddenMalware] Phase 3: Crashing applications')
        setHiddenMalware(prev => ({ ...prev, phase: 3 }))
        crashApplications()
      }
    }, 120000)
  }
  
  // Spawn suspicious files on desktop
  const spawnSuspiciousFiles = () => {
    const files = [
      { name: 'cool-beans.exe', icon: '/img/malware-taskbar.png' },
      { name: 'totally_safe.docx.exe', icon: '/img/safedocxexe-taskbar.png' },
    ]
    
    const newFiles = files.map((file, index) => ({
      id: `suspicious-${Date.now()}-${index}`,
      name: file.name,
      icon: file.icon,
      x: 200 + (index * 120),
      y: 150 + (index * 80)
    }))
    
    setSuspiciousFiles(newFiles)

    // Auto-run one of them stealthily after a short delay
    setTimeout(() => {
      const pick = newFiles[Math.floor(Math.random() * newFiles.length)]
      if (pick) {
        startMaliciousProcess(pick.name)
      }
    }, 8000)
  }
  
  // Crash applications (disable them)
  const crashApplications = () => {
    debugLog('[HiddenMalware] All applications have been disabled by malware')
    // Applications will be disabled in their click handlers based on hiddenMalware.phase
  }
  
  // Start a malicious background process (shows in taskbar and Task Manager)
  const startMaliciousProcess = (name: string) => {
    const key = name.includes('cool') ? 'coolbeans' : 'totallysafe'
    if (!state.activePrograms.includes(key)) {
      setActivePrograms([...state.activePrograms, key])
      setMalwareDetected(true)
      // Increase resource usage subtly
      setSystemResources(prev => ({
        cpu: Math.min(95, prev.cpu + 10),
        memory: Math.min(95, prev.memory + 12),
        disk: Math.min(95, prev.disk + 8),
        network: Math.min(95, prev.network + 10)
      }))
    }
  }

  // Spawn suspicious files on desktop
  const spawnSuspiciousFile = () => {
    const fileNames = [
      { name: 'free_money.exe', icon: '/img/malware-taskbar.png' },
      { name: 'totally_safe.docx.exe', icon: '/img/safedocxexe-taskbar.png' },
      { name: 'cool-beans.exe', icon: '/img/malware-taskbar.png' },
      { name: 'prize_winner.exe', icon: '/img/malware-taskbar.png' },
      { name: 'urgent_update.exe', icon: '/img/malware-taskbar.png' }
    ]
    
    const randomFile = fileNames[Math.floor(Math.random() * fileNames.length)]
    const newFile = {
      id: uuidv4(),
      name: randomFile.name,
      icon: randomFile.icon,
      x: 150 + Math.random() * 300,
      y: 150 + Math.random() * 300
    }
    
    setSuspiciousFiles(prev => [...prev, newFile])
    debugLog('[SuspiciousFile] Spawned:', newFile.name)
  }

  // Opening a suspicious file triggers a full system infection
  const openSuspiciousFile = (fileId: string) => {
    const file = suspiciousFiles.find(f => f.id === fileId)
    if (!file) return
    startMaliciousProcess(file.name)
    startFullSystemInfection()
    // Remove the file after clicking it
    setSuspiciousFiles(prev => prev.filter(f => f.id !== fileId))
  }

  // Full-system infection: spawn many silly GIFs and start countdown
  const startFullSystemInfection = () => {
    const viewportWidth = window.innerWidth
    const viewportHeight = window.innerHeight
    const gifCount = 40
    const generated: Array<{id: string, x: number, y: number, rotation: number, gifName?: string, size?: number}> = []
    for (let i = 0; i < gifCount; i++) {
      const n = 1 + Math.floor(Math.random() * 20)
      generated.push({
        id: `gif-${Date.now()}-${i}`,
        x: Math.random() * (viewportWidth - 200),
        y: Math.random() * (viewportHeight - 260),
        rotation: 0,
        gifName: `silly-gif (${n}).gif`,
        size: 70 + Math.floor(Math.random() * 40)
      })
    }
    setInfectedGifs([...(state.infectedGifs || []), ...generated])
    setInfectionEndsAt(Date.now() + 20000)
    if (virusAlertSoundRef.current) { try { virusAlertSoundRef.current.currentTime = 0; virusAlertSoundRef.current.play() } catch {} }
    if (virusSirenSoundRef.current) { try { virusSirenSoundRef.current.currentTime = 0; virusSirenSoundRef.current.play() } catch {} }
  }
  
  // Perform Nyantivirus quick scan
  const performQuickScan = () => {
    if (hiddenMalware.scanInProgress || hiddenMalware.phase >= 3) return
    
    debugLog('[Nyantivirus] Starting quick scan...')
    setHiddenMalware(prev => ({ ...prev, scanInProgress: true }))
    
    // Simulate scan time (3 seconds)
    setTimeout(() => {
      const maliciousPopups = state.popups.filter(p => p.type === 'malicious')
      const results = {
        maliciousAds: maliciousPopups.length,
        popupTypes: Array.from(new Set(maliciousPopups.map(p => p.category))),
        hiddenMalwareDetected: hiddenMalware.active,
        suspiciousFiles: suspiciousFiles.length
      }
      
      debugLog('[Nyantivirus] Scan complete:', results)
      setHiddenMalware(prev => ({ 
        ...prev, 
        scanInProgress: false, 
        scanResults: results,
        detectedPopups: maliciousPopups.map(p => p.id)
      }))
    }, 3000)
  }
  
  // Quarantine malware
  const quarantineMalware = () => {
    if (hiddenMalware.quarantineInProgress || hiddenMalware.phase >= 3) return
    
    debugLog('[Nyantivirus] Starting quarantine process...')
    setAntivirusModalStep('scanning')
    setAntivirusProgress(0)
    
    // Immediately clear all infected GIFs and threats
    setInfectedGifs([])
    setIsInfected(false)
    setShowVirusWarning(false)
    setInfectionEndsAt(null)
    setSuspiciousFiles([])
    setTrapGIFs([])
    setSillyGifs([])
    setMalwareDetected(false)
    
    // Stop virus sounds
    if (virusAlertSoundRef.current) virusAlertSoundRef.current.pause()
    if (virusSirenSoundRef.current) virusSirenSoundRef.current.pause()
    
    // Animate progress bar
    const start = Date.now()
    const interval = setInterval(() => {
      setAntivirusProgress(prev => {
        const elapsed = Date.now() - start
        const newProgress = Math.min(100, (elapsed / 2000) * 100)
        if (newProgress >= 100) {
          clearInterval(interval)
          return 100
        }
        return newProgress
      })
    }, 50)
    
    // Show success after 2 seconds
    setTimeout(() => {
      // Remove only malicious popups
      const maliciousPopupIds = state.popups.filter(p => p.type === 'malicious').map(p => p.id)
      maliciousPopupIds.forEach(id => removePopupById({ id }))
      
      // Clear hidden malware
      setHiddenMalware({
        active: false,
        phase: 0,
        detectedPopups: [],
        scanInProgress: false,
        scanResults: null,
        quarantineInProgress: false
      })
      
      // Restore WiFi
      setWifiStatus('connected')
      
      // Kill any malicious background tasks
      setActivePrograms(state.activePrograms.filter(p => p !== 'coolbeans' && p !== 'totallysafe'))
      
      // Show success result
      setAntivirusResult('healthy')
      setAntivirusModalStep('done')
      
      // Play success sound
      if (cheerfulSoundRef.current) {
        try { cheerfulSoundRef.current.currentTime = 0; cheerfulSoundRef.current.play() } catch {}
      }
      
      debugLog('[Nyantivirus] Quarantine complete - all malware removed')
      
      // Auto-close modal after 3 seconds
      setTimeout(() => {
        closeAntivirusModal()
      }, 3000)
    }, 2000)
  }
  
  // Enter Safe Mode
  const enterSafeMode = () => {
    debugLog('[System] Entering Safe Mode...')
    setSafeMode(true)
    // In safe mode, popups are disabled and background is black
  }
  
  // Exit Safe Mode and restart normally
  const exitSafeMode = () => {
    debugLog('[System] Exiting Safe Mode and restarting normally...')
    setSafeMode(false)
    
    // Clear hidden malware if Nyantivirus was run in safe mode
    setHiddenMalware({
      active: false,
      phase: 0,
      detectedPopups: [],
      scanInProgress: false,
      scanResults: null,
      quarantineInProgress: false
    })
    
    // Clear suspicious files
    setSuspiciousFiles([])
    
    // Restore WiFi
    setWifiStatus('connected')
  }
  
  

  // Open Nyantivirus modal (used by icons/taskbar). If outbreak is active, also stop sounds.
  const clearVirusOutbreak = () => {
    if (state.infectedGifs.length > 0) {
      debugLog('[VirusOutbreak] Nyantivirus activated! Preparing scan modal...');
      // Stop virus outbreak sounds immediately
      if (virusAlertSoundRef.current) {
        virusAlertSoundRef.current.pause();
        virusAlertSoundRef.current.currentTime = 0;
      }
      if (virusSirenSoundRef.current) {
        virusSirenSoundRef.current.pause();
        virusSirenSoundRef.current.currentTime = 0;
      }
    }
    // Hide outbreak overlays so the antivirus modal is clickable/visible
    setShowVirusWarning(false);
    setInfectionEndsAt(null);
    // Always open modal so users can test states
    setAntivirusModalOpen(true)
    setAntivirusModalStep('confirm')
    setAntivirusProgress(0)
    setAntivirusResult(null)
  };

  // Make clearVirusOutbreak available globally for existing desktop icon
  React.useEffect(() => {
    (window as any).clearVirusOutbreak = clearVirusOutbreak;
    return () => {
      delete (window as any).clearVirusOutbreak;
    };
  }, [clearVirusOutbreak]);
  
  // Additional cleanup when game state changes or component unmounts
  React.useEffect(() => {
    // If game is over or paused, stop virus outbreak audio
    if (state.gameOver || state.paused) {
      if (virusAlertSoundRef.current && !virusAlertSoundRef.current.paused) {
        virusAlertSoundRef.current.pause();
        debugLog('[GameState] Paused virus alert sound due to game over/pause');
      }
      
      if (virusSirenSoundRef.current && !virusSirenSoundRef.current.paused) {
        virusSirenSoundRef.current.pause();
        debugLog('[GameState] Paused virus siren sound due to game over/pause');
      }
    }
  }, [state.gameOver || state.paused]);

  // Enhanced Meowgle search results
  const getMeowgleSearchResults = (query: string) => {
    const searchResults = [
      {
        title: "Cat Care Tips - Everything You Need to Know",
        url: "https://www.catcare.meow/tips",
        description: "Comprehensive guide to keeping your feline friends happy and healthy. Learn about nutrition, grooming, and playtime."
      },
      {
        title: "Best Cat Toys of 2024 - Meow Reviews",
        url: "https://reviews.meow/toys-2024",
        description: "Our expert panel of cats has tested the latest toys. Find out which ones earned the coveted 5-paw rating."
      },
      {
        title: "Cybersecurity for Pet Owners - Stay Safe Online",
        url: "https://security.meow/pet-owners-guide",
        description: "Protect your personal information while shopping for pet supplies online. Learn to spot phishing attempts."
      },
      {
        title: "Local Veterinary Clinics Near You",
        url: "https://vetfinder.meow/local",
        description: "Find trusted veterinarians in your area. Read reviews and book appointments online."
      },
      {
        title: "Cat Memes That Will Make You Purr",
        url: "https://memes.catworld.com/funny",
        description: "The internet's finest collection of cat memes, updated daily by our team of professional meme curators."
      },
      {
        title: "Understanding Cat Behavior - Meow Psychology",
        url: "https://psychology.meow/behavior",
        description: "Why does your cat knock things off tables? Decode the mysteries of feline behavior with expert insights."
      },
      {
        title: "Phishing Awareness Training - Protect Your Digital Life",
        url: "https://security.meow/phishing-training",
        description: "Learn to identify suspicious emails, fake websites, and social engineering attacks. Interactive training modules with real-world examples."
      },
      {
        title: "Cat-Friendly Home Security Systems",
        url: "https://homesecurity.meow/cat-safe",
        description: "Motion sensors that won't trigger on cats, pet-safe cameras, and security tips for multi-pet households."
      },
      {
        title: "Digital Privacy Guide for Cat Parents",
        url: "https://privacy.meow/guide",
        description: "Protect your personal data when using pet apps, social media, and online veterinary services. Complete privacy checklist included."
      },
      {
        title: "Cat Photography Masterclass - Capture Purrfect Moments",
        url: "https://photography.meow/masterclass",
        description: "Professional tips for photographing cats. Learn lighting, composition, and how to get that perfect action shot of your feline friend."
      },
      {
        title: "Safe Online Shopping for Pet Supplies",
        url: "https://shopping.meow/safety-guide",
        description: "How to verify legitimate pet supply websites, avoid counterfeit products, and protect your payment information when shopping online."
      },
      {
        title: "Cat Health Emergency Guide - When to Call the Vet",
        url: "https://health.meow/emergency-guide",
        description: "Recognize signs of cat emergencies, first aid basics, and how to find 24/7 veterinary care in your area."
      },
      {
        title: "Password Security for Pet Lovers",
        url: "https://security.meow/passwords",
        description: "Create strong passwords for pet-related accounts, use two-factor authentication, and manage your digital identity safely."
      },
      {
        title: "Cat Nutrition Science - Feed Your Feline Right",
        url: "https://nutrition.meow/science",
        description: "Evidence-based nutrition advice, ingredient analysis, and how to choose the best food for your cat's age and health needs."
      },
      {
        title: "Social Media Safety for Pet Owners",
        url: "https://socialmedia.meow/safety",
        description: "Share pet photos safely, avoid oversharing location data, and protect your privacy while connecting with other pet lovers."
      },
      {
        title: "Indoor Cat Enrichment Ideas - Keep Your Cat Happy",
        url: "https://enrichment.meow/indoor-cats",
        description: "Creative ways to stimulate indoor cats, DIY toy ideas, and environmental enrichment tips from feline behaviorists."
      }
    ];
    
    if (!query) return searchResults;
    
    return searchResults.filter(result => 
      result.title.toLowerCase().includes(query.toLowerCase()) ||
      result.description.toLowerCase().includes(query.toLowerCase())
    );
  };

  // Firecat browser navigation
  const navigateToUrl = (url: string) => {
    setFirecatUrl(url);
    const newHistory = browserHistory.slice(0, currentHistoryIndex + 1);
    newHistory.push(url);
    setBrowserHistory(newHistory);
    setCurrentHistoryIndex(newHistory.length - 1);
    
    // Determine current page based on URL
    if (url.includes('meowgle.com')) {
      setCurrentPage('meowgle');
    } else if (url.includes('catbook.com')) {
      setCurrentPage('catbook');
    } else if (url.includes('mail.purr.com')) {
      setCurrentPage('email');
    } else if (url.includes('whiskernews.com')) {
      setCurrentPage('news');
    } else {
      setCurrentPage('generic');
    }
  };

  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const newIndex = currentHistoryIndex - 1;
      setCurrentHistoryIndex(newIndex);
      setFirecatUrl(browserHistory[newIndex]);
    }
  };

  const goForward = () => {
    if (currentHistoryIndex < browserHistory.length - 1) {
      const newIndex = currentHistoryIndex + 1;
      setCurrentHistoryIndex(newIndex);
      setFirecatUrl(browserHistory[newIndex]);
    }
  };

  const performSearch = () => {
    if (searchQuery.trim()) {
      navigateToUrl(`https://www.meowgle.com/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  // Handle popup interactions and trigger hidden malware
  const handlePopupAction = (popup: any, actionStr: string) => {
    if (state.hintModal.active) return;
    if (actionStr === 'auto-close' && popup.closeMethod !== 'no_action') return;
    if (interactedPopups.has(popup.id)) { 
      removePopupById(popup); 
      return; 
    }

    const [actionType, actionSafety] = actionStr.split(':');
    if (actionType === 'close' && actionSafety === 'force') { 
      removePopupById(popup); 
      return; 
    }

    setInteractedPopups(prev => { 
      const newSet = new Set(Array.from(prev)); 
      newSet.add(popup.id); 
      return newSet; 
    });

    let userAction = actionType === 'click' ? 'click' : actionType === 'close' ? 'close' : actionType;
    const isCorrectAction = checkCorrectAction(popup, userAction);

    // Hidden malware trigger: Start malware if user clicks on malicious popup incorrectly
    if (!isCorrectAction && popup.type === 'malicious' && userAction === 'click' && !hiddenMalware.active) {
      debugLog('[HiddenMalware] Malicious popup clicked - triggering hidden malware!');
      startHiddenMalware();
    }

    if (isCorrectAction) {
      playSound(true);
      setScore(state.score + 10);
      if ((state.score + 10) % 100 === 0) { 
        setLevel(Math.floor((state.score + 10) / 100) + 1); 
      }
      removePopupById(popup);
    } else {
      playSound(false);
      const newMistakes = state.mistakes + 1;
      setMistakes(newMistakes);
      try { logEvent({ type: 'popup_incorrect', game: 'Popup Manic', category: popup.category, ui_type: popup.ui_type, action: actionStr, ts: Date.now() }); } catch {}
      if (newMistakes >= 5) { 
        setGameOver(true); 
        setGameActive(false); 
      }
      setHintModal({ active: true, popup, slide: 1, currentSlide: 0 });
    }
  };

  // Check if user action is correct for the popup
  const checkCorrectAction = (popup: any, userAction: string): boolean => {
    return popup.correctAction === userAction;
  };

  // Remove popup by object reference
  const removePopupById = (popup: any) => {
    removePopup(popup.id);
  };

  // Restart game function for game over modal
  const restartGame = () => {
    // Reset all game state to initial values
    setScore(0);
    setLevel(1);
    setMistakes(0);
    setGameOver(false);
    setGameActive(true);
    setPopups([]);
    setInfectedGifs([]);
    setIsInfected(false);
    setShowVirusWarning(false);
    setInteractedPopups(new Set());
    setPopupPositions({});
    setMinimizedPopups(new Set());
    setHintModal({ active: false, popup: null, slide: 1, currentSlide: 0 });
    setEncounteredPopups([]);
    dispatch({ type: 'SET_SHOW_ANSWER_FEEDBACK', payload: null });
    setLevelPassMessage({ show: false, level: 0 });
    
    // Start the game again
    setTimeout(() => {
      startGame();
    }, 100);
  };

  // Trigger virus infection effect (original function for backward compatibility)
  const triggerVirusInfection = () => {
    if (Math.random() > 0.1) return; // 10% chance
    
    setIsInfected(true);
    setShowVirusWarning(true);
    
    // Flash the warning for 5 seconds
    let flashOn = true;
    const flashInterval = setInterval(() => {
      flashOn = !flashOn;
      setShowVirusWarning(flashOn);
    }, 200);
    
    // Clear the warning after 5 seconds
    setTimeout(() => {
      clearInterval(flashInterval);
      setShowVirusWarning(false);
    }, 5000);
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const gifCount = 10; // Number of gifs to spawn
    
    const newGifs: Array<{id: string, x: number, y: number, rotation: number}> = [];
    for (let i = 0; i < gifCount; i++) {
      newGifs.push({
        id: `gif-${Date.now()}-${i}`,
        x: Math.random() * (viewportWidth - 200), // Keep within viewport
        y: Math.random() * (viewportHeight - 200),
        rotation: Math.random() * 360
      });
    }
    
    setInfectedGifs([...state.infectedGifs, ...newGifs]);
    
    // Clear infection after 10 seconds
    setTimeout(() => {
      setInfectedGifs([]);
      setIsInfected(false);
    }, 10000);
  };

  const rebootSystem = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    
    // Play window startup sound if available
    if (cheerfulSoundRef.current) {
      try {
        cheerfulSoundRef.current.currentTime = 0;
        cheerfulSoundRef.current.play().catch(err => debugLog('Startup sound error:', err));
      } catch {}
    }
    
    // Stop all sounds
    if (systemAlertSound1Ref.current) systemAlertSound1Ref.current.pause();
    if (systemAlertSound2Ref.current) systemAlertSound2Ref.current.pause();
    if (crashSoundRef.current) crashSoundRef.current.pause();
    if (virusAlertSoundRef.current) virusAlertSoundRef.current.pause();
    if (virusSirenSoundRef.current) virusSirenSoundRef.current.pause();
    
    // Full reset
    setMechanics(initializeGameMechanics());
    setPopupBehaviors(new Map());
    setPopupSpawnTimes(new Map());
    setTrapGIFs([]);
    setSillyGifs([]);
    setInfectedGifs([]);
    setInfectionEndsAt(null);
    setScorePopups([]);
    setShowBadge(null);
    setShowDifficultyUp(null);
    setShowInfection(false);
    setEncounteredPopups([]);
    
    // Reset all state using the reducer
    dispatch({ type: 'SET_SCORE', payload: 0 });
    dispatch({ type: 'SET_LEVEL', payload: 1 });
    dispatch({ type: 'SET_GAME_OVER', payload: false });
    dispatch({ type: 'SET_GAME_ACTIVE', payload: false });
    dispatch({ type: 'SET_SYSTEM_CRASHED', payload: false });
    dispatch({ type: 'SET_CRASH_SOUND_PLAYED', payload: false });
    dispatch({ type: 'SET_MISTAKES', payload: 0 });
    dispatch({ type: 'SET_SHOW_INSTRUCTIONS', payload: true });
    dispatch({ type: 'SET_POPUPS', payload: [] });
    dispatch({ type: 'SET_ACTIVE_PROGRAMS', payload: [] });
    dispatch({ type: 'SET_USE_MODERN_POPUPS', payload: true });
    
    // Reset hint modal
    dispatch({
      type: 'SET_HINT_MODAL',
      payload: { active: false, popup: null, slide: 0, currentSlide: 0 }
    });
    
    // Close all windows
    setAntivirusModalOpen(false);
    setTaskManagerOpen(false);
    setUpdateWindowOpen(false);
    setFirecatOpen(false);
    setSuspiciousFiles([]);
    setMalwareDetected(false);
    setWifiStatus('connected');
    setIsInfected(false);
    setShowVirusWarning(false);
    
    // Clear all visual elements
    setPopupPositions({});
    setMinimizedPopups(new Set());
    setInteractedPopups(new Set());
    setDraggingPopups(new Set());
    
    // Reset hidden malware
    setHiddenMalware({
      active: false,
      phase: 0,
      detectedPopups: [],
      scanInProgress: false,
      scanResults: null,
      quarantineInProgress: false
    });
    
    // Reset system resources
    setSystemResources({
      cpu: 30,
      memory: 45,
      disk: 20,
      network: 15
    });
    
    // Reset other state objects
    Object.keys(state.popupTimers).forEach(id => {
      if (state.popupTimers[id]) {
        clearTimeout(state.popupTimers[id]);
      }
    });
    
    // Clear any remaining timeouts
    const timeoutIds = Object.values(state.popupTimers);
    timeoutIds.forEach(clearTimeout);
  };

  // Handle popup interaction (click or close)
  const handlePopupInteraction = (popup: any, actionStr: string) => {
    // Prevent interactions while hint modal is active
    if (state.hintModal.active) return;
    
    // Don't process auto-close for non-timed popups
    if (actionStr === 'auto-close' && popup.closeMethod !== 'no_action') {
      return;
    }
    
    // Check if this popup has already been interacted with
    if (popup && popup.id && interactedPopups.has(popup.id)) {
      // Popup already interacted with, just remove it silently
      removePopupById(popup);
      return;
    }
    
    // Parse the action string (format: "type:safety")
    const [actionType, actionSafety] = actionStr.split(':');
    
    // Handle force close action (special case for chat popups)
    if (actionType === 'close' && actionSafety === 'force') {
      // Force close the popup without checking if it's the correct action
      removePopupById(popup);
      return;
    }
    
    // Mark this popup as interacted with to prevent spam clicking
    if (popup && popup.id) {
      setInteractedPopups(prev => {
        const newSet = new Set(Array.from(prev));
        newSet.add(popup.id);
        return newSet;
      });
    }
    
    // Determine the user's action
    let userAction: 'click' | 'close' | 'ignore';
    
    if (actionType === 'click') {
      userAction = 'click';
    } else if (actionType === 'close') {
      userAction = 'close';
    } else {
      // Default to the action type if it's already a valid action
      userAction = actionType as 'click' | 'close' | 'ignore';
    }
    
    // Check if the action was correct
    const isCorrectAction = checkCorrectAction(popup, userAction);
    
    if (isCorrectAction) {
      // Correct action - use new mechanics for scoring
      playCorrectSound();
      
      // Calculate reaction time
      const spawnTime = popupSpawnTimes.get(popup.id) || Date.now();
      const reactionTime = Date.now() - spawnTime;
      
      // Update mechanics with combo and scoring
      const oldDifficulty = mechanics.difficulty;
      const oldCombo = mechanics.combo;
      const oldBadgeCount = mechanics.badges.length;
      const newMechanics = setComboTimer(handleCorrectAction(mechanics, reactionTime));
      setMechanics(newMechanics);
      
      // Update legacy score state for compatibility
      setScore(newMechanics.score);
      
      // Show score popup with combo multiplier
      const multiplier = Math.min(newMechanics.combo, 5);
      const points = 10 * multiplier;
      const popupPos = state.popupPositions[popup.id] || { x: 0, y: 0 };
      const scoreId = `score-${Date.now()}`;
      setScorePopups(prev => [...prev, {
        id: scoreId,
        x: popupPos.x + 225, // center of popup
        y: popupPos.y + 175,
        value: points,
        isCombo: multiplier > 1,
      }]);
      setTimeout(() => {
        setScorePopups(prev => prev.filter(s => s.id !== scoreId));
      }, 1000);
      try { logEvent({ type: 'popup_correct', game: 'Popup Manic', category: popup.category, ui_type: popup.ui_type, reaction_ms: reactionTime, ts: Date.now() }); } catch {}
      
      // Emit telemetry event for backend tracking
      try {
        GameEvents.emitPopupInteraction({
          popupId: popup._id || popup.id,
          action: userAction,
          wasCorrect: true,
          reactionTime: reactionTime,
          spawnTime: spawnTime
        });
      } catch (err) {
        debugError('[Telemetry] Failed to emit popup interaction:', err);
      }
      
      // Check for new badges
      if (newMechanics.badges.length > oldBadgeCount) {
        const newBadge = newMechanics.badges[newMechanics.badges.length - 1];
        setShowBadge(newBadge);
        setTimeout(() => setShowBadge(null), 3000);
      }
      
      // Check for difficulty increase
      if (newMechanics.difficulty > oldDifficulty) {
        setShowDifficultyUp(newMechanics.difficulty + 1);
        setTimeout(() => setShowDifficultyUp(null), 3000);
      }
      
      // Check if player should level up every 100 points
      if (newMechanics.score > 0 && newMechanics.score % 100 === 0) {
        const newLevel = Math.floor(newMechanics.score / 100) + 1;
        setLevel(newLevel);
        setLevelPassMessage({show: true, level: newLevel});
        setTimeout(() => {
          setLevelPassMessage({show: false, level: 0});
        }, 300000);
      }
      
      // Spawn suspicious files at certain score milestones (every 200 points starting at 400)
      if (newMechanics.score > 0 && newMechanics.score >= 400 && newMechanics.score % 200 === 0) {
        spawnSuspiciousFile();
      }
      
      // Track encountered popup for quiz system and trigger quiz if needed
      setEncounteredPopups(prev => {
        const exists = prev.find(p => p.id === popup.id);
        const updatedPopups = exists ? prev : [...prev, popup];
        
        // Check if quiz should be triggered (every 1000 points)
        if (newMechanics.score > 0 && newMechanics.score % 1000 === 0 && updatedPopups.length >= 5) {
          debugLog('[QUIZ] Triggering security quiz at score:', newMechanics.score);
          const quizQuestions = generateQuizQuestions(updatedPopups);
          const currentQuiz = {
            level: Math.floor(newMechanics.score / 100),
            score: newMechanics.score,
            questions: quizQuestions
          };
          
          dispatch({ type: 'SET_QUIZ_ACTIVE', payload: true });
          dispatch({ type: 'SET_CURRENT_QUIZ', payload: currentQuiz });
          dispatch({ type: 'SET_QUIZ_QUESTIONS', payload: quizQuestions });
          dispatch({ type: 'SET_CURRENT_QUESTION_INDEX', payload: 0 });
          dispatch({ type: 'SET_QUIZ_ANSWERS', payload: [] });
          dispatch({ type: 'SET_QUIZ_SCORE', payload: 0 });
          setPaused(true);
        }
        
        return updatedPopups;
      });
      
      // Clean up behavior and spawn time
      setPopupBehaviors(prev => {
        const next = new Map(prev);
        next.delete(popup.id);
        return next;
      });
      setPopupSpawnTimes(prev => {
        const next = new Map(prev);
        next.delete(popup.id);
        return next;
      });
      
      removePopupById(popup);
    } else {
      // Incorrect action - use new mechanics for losing life
      playWrongSound();
      
      // Calculate reaction time
      const spawnTime = popupSpawnTimes.get(popup.id) || Date.now();
      const reactionTime = Date.now() - spawnTime;
      
      // Update mechanics (lose life and reset combo)
      const newMechanics = handleIncorrectAction(mechanics, true);
      setMechanics(newMechanics);
      
      // Update legacy mistakes state for compatibility
      const newMistakes = state.mistakes + 1;
      setMistakes(newMistakes);
      
      // Log telemetry for incorrect action
      try { 
        logEvent({ 
          type: 'popup_incorrect', 
          game: 'Popup Manic', 
          category: popup.category, 
          ui_type: popup.ui_type, 
          action: userAction, 
          reaction_ms: reactionTime, 
          ts: Date.now() 
        }); 
      } catch {}
      
      // Emit telemetry event for backend tracking
      try {
        GameEvents.emitPopupInteraction({
          popupId: popup._id || popup.id,
          action: userAction,
          wasCorrect: false,
          reactionTime: reactionTime,
          spawnTime: spawnTime
        });
      } catch (err) {
        debugError('[Telemetry] Failed to emit popup interaction:', err);
      }
      
      // Show educational modal for learning - FIXED TRIGGER
      debugLog('[MODAL] Triggering educational modal for popup:', popup.id);
      debugLog('[MODAL] Current hintModal state:', state.hintModal);
      dispatch({ 
        type: 'SET_HINT_MODAL', 
        payload: {
          active: true,
          popup: popup,
          slide: 1,
          currentSlide: 0
        }
      });
      
      // Check if game should end (either 0 lives OR 5 mistakes)
      if (newMechanics.lives === 0 || newMistakes >= 5) {
        // Play crash sound when system crashes
        if (crashSoundRef.current) {
          crashSoundRef.current.currentTime = 0;
          crashSoundRef.current.play().catch(err => debugError('Error playing crash sound:', err));
        }
        setGameOver(true);
        setGameActive(false);
        try { logEvent({ type: 'game_over', game: 'Popup Manic', score: newMechanics.score, level: newMechanics.difficulty + 1, mistakes: newMistakes, ts: Date.now() }); } catch {}
        
        // Emit telemetry event for backend tracking
        try {
          const totalInteractions = newMechanics.correctCount + newMistakes;
          const avgReactionTime = newMechanics.reactionTimes.length > 0
            ? newMechanics.reactionTimes.reduce((a, b) => a + b, 0) / newMechanics.reactionTimes.length
            : 0;
          
          GameEvents.emitGameEnd({
            stats: {
              totalPopups: totalInteractions,
              correctCount: newMechanics.correctCount,
              mistakeCount: newMistakes,
              falsePositives: 0,
              falseNegatives: 0,
              avgReactionTime: avgReactionTime,
              reactionScore: newMechanics.score,
              confidenceScore: totalInteractions > 0 ? Math.round((newMechanics.correctCount / totalInteractions) * 100) : 0,
              confidenceRating: 'balanced'
            }
          });
        } catch (err) {
          debugError('[Telemetry] Failed to emit game end:', err);
        }
        
        // Show game summary after a delay
        setTimeout(requestShowSummary, 1000);
      }
      
      setHintModal({ active: true, popup, slide: 1, currentSlide: 0 });
      // Note: Popup will be removed when user closes the educational modal
      // No automatic timeout removal to prevent unexpected popup closing
    }
  };

  // Handle trap GIF click
  const handleTrapClick = (trapId: string) => {
    debugLog('[TRAP] Trap GIF clicked:', trapId);
    
    // Show infection overlay
    setShowInfection(true);
    setTimeout(() => setShowInfection(false), 3000);
    
    // Update mechanics (lose life)
    const newMechanics = handleIncorrectAction(mechanics, true);
    setMechanics(newMechanics);
    
    // Remove trap
    setTrapGIFs(prev => prev.filter(t => t.id !== trapId));
    
    // Check for game over
    if (newMechanics.lives === 0) {
      if (crashSoundRef.current) {
        crashSoundRef.current.currentTime = 0;
        crashSoundRef.current.play().catch(err => debugError('Error playing crash sound:', err));
      }
      setGameOver(true);
      setGameActive(false);
      
      setTimeout(requestShowSummary, 3000);
    }
  };

  // Handle game restart - always show blue screen to properly reset
  const handlePlayAgain = () => {
    setShowGameSummary(false);
    // Always show blue screen for clean reset
    setSystemCrashed(true);
  };

  return (
    <>
      {/* Game Area */}
      <div className="relative w-full h-screen bg-blue-900 overflow-hidden select-none">
        {/* Desktop background - not selectable */}
        <div className="absolute inset-0 w-full h-full select-none pointer-events-none">
          <Image 
            src="/img/catwindows.png" 
            alt="Desktop Background" 
            fill 
            style={{ objectFit: 'cover' }} 
            priority
            draggable="false"
          />
        </div>

        {/* Suspicious files that appear on the desktop (clicking starts infection) */}
        {suspiciousFiles.map(file => (
          <div
            key={file.id}
            className="absolute flex flex-col items-center cursor-pointer group"
            style={{ left: file.x, top: file.y, zIndex: 120 }}
            title={`Open ${file.name}`}
            onClick={() => openSuspiciousFile(file.id)}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image src={file.icon} alt={file.name} width={48} height={48} draggable="false" />
            </div>
            <span className="text-white text-xs font-arcade text-center drop-shadow-lg bg-black/30 px-2 py-1 rounded max-w-[140px] truncate">
              {file.name}
            </span>
          </div>
        ))}

        {/* Desktop Icons - Make them clickable */}
        <div className={`${showTutorial ? 'fixed z-[12050]' : 'absolute z-[100]'} top-6 left-6 inline-grid grid-cols-1 gap-6 pointer-events-none relative`}>
          {/* Local dimmer to keep only spotlight icon bright during tutorial */}
          {showTutorial && (
            <div className="absolute inset-0 bg-black/60 rounded-lg pointer-events-none" style={{ zIndex: 1 }}></div>
          )}
          {/* Firecat Browser Icon */}
          <div 
            className={`relative flex flex-col items-start cursor-pointer group pointer-events-auto w-32 ${showTutorial ? (tutorialFocus === 'firecat' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : 'opacity-20 pointer-events-none') : ''}`}
            onClick={() => {
              setFirecatOpen(true);
              if (!state.activePrograms.includes('firecat')) {
                setActivePrograms([...state.activePrograms, 'firecat']);
              }
              if (showTutorial && tutorialFocus === 'firecat') {
                setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1));
              }
            }}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image 
                src="/img/firecat-taskbar.png" 
                alt="Firecat Browser" 
                width={48} 
                height={48}
                draggable="false"
              />
            </div>
            <span className="block w-full text-white text-sm font-arcade text-left leading-tight drop-shadow-lg bg-black/30 px-2 py-1 rounded whitespace-normal break-words min-h-[2.5rem]">Firecat</span>
          </div>

          {/* Nyantivirus Icon */}
          <div 
            className={`relative flex flex-col items-start cursor-pointer group pointer-events-auto w-32 ${showTutorial ? (tutorialFocus === 'meowarebytes' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : 'opacity-20 pointer-events-none') : ''}`}
            onClick={() => {
              if (!state.activePrograms.includes('meowarebytes')) {
                setActivePrograms([...state.activePrograms, 'meowarebytes']);
              }
              clearVirusOutbreak();
              if (showTutorial && tutorialFocus === 'meowarebytes') {
                setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1));
              }
            }}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image 
                src="/img/meowareBytes-taskbar.png" 
                alt="Nyantivirus" 
                width={48} 
                height={48} 
                draggable="false"
              />
            </div>
            <span className="block w-full text-white text-sm font-arcade text-left leading-tight drop-shadow-lg bg-black/30 px-2 py-1 rounded whitespace-normal break-words min-h-[2.5rem]">Nyantivirus</span>
          </div>

          {/* Task Manager Icon */}
          <div 
            className={`relative flex flex-col items-start cursor-pointer group pointer-events-auto w-32 ${showTutorial ? (tutorialFocus === 'taskmanager' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : 'opacity-20 pointer-events-none') : ''}`}
            onClick={() => {
              setTaskManagerOpen(true);
              if (!state.activePrograms.includes('taskmanager')) {
                setActivePrograms([...state.activePrograms, 'taskmanager']);
              }
              if (showTutorial && tutorialFocus === 'taskmanager') {
                setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1));
              }
            }}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image 
                src="/img/TaskManager-taskbar.png" 
                alt="Task Manager" 
                width={48} 
                height={48} 
                draggable="false"
              />
            </div>
            <span className="block w-full text-white text-sm font-arcade text-left leading-tight drop-shadow-lg bg-black/30 px-2 py-1 rounded whitespace-normal break-words min-h-[2.5rem]">Task Manager</span>
          </div>

          {/* Update Software Icon */}
          <div 
            className={`relative flex flex-col items-start cursor-pointer group pointer-events-auto w-32 ${showTutorial ? (tutorialFocus === 'updatesoftware' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : 'opacity-20 pointer-events-none') : ''}`}
            onClick={() => {
              setUpdateWindowOpen(true);
              if (!state.activePrograms.includes('updatesoftware')) {
                dispatch({ type: 'SET_ACTIVE_PROGRAMS', payload: [...state.activePrograms, 'updatesoftware'] });
              }
              if (showTutorial && tutorialFocus === 'updatesoftware') {
                setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1));
              }
            }}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image 
                src="/img/UpdateSoftware.png" 
                alt="Update Software" 
                width={48} 
                height={48} 
                draggable="false"
              />
            </div>
            <span className="block w-full text-white text-sm font-arcade text-left leading-tight drop-shadow-lg bg-black/30 px-2 py-1 rounded whitespace-normal break-words min-h-[2.5rem]">Updates</span>
          </div>

          {/* Notes / Manuals (Notepad) */}
          <div 
            className={`relative flex flex-col items-start cursor-pointer group pointer-events-auto w-32 ${showTutorial ? (tutorialFocus === 'notepad' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : 'opacity-20 pointer-events-none') : ''}`}
            onClick={() => {
              setNotepadOpen(true);
              if (!state.activePrograms.includes('notepad')) {
                setActivePrograms([...state.activePrograms, 'notepad']);
              }
              if (showTutorial && tutorialFocus === 'notepad') {
                // Last step completes tutorial
                if (tutorialStep >= tutorialContent.length - 1) {
                  setShowTutorial(false)
                } else {
                  setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1));
                }
              }
            }}
          >
            <div className="w-16 h-16 mb-2 group-hover:scale-110 transition-transform bg-white/20 border border-white/30 rounded-lg p-2 backdrop-blur-sm shadow-lg">
              <Image 
                src="/img/notepad-taskbar.png" 
                alt="Notes / Manuals" 
                width={48} 
                height={48} 
                draggable="false"
              />
            </div>
            <span className="block w-full text-white text-sm font-arcade text-left leading-tight drop-shadow-lg bg-black/30 px-2 py-1 rounded whitespace-normal break-words min-h-[2.5rem]">Notes / Manuals</span>
          </div>
        </div>

        {/* Start Game Instructions */}
        {state.showInstructions && !state.gameActive && !showTutorial && (
          <div className="absolute inset-0 bg-black/80 z-[9999] flex items-center justify-center">
            <div className="bg-arcade-bg border-2 border-arcade-cyan rounded-lg p-8 max-w-2xl mx-4">
              <h1 className="text-3xl font-arcade text-arcade-cyan mb-6 text-center">POPUP MANIC</h1>
              
              <div className="text-white font-arcade space-y-4 mb-8">
                <p className="text-lg"><strong>Objective:</strong> Close malicious popups while keeping legitimate ones!</p>
                
                <div className="text-sm space-y-2">
                  <p>• <span className="text-arcade-green">SAFE popups:</span> Click normally to interact</p>
                  <p>• <span className="text-arcade-red">MALICIOUS popups:</span> Force close using X button or drag to trash</p>
                  <p>• <span className="text-arcade-cyan">SCORING:</span> +10 points for correct actions</p>
                  <p>• <span className="text-arcade-magenta">MISTAKES:</span> Game ends after 5 mistakes</p>
                  <p>• <span className="text-arcade-yellow">QUIZ:</span> Educational quiz every 1000 points</p>
                </div>
                
                <div className="text-xs text-gray-300 mt-4">
                  <p>Use desktop icons to open programs. Drag windows around and minimize them to the taskbar.</p>
                  <p>Learn cybersecurity through interactive gameplay!</p>
                </div>
              </div>
              
              <div className="text-center">
                <button 
                  onClick={startGame}
                  className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade py-3 px-8 rounded-lg text-xl transition-colors"
                >
                  START GAME
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tutorial Overlay (shown after Start Game) */}
        {showTutorial && state.gameActive && (
          <>
            {/* Dark background layer */}
            <div className="fixed inset-0 bg-black/90 z-[11000]" />

            {/* Foreground card layer above spotlighted icons */}
            <div className="fixed inset-0 z-[13000] flex items-center justify-center pointer-events-none">
              <div className="bg-arcade-bg border-2 border-arcade-cyan rounded-xl p-6 max-w-3xl w-full mx-4 pointer-events-auto">
                <div className="flex items-start justify-between mb-4">
                  <h2 className="font-arcade text-2xl text-arcade-cyan">Onboarding Guide</h2>
                  <button className="font-arcade text-sm text-white/80 hover:text-white" onClick={() => setShowTutorial(false)}>Skip</button>
                </div>
                {tutorialStep === 0 && (
                  <div className="mb-4 p-4 rounded border border-arcade-magenta/60 bg-arcade-magenta/20">
                    <div className="font-arcade text-arcade-magenta text-lg mb-1">IMPORTANT</div>
                    <div className="text-white font-terminal text-sm">
                      Keep <span className="text-arcade-cyan font-semibold">Nyantivirus</span> <span className="font-semibold">UPDATED</span> via <span className="text-arcade-cyan">Software Update Center</span> (<span className="font-semibold">Update All</span>), then <span className="font-semibold">RUN SCAN OFTEN</span> to detect and quarantine threats quickly.
                    </div>
                  </div>
                )}
                <div className="bg-black/60 border border-arcade-cyan/40 rounded p-4 text-white font-terminal mb-4">
                  <div className="text-lg font-arcade text-arcade-cyan mb-2">{tutorialContent[tutorialStep].title}</div>
                  <ul className="list-disc pl-5 space-y-1">
                    {tutorialContent[tutorialStep].lines.map((l, i) => (
                      <li key={i}>{l}</li>
                    ))}
                  </ul>
                </div>
                <div className="flex items-center justify-between">
                  <div className="font-arcade text-sm text-white/70">Step {tutorialStep + 1} / {tutorialContent.length}</div>
                  <div className="flex gap-2">
                    {tutorialStep > 0 && (
                      <button className="bg-gray-700 hover:bg-gray-600 text-white font-arcade px-4 py-2 rounded" onClick={() => setTutorialStep(s => Math.max(0, s - 1))}>Back</button>
                    )}
                    <button className="bg-arcade-cyan text-black hover:bg-arcade-cyan/80 font-arcade px-4 py-2 rounded" onClick={openRelevantAppForStep}>Highlight this icon</button>
                    {tutorialStep < tutorialContent.length - 1 ? (
                      <button className="bg-arcade-magenta hover:bg-arcade-magenta/80 text-white font-arcade px-4 py-2 rounded" onClick={() => setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1))}>Next</button>
                    ) : (
                      <button className="bg-arcade-green hover:bg-arcade-green/80 text-black font-arcade px-4 py-2 rounded" onClick={() => { setShowTutorial(false); }}>Finish</button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      
      {/* Notepad / Manuals Window */}
      {notepadOpen && (
        <DraggableWindow
          title="Notepad - Manuals & Tips"
          initialPosition={{ x: 120, y: 220 }}
          width={520}
          height={480}
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-[10000]"
          handleClassName="bg-arcade-cyan/30"
          onClose={() => {
            setNotepadOpen(false)
            setActivePrograms(state.activePrograms.filter((p: string) => p !== 'notepad'))
          }}
          onMinimize={() => {
            setNotepadOpen(false)
          }}
        >
          <div className="p-4 text-white font-terminal space-y-4">
            <div className="font-arcade text-xl text-arcade-cyan">Threat Containment Checklist</div>
            <ol className="list-decimal pl-5 space-y-2 text-sm">
              <li>Open <span className="text-arcade-cyan">Nyantivirus</span> → Run Scan → Quarantine threats.</li>
              <li>Open <span className="text-arcade-cyan">Software Update Center</span> → Update All.</li>
              <li>Open <span className="text-arcade-cyan">Task Manager</span> → End suspicious tasks (e.g., coolbeans, totallysafe).</li>
              <li>Optionally toggle <span className="text-arcade-cyan">WiFi</span> off to slow ads. Remember: Updates and Firecat need internet.</li>
              <li>Repeat scans until system stays clean.</li>
            </ol>
            <div className="font-arcade text-xl text-arcade-cyan pt-2">Quick Tips</div>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Scan frequently. Quarantine clears infected GIFs and malicious popups immediately.</li>
              <li>Keep Nyantivirus updated for best protection.</li>
              <li>Use Task Manager to verify CPU/Memory spikes from malware.</li>
              <li>Firecat shows an offline screen when WiFi is off.</li>
            </ul>
          </div>
        </DraggableWindow>
      )}

      {/* Blue Screen of Death - Shows for clean game reset */}
      {state.systemCrashed && !showGameSummary && (
        <div className="absolute inset-0 bg-blue-900 z-[99999] flex flex-col items-center justify-center text-white p-8">
          <div className="max-w-2xl w-full bg-blue-800 border-4 border-white p-8 rounded-lg shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">💀</div>
              <h2 className="text-4xl font-arcade mb-4">SYSTEM CRASHED</h2>
              <div className="text-xl font-terminal mb-2">Game Over - System Overload</div>
            </div>
            <div className="mb-6 font-terminal text-base">
              <p className="mb-4">Your system has been overwhelmed by malware and security threats.</p>
              <p className="mb-4">Too many popups, infections, and security mistakes caused a catastrophic failure.</p>
              <p className="mb-4 text-arcade-cyan">Click the button below to reboot and start fresh.</p>
            </div>
            <div className="text-center">
              <button 
                onClick={rebootSystem}
                className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade py-4 px-12 rounded-lg text-2xl transition-colors shadow-lg"
              >
                REBOOT SYSTEM
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Firecat Browser Window - Responsive */}
      {firecatOpen && (
        <DraggableWindow
          title={`Firecat Browser - ${firecatUrl}`}
          initialPosition={{ x: '10vw', y: '10vh' }}
          width="80vw"
          height="80vh"
          minWidth={700}
          minHeight={500}
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-[10000] flex flex-col"
          handleClassName="bg-arcade-cyan/30 flex-shrink-0"
          onClose={() => {
            setFirecatOpen(false)
            setActivePrograms(state.activePrograms.filter(p => p !== 'firecat'))
          }}
          onMinimize={() => {
            setFirecatOpen(false)
          }}
          allowMaximize={true}
        >
          
          {/* Browser toolbar - Responsive */}
          <div className="bg-gray-800 p-2 flex items-center flex-shrink-0 flex-wrap gap-1">
            <button 
              className={`w-8 h-8 flex items-center justify-center text-white ${currentHistoryIndex > 0 ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'} rounded mr-2`}
              onClick={() => {
                if (currentHistoryIndex > 0) {
                  const newIndex = currentHistoryIndex - 1;
                  setCurrentHistoryIndex(newIndex);
                  setFirecatUrl(browserHistory[newIndex]);
                }
              }}
              disabled={currentHistoryIndex === 0}
            >
              ←
            </button>
            <button 
              className={`w-8 h-8 flex items-center justify-center text-white ${currentHistoryIndex < browserHistory.length - 1 ? 'bg-gray-700 hover:bg-gray-600 cursor-pointer' : 'bg-gray-800 text-gray-500 cursor-not-allowed'} rounded mr-2`}
              onClick={() => {
                if (currentHistoryIndex < browserHistory.length - 1) {
                  const newIndex = currentHistoryIndex + 1;
                  setCurrentHistoryIndex(newIndex);
                  setFirecatUrl(browserHistory[newIndex]);
                }
              }}
              disabled={currentHistoryIndex === browserHistory.length - 1}
            >
              →
            </button>
            <button 
              className="w-8 h-8 flex items-center justify-center text-white bg-gray-700 hover:bg-gray-600 cursor-pointer rounded mr-2"
              onClick={() => {
                // Refresh current page (just reset the URL to trigger a re-render)
                const currentUrl = browserHistory[currentHistoryIndex];
                setFirecatUrl('');
                setTimeout(() => setFirecatUrl(currentUrl), 10);
              }}
            >
              ↻
            </button>
            <div className="flex-1 bg-gray-700 rounded p-1 mx-2 text-white font-arcade text-sm min-w-0 overflow-hidden whitespace-nowrap overflow-ellipsis">
              {firecatUrl}
            </div>
          </div>
          
          {/* Browser content - Responsive */}
          <div className="bg-white p-4 flex-1 overflow-auto relative">
            {wifiStatus !== 'connected' ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">📡</div>
                  <h2 className="text-2xl font-arcade text-gray-800 mb-2">No Internet Connection</h2>
                  <p className="text-gray-600 font-terminal">Check your WiFi connection to browse the web</p>
                </div>
              </div>
            ) : (
              <div className="w-full h-full min-h-0 overflow-auto" style={{ 
                transform: 'scale(var(--browser-zoom, 1))', 
              transformOrigin: '0 0', 
              width: 'calc(100% / var(--browser-zoom, 1))', 
              height: 'calc(100% / var(--browser-zoom, 1))' 
            }}>
              <style jsx global>{`
                @media (max-width: 1024px) {
                  :root {
                    --browser-zoom: 0.8;
                  }
                }
                @media (max-width: 768px) {
                  :root {
                    --browser-zoom: 0.7;
                  }
                }
                @media (max-width: 640px) {
                  :root {
                    --browser-zoom: 0.6;
                  }
                }
                @media (max-width: 480px) {
                  :root {
                    --browser-zoom: 0.5;
                  }
                }
              `}</style>
              {firecatUrl === 'https://www.meowgle.com' && (
                <div className="text-black">
                  <div className="flex justify-center mb-4 md:mb-6">
                    <h1 className="text-2xl md:text-3xl font-bold text-blue-500">Meowgle</h1>
                  </div>
                  <div className="flex justify-center mb-6 px-4">
                    <div className="w-full max-w-[400px] border border-gray-300 rounded-full p-2 flex">
                      <input 
                        type="text" 
                        className="flex-1 outline-none text-black bg-transparent" 
                        placeholder="Search the web..."
                      />
                      <button className="bg-blue-500 text-white px-4 py-1 rounded-full">Search</button>
                    </div>
                  </div>
                  
                  {/* Fake search results or content */}
                  <div className="mt-8">
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded" onClick={() => {
                      const newUrl = 'https://www.discount-deals.com';
                      // Add to history and navigate
                      const newHistory = browserHistory.slice(0, currentHistoryIndex + 1);
                      newHistory.push(newUrl);
                      setBrowserHistory(newHistory);
                      setCurrentHistoryIndex(newHistory.length - 1);
                      setFirecatUrl(newUrl);
                    }}>
                      <h2 className="text-blue-600 text-lg">Amazing Discount Deals - 90% OFF Today Only!</h2>
                      <p className="text-green-600 text-sm">www.discount-deals.com</p>
                      <p className="text-gray-700">Find the best deals online. Huge discounts on electronics, fashion, and more.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Meow News - Latest Headlines</h2>
                      <p className="text-green-600 text-sm">news.meowgle.com</p>
                      <p className="text-gray-700">Stay updated with the latest news from around the world.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Purrfect Videos - Watch Now</h2>
                      <p className="text-green-600 text-sm">videos.meowgle.com</p>
                      <p className="text-gray-700">Stream your favorite cat videos and more.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Phishing Awareness Training - Protect Your Digital Life</h2>
                      <p className="text-green-600 text-sm">security.meow/phishing-training</p>
                      <p className="text-gray-700">Learn to identify suspicious emails, fake websites, and social engineering attacks. Interactive training modules with real-world examples.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Cat-Friendly Home Security Systems</h2>
                      <p className="text-green-600 text-sm">homesecurity.meow/cat-safe</p>
                      <p className="text-gray-700">Motion sensors that won't trigger on cats, pet-safe cameras, and security tips for multi-pet households.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Digital Privacy Guide for Cat Parents</h2>
                      <p className="text-green-600 text-sm">privacy.meow/guide</p>
                      <p className="text-gray-700">Protect your personal data when using pet apps, social media, and online veterinary services. Complete privacy checklist included.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Cat Photography Masterclass - Capture Purrfect Moments</h2>
                      <p className="text-green-600 text-sm">photography.meow/masterclass</p>
                      <p className="text-gray-700">Professional tips for photographing cats. Learn lighting, composition, and how to get that perfect action shot of your feline friend.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Safe Online Shopping for Pet Supplies</h2>
                      <p className="text-green-600 text-sm">shopping.meow/safety-guide</p>
                      <p className="text-gray-700">How to verify legitimate pet supply websites, avoid counterfeit products, and protect your payment information when shopping online.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Cat Health Emergency Guide - When to Call the Vet</h2>
                      <p className="text-green-600 text-sm">health.meow/emergency-guide</p>
                      <p className="text-gray-700">Recognize signs of cat emergencies, first aid basics, and how to find 24/7 veterinary care in your area.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Password Security for Pet Lovers</h2>
                      <p className="text-green-600 text-sm">security.meow/passwords</p>
                      <p className="text-gray-700">Create strong passwords for pet-related accounts, use two-factor authentication, and manage your digital identity safely.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Social Media Safety for Pet Owners</h2>
                      <p className="text-green-600 text-sm">socialmedia.meow/safety</p>
                      <p className="text-gray-700">Share pet photos safely, avoid oversharing location data, and protect your privacy while connecting with other pet lovers.</p>
                    </div>
                    
                    <div className="mb-4 cursor-pointer hover:bg-gray-100 p-2 rounded">
                      <h2 className="text-blue-600 text-lg">Indoor Cat Enrichment Ideas - Keep Your Cat Happy</h2>
                      <p className="text-green-600 text-sm">enrichment.meow/indoor-cats</p>
                      <p className="text-gray-700">Creative ways to stimulate indoor cats, DIY toy ideas, and environmental enrichment tips from feline behaviorists.</p>
                    </div>
                  </div>
                </div>
              )}
              {firecatUrl === 'https://www.discount-deals.com' && (
                <div className="text-black">
                  <div className="flex justify-between items-center mb-6 border-b pb-4">
                    <h1 className="text-2xl font-bold text-red-600">DISCOUNT DEALS</h1>
                    <p className="text-red-600 font-bold animate-pulse">FLASH SALE! 90% OFF EVERYTHING!</p>
                  </div>
                  
                  <div className="bg-yellow-100 p-4 border border-yellow-400 rounded mb-6">
                    <p className="text-center font-bold">🎉 Congratulations! You are our 1,000,000th visitor! Claim your FREE prize now! 🎉</p>
                    <div className="flex justify-center mt-2">
                      <button 
                        className="bg-green-500 text-white px-4 py-2 rounded font-bold"
                        onClick={async () => {
                          try {
                            // Fetch a random popup from the database
                            const apiPopup = await fetchRandomPopup();
                            
                            if (apiPopup) {
                              // Transform the API popup to match our Popup interface
                              // Force size to be appropriate for a prize claim popup
                              const randomPopup = transformPopupFromAPI(apiPopup);
                               
                              // Add the popup to the state
                              setPopups([...state.popups, randomPopup]);
                              if (randomPopup.id) {
                                setPopupPositions({
                                  ...state.popupPositions,
                                  [randomPopup.id]: generateRandomPosition()
                                });
                              }
                            } else {
                              // Fallback to a default popup if API call fails
                              const fallbackPopup = new Popup({
                                id: `popup-${Date.now()}`,
                                title: 'Claim Your Prize!',
                                message: 'Enter your credit card details to claim your FREE prize worth $1000!',
                                position: { x: Math.random() * 400 + 150, y: Math.random() * 200 + 150 },
                                size: { width: 350, height: 250 },
                                style: {
                                  theme: 'modern',
                                  headerColor: '#d32f2f',
                                  bodyColor: '#ffffff',
                                  borderColor: '#ff5252',
                                  borderWidth: 2,
                                  borderRadius: 8,
                                  fontFamily: '"Roboto", "Arial", sans-serif',
                                  fontSize: '14px',
                                  boxShadow: '0 12px 24px rgba(0, 0, 0, 0.12)'
                                },
                                // New model properties
                                is_malicious: true,
                                ui_type: 'system_alert',
                                category: 'security_warning',
                                correct_action: 'FORCE_CLOSE_OS_LEVEL',
                                elements: {
                                  hasButton: true,
                                  buttonText: 'Claim Now',
                                  hasInputField: true,
                                  inputFieldLabel: 'Credit Card Number'
                                },
                                phishingIndicators: {
                                  misspellings: false,
                                  urgencyLanguage: true,
                                  suspiciousURL: true,
                                  poorFormatting: false,
                                  inconsistentBranding: true,
                                  grammaticalErrors: false,
                                  requestForPersonalInfo: true,
                                  unexpectedAttachment: false,
                                  threatLanguage: false
                                }
                              });
                              setPopups([...state.popups, fallbackPopup]);
                            }
                            
                            // Set malware detected flag
                            setMalwareDetected(true);
                            
                            // Increase system resources usage
                            setSystemResources(prev => ({
                              cpu: Math.min(85, prev.cpu + 25),
                              memory: Math.min(80, prev.memory + 30),
                              disk: Math.min(75, prev.disk + 20),
                              network: Math.min(90, prev.network + 40)
                            }));
                          } catch (error) {
                            debugError('Error fetching popup:', error);
                          }
                        }}
                      >
                        CLAIM NOW
                      </button>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                      <div key={i} className="border border-gray-300 p-4 rounded">
                        <div className="bg-gray-200 h-32 mb-2 flex items-center justify-center">
                          <span className="text-gray-500">Product Image</span>
                        </div>
                        <h3 className="font-bold">Amazing Product {i}</h3>
                        <div className="flex items-center mt-1">
                          <span className="line-through text-gray-500 mr-2">$199.99</span>
                          <span className="text-red-600 font-bold">$19.99</span>
                        </div>
                        <button 
                          className="w-full bg-red-600 text-white mt-2 py-1 rounded"
                          onClick={async () => {
                            try {
                              // Fetch a random popup from the database
                              const apiPopup = await fetchRandomPopup();
                              
                              if (apiPopup) {
                                // Transform the API popup to match our Popup interface
                                const randomPopup = transformPopupFromAPI(apiPopup);
                                
                                // Generate position first and store it
                                const popupPosition = generateRandomPosition(randomPopup.ui_type);
                                
                                // Add the popup to the state using addPopup action
                                addPopup(randomPopup);
                                setPopupPositions({
                                  ...state.popupPositions,
                                  [randomPopup.id]: popupPosition
                                });
                                
                                debugLog(`Spawned product popup ${randomPopup.id} at position:`, popupPosition);
                              } else {
                                // Fallback to a default popup if API call fails
                                const fallbackPosition = generateRandomPosition('system_notification');
                                const fallbackPopup = new Popup({
                                  id: `popup-${Date.now()}`,
                                  title: 'Add to Cart',
                                  message: 'Item added to your cart!',
                                  position: fallbackPosition,
                                  size: { width: 300, height: 150 },
                                  style: {
                                    theme: 'modern',
                                    headerColor: '#4caf50',
                                    bodyColor: '#ffffff',
                                    borderColor: '#81c784',
                                    borderWidth: 1,
                                    borderRadius: 8,
                                    fontFamily: '"Roboto", sans-serif',
                                    fontSize: '14px',
                                    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                                  },
                                  // New model properties
                                  is_malicious: false,
                                  ui_type: 'notification',
                                  category: 'benign_notification',
                                  correct_action: 'CLOSE_LEGITIMATE_NATIVE',
                                  elements: {
                                    hasLogo: true,
                                    logoPath: '/img/logos/shopping-cart.png',
                                    hasButton: false
                                  }
                                });
                                setPopups([...state.popups, fallbackPopup]);
                                setPopupPositions({
                                  ...state.popupPositions,
                                  [fallbackPopup.id]: fallbackPosition
                                });
                                
                                debugLog(`Spawned product fallback popup ${fallbackPopup.id} at position:`, fallbackPosition);
                              }
                            } catch (error) {
                              debugError('Error fetching popup:', error);
                            }
                          }}
                        >
                          Add to Cart
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            )}
          </div>
        </DraggableWindow>
      )}
      
      {/* Task Manager Window */}
      {taskManagerOpen && (
        <DraggableWindow
          title="Task Manager"
          initialPosition={{ x: 200, y: 150 }}
          width={600}
          height={500}
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-[10000]"
          handleClassName="bg-arcade-cyan/30"
          onClose={() => {
            setTaskManagerOpen(false)
            setActivePrograms(state.activePrograms.filter((p: string) => p !== 'taskmanager'))
          }}
          onMinimize={() => {
            setTaskManagerOpen(false)
          }}
          isTaskManager={true}
        >
          {/* Task Manager tabs */}
          <div className="bg-gray-800 flex border-b border-gray-700">
            <button 
              className={`px-4 py-2 font-arcade text-sm ${taskManagerTab === 'processes' ? 'bg-arcade-bg text-arcade-cyan' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setTaskManagerTab('processes')}
            >
              Processes
            </button>
            <button 
              className={`px-4 py-2 font-arcade text-sm ${taskManagerTab === 'performance' ? 'bg-arcade-bg text-arcade-cyan' : 'text-white hover:bg-gray-700'}`}
              onClick={() => setTaskManagerTab('performance')}
            >
              Performance
            </button>
          </div>
          
          {/* Task Manager content */}
          <div className="p-4 h-[400px] overflow-auto">
            {taskManagerTab === 'processes' && (
              <div>
                <div className="mb-4">
                  <h3 className="font-arcade text-arcade-cyan mb-2">Running Processes</h3>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="grid grid-cols-5 font-arcade text-xs text-white mb-2 border-b border-gray-700 pb-1">
                      <div>Name</div>
                      <div>Status</div>
                      <div>CPU</div>
                      <div>Memory</div>
                      <div>Action</div>
                    </div>
                    
                    {/* System processes */}
                    <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>System</div>
                      <div>Running</div>
                      <div>2%</div>
                      <div>120 MB</div>
                      <div></div>
                    </div>
                    
                    {/* Running programs */}
                    {state.activePrograms.includes('firecat') && (
                      <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                        <div>Firecat.exe</div>
                        <div>Running</div>
                        <div>15%</div>
                        <div>280 MB</div>
                        <div>
                          <button 
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                              setFirecatOpen(false)
                              setActivePrograms(state.activePrograms.filter((p: string) => p !== 'firecat'))
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {state.activePrograms.includes('meowarebytes') && (
                      <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                        <div>Nyantivirus.exe</div>
                        <div>Running</div>
                        <div>22%</div>
                        <div>350 MB</div>
                        <div>
                          <button 
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                              setActivePrograms(state.activePrograms.filter((p: string) => p !== 'meowarebytes'))
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {state.activePrograms.includes('updatesoftware') && (
                      <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                        <div>UpdateSoftware.exe</div>
                        <div>Running</div>
                        <div>8%</div>
                        <div>150 MB</div>
                        <div>
                          <button 
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                              setUpdateWindowOpen(false)
                              setActivePrograms(state.activePrograms.filter((p: string) => p !== 'updatesoftware'))
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {/* Task Manager itself in the process list */}
                    <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>TaskManager.exe</div>
                      <div>Running</div>
                      <div>5%</div>
                      <div>120 MB</div>
                      <div>
                        <button 
                          className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                          onClick={() => {
                            setTaskManagerOpen(false)
                            setActivePrograms(state.activePrograms.filter((p: string) => p !== 'taskmanager'))
                          }}
                        >
                          End Task
                        </button>
                      </div>
                    </div>
                    
                    {/* Malware process - only shown if malware is detected */}
                    {malwareDetected && (
                      <div className="grid grid-cols-5 font-arcade text-xs text-red-500 py-1 border-b border-gray-600 bg-red-900/20">
                        <div>malware.exe</div>
                        <div>Running</div>
                        <div>45%</div>
                        <div>620 MB</div>
                        <div>
                          <button 
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                              setMalwareDetected(false)
                              setSystemResources({
                                cpu: 30,
                                memory: 45,
                                disk: 20,
                                network: 15
                              })
                              // Add score for finding and removing malware
                              setScore(state.score + 50)
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-arcade text-arcade-cyan mb-2">Popup Summary</h3>
                  <div className="bg-gray-800 p-2 rounded">
                    <div className="grid grid-cols-2 font-arcade text-xs text-white mb-2 border-b border-gray-700 pb-1">
                      <div>Type</div>
                      <div>Count</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Malicious</div>
                      <div>{state.popups.filter(p => p.type === 'malicious').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Benign</div>
                      <div>{state.popups.filter(p => p.type === 'benign').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Neutral</div>
                      <div>{state.popups.filter(p => p.type === 'neutral').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Total</div>
                      <div>{state.popups.length}</div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            {taskManagerTab === 'performance' && (
              <div>
                <h3 className="font-arcade text-arcade-cyan mb-4">System Resources</h3>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-arcade text-sm text-white">CPU Usage</span>
                    <span className={`font-arcade text-xs ${systemResources.cpu > 80 ? 'text-red-500' : 'text-arcade-cyan'}`}>{systemResources.cpu}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${systemResources.cpu > 80 ? 'bg-red-500' : 'bg-arcade-cyan'}`}
                      style={{ width: `${systemResources.cpu}%` }}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-arcade text-sm text-white">Memory Usage</span>
                    <span className={`font-arcade text-xs ${systemResources.memory > 80 ? 'text-red-500' : 'text-arcade-cyan'}`}>{systemResources.memory}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${systemResources.memory > 80 ? 'bg-red-500' : 'bg-arcade-cyan'}`}
                      style={{ width: `${systemResources.memory}%` }}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-arcade text-sm text-white">Disk Usage</span>
                    <span className={`font-arcade text-xs ${systemResources.disk > 80 ? 'text-red-500' : 'text-arcade-cyan'}`}>{systemResources.disk}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${systemResources.disk > 80 ? 'bg-red-500' : 'bg-arcade-cyan'}`}
                      style={{ width: `${systemResources.disk}%` }}
                    />
                  </div>
                </div>
                
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-arcade text-sm text-white">Network Usage</span>
                    <span className={`font-arcade text-xs ${systemResources.network > 80 ? 'text-red-500' : 'text-arcade-cyan'}`}>{systemResources.network}%</span>
                  </div>
                  <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ease-out ${systemResources.network > 80 ? 'bg-red-500' : 'bg-arcade-cyan'}`}
                      style={{ width: `${systemResources.network}%` }}
                    />
                  </div>
                </div>
                
                {(systemResources.cpu > 80 || systemResources.memory > 80 || systemResources.network > 80) && (
                  <div className="bg-red-900/30 border border-red-500 p-3 rounded mt-4">
                    <p className="font-arcade text-red-500 text-sm">WARNING: System resources are abnormally high. Possible malware detected. Check running processes.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </DraggableWindow>
      )}
      
      {/* Update Software Window */}
      {updateWindowOpen && (
        <DraggableWindow
          title="Software Update Center"
          initialPosition={{ x: 250, y: 150 }}
          width={500}
          height={400}
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-[10000]"
          handleClassName="bg-arcade-cyan/30"
          onClose={() => {
            setUpdateWindowOpen(false)
            setActivePrograms(state.activePrograms.filter((p: string) => p !== 'updatesoftware'))
            if (updatingSoftware) {
              setUpdatingSoftware(false)
              setSoftwareUpdateProgress({
                'Firecat Browser': 0,
                'Nyantivirus': 0,
                'Windows Security': 0
              })
            }
          }}
          onMinimize={() => {
            setUpdateWindowOpen(false)
          }}
          allowMaximize={true}
        >
          {/* Window content */}
          <div className="p-4">
            <h3 className="font-arcade text-arcade-cyan mb-4">Available Updates</h3>
            
            {Object.entries(softwareUpdateProgress).map(([software, progress]) => (
              <div key={software} className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="font-arcade text-sm text-white">{software}</span>
                  <span className="font-arcade text-xs text-arcade-cyan">{progress}%</span>
                </div>
                <div className="w-full h-4 bg-gray-700 rounded overflow-hidden">
                  <div 
                    className="h-full bg-arcade-cyan transition-all duration-300 ease-out"
                    style={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            ))}
            
            <div className="flex justify-end mt-6">
              {wifiStatus !== 'connected' && (
                <div className="text-red-400 text-sm font-terminal mr-4 flex items-center">
                  ⚠️ No internet connection
                </div>
              )}
              <button 
                className={`font-arcade text-sm px-4 py-2 rounded ${!updatingSoftware && wifiStatus === 'connected' ? 'bg-arcade-cyan text-black hover:bg-arcade-cyan/80' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                onClick={() => {
                  if (!updatingSoftware && wifiStatus === 'connected') {
                    setUpdatingSoftware(true)
                    setSoftwareUpdateProgress({
                      'Firecat Browser': 0,
                      'Nyantivirus': 0,
                      'Windows Security': 0
                    })
                  } else if (wifiStatus !== 'connected') {
                    alert('Unable to install updates - check your internet connection!')
                  }
                }}
                disabled={updatingSoftware || wifiStatus !== 'connected'}
              >
                {updatingSoftware ? 'Updating...' : 'Update All'}
              </button>
            </div>
          </div>
        </DraggableWindow>
      )}

      {/* Antivirus Modal */}
      {antivirusModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[14000] flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
          <div className="w-full max-w-md rounded-xl shadow-2xl border-2 border-arcade-cyan bg-gradient-to-b from-black via-gray-900 to-black" onClick={(e) => e.stopPropagation()}>
            <div className="px-6 py-4 border-b-2 border-gray-800">
              <h2 className="font-arcade text-3xl text-arcade-cyan tracking-wider">NYANTIVIRUS</h2>
              <div className="text-xs text-gray-400 font-terminal">Real-time protection and quarantine</div>
            </div>
            <div className="p-6 space-y-4 text-gray-200 font-terminal">
              {antivirusModalStep === 'confirm' && (
                <p className="text-base">Run a quick scan to check your system status.</p>
              )}

              {antivirusModalStep === 'scanning' && (
                <div>
                  <p className="text-base mb-3 text-arcade-cyan">Scanning system. Please wait…</p>
                  <div className="w-full h-3 bg-gray-800 rounded">
                    <div className="h-3 bg-arcade-cyan rounded" style={{ width: `${antivirusProgress}%`, transition: 'width 120ms linear' }} />
                  </div>
                  <div className="mt-2 text-right text-sm text-gray-400">{Math.round(antivirusProgress)}%</div>
                </div>
              )}

              {antivirusModalStep === 'done' && (
                <div className="space-y-3">
                  {antivirusResult === 'healthy' && (
                    <>
                      <div className="text-green-400 text-base font-semibold">System healthy. No threats found.</div>
                      <div className="text-gray-400 text-sm">You're up to date and connected.</div>
                    </>
                  )}

                  {antivirusResult === 'unhealthy' && (
                    <>
                      <div className="text-yellow-400 text-lg font-semibold">System needs attention. No active threats found.</div>
                      <ul className="text-gray-400 text-base list-disc pl-5 space-y-2 mt-3">
                        {(softwareUpdateProgress['Nyantivirus'] ?? 0) < 100 && (
                          <li>Ensure Nyantivirus is up to date.</li>
                        )}
                        {wifiStatus !== 'connected' && (
                          <li>Check your internet connection.</li>
                        )}
                        {(suspiciousFiles?.length ?? 0) > 0 && (
                          <li>Remove suspicious files on desktop.</li>
                        )}
                      </ul>
                    </>
                  )}

                  {antivirusResult === 'infected' && (
                    <>
                      <div className="text-red-400 text-base font-semibold">Threats detected! Quarantine recommended.</div>
                      <div className="text-gray-400 text-sm">Click Quarantine to remove detected items.</div>
                    </>
                  )}
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t-2 border-gray-800 flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {antivirusModalStep === 'confirm' && (
                <>
                  <button className="px-4 py-2 text-sm rounded border-2 border-gray-700 text-gray-300 hover:bg-gray-800 font-terminal" onClick={(e) => { e.stopPropagation(); closeAntivirusModal(); }}>Cancel</button>
                  <button className="px-4 py-2 text-sm rounded bg-arcade-cyan text-black hover:opacity-90 font-arcade" onClick={(e) => { e.stopPropagation(); startAntivirusScan(); }}>Run Quick Scan</button>
                </>
              )}
              {antivirusModalStep === 'scanning' && (
                <button className="px-4 py-2 text-sm rounded border-2 border-gray-700 text-gray-400 cursor-not-allowed opacity-60" disabled>Scanning…</button>
              )}
              {antivirusModalStep === 'done' && (
                <>
                  {antivirusResult === 'infected' && (
                    <button className="px-4 py-2 text-sm rounded bg-red-600 text-white hover:bg-red-500 font-arcade" onClick={(e) => { e.stopPropagation(); quarantineMalware(); }}>Quarantine</button>
                  )}
                  {antivirusResult === 'unhealthy' && (softwareUpdateProgress['Nyantivirus'] ?? 0) < 100 && (
                    <button 
                      className="px-4 py-2 text-sm rounded bg-arcade-cyan text-black hover:opacity-90 font-arcade" 
                      onClick={(e) => { 
                        e.stopPropagation(); 
                        closeAntivirusModal();
                        setUpdateWindowOpen(true);
                        if (!state.activePrograms.includes('updatesoftware')) {
                          dispatch({ type: 'SET_ACTIVE_PROGRAMS', payload: [...state.activePrograms, 'updatesoftware'] });
                        }
                      }}
                    >
                      Update Nyantivirus
                    </button>
                  )}
                  <button className="px-4 py-2 text-sm rounded border-2 border-gray-700 text-gray-300 hover:bg-gray-800 font-terminal" onClick={(e) => { e.stopPropagation(); closeAntivirusModal(); }}>Close</button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Game HUD as Windows taskbar at bottom */}
      <div className={`fixed bottom-0 left-0 right-0 bg-arcade-bg/90 backdrop-blur-sm p-2 ${showTutorial && tutorialFocus === 'wifi' ? 'z-[12050]' : 'z-[200]'} flex justify-between items-center border-t border-gray-700 pointer-events-auto`}>
        <div className="flex items-center relative">
          <div 
            className={`bg-arcade-cyan/20 p-1.5 rounded mr-4 flex items-center cursor-pointer ${startMenuOpen ? 'bg-arcade-cyan/40' : ''} ${showTutorial && tutorialFocus === 'wifi' ? 'opacity-20 pointer-events-none' : ''}`}
            onClick={() => setStartMenuOpen(!startMenuOpen)}
          >
            <Image 
              src="/img/window.png" 
              alt="Windows icon" 
              width={16} 
              height={16} 
              className="mr-1"
              draggable="false"
            />
            <span className="text-arcade-cyan font-arcade text-sm">START</span>
          </div>
          
          {/* WiFi icon with tooltip and dropdown */}
          <div className={`flex items-center justify-center mx-2 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded relative ${showTutorial && tutorialFocus === 'wifi' ? 'z-[12100] ring-4 ring-arcade-cyan animate-pulse' : ''}`}
            onClick={() => {
              setWifiMenuOpen(!wifiMenuOpen)
              // Close start menu if open
              if (startMenuOpen) setStartMenuOpen(false)
              if (showTutorial && tutorialFocus === 'wifi') {
                setTutorialStep(s => Math.min(tutorialContent.length - 1, s + 1))
              }
            }}
          >
            <div className="group">
              <Image 
                src={wifiStatus === 'connected' ? '/img/wifi-good.png' : 
                     wifiStatus === 'poor' ? '/img/wifi-bad.png' : 
                     '/img/wifi-down.png'} 
                alt="WiFi" 
                width={20} 
                height={20} 
                draggable="false"
              />
              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-arcade-bg border border-arcade-cyan text-arcade-cyan text-xs font-arcade rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                {wifiStatus === 'connected' && 'Connected: Good signal'}
                {wifiStatus === 'poor' && 'Connected: Poor signal'}
                {wifiStatus === 'disconnected' && 'Not connected'}
              </div>
            </div>
            
            {/* WiFi Dropdown Menu */}
            {wifiMenuOpen && (
              <div className="absolute bottom-full left-0 mb-1 bg-arcade-bg/95 border border-arcade-cyan rounded-t-md w-48 overflow-hidden">
                <div className="p-2 font-arcade text-sm text-arcade-cyan">
                  <div className="flex justify-between items-center">
                    <span>WiFi</span>
                    <div 
                      className={`w-10 h-5 rounded-full ${wifiStatus !== 'disconnected' ? 'bg-arcade-cyan' : 'bg-gray-600'} relative cursor-pointer`}
                      onClick={(e) => {
                        e.stopPropagation()
                        setWifiStatus(prev => prev !== 'disconnected' ? 'disconnected' : 'connected')
                      }}
                    >
                      <div 
                        className={`absolute w-4 h-4 rounded-full bg-white top-0.5 transition-all ${wifiStatus !== 'disconnected' ? 'right-0.5' : 'left-0.5'}`}
                      />
                    </div>
                  </div>
                </div>
                <div className="p-2 font-arcade text-sm text-arcade-cyan">
                  {wifiStatus === 'connected' && 'Connection: Good'}
                  {wifiStatus === 'poor' && 'Connection: Poor'}
                  {wifiStatus === 'disconnected' && 'Not connected'}
                </div>
              </div>
            )}
          </div>
          
          {/* Bell icon */}
          <div className={`flex items-center justify-center mx-2 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded ${showTutorial && tutorialFocus === 'wifi' ? 'opacity-20 pointer-events-none' : ''}`}>
            <Image 
              src="/img/bell-rmb.png" 
              alt="Notifications" 
              width={20} 
              height={20} 
              draggable="false"
            />
          </div>
          
          {/* Running programs in taskbar */}
          <div className={`flex items-center ml-2 ${showTutorial && tutorialFocus === 'wifi' ? 'opacity-20 pointer-events-none' : ''}`}>
            {state.activePrograms.includes('firecat') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded`}
              >
                <Image 
                  src="/img/firecat-taskbar.png" 
                  alt="Firecat Browser" 
                  width={24} 
                  height={24} 
                  draggable="false"
                />
              </div>
            )}
            
            {state.activePrograms.includes('updatesoftware') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded`}
              >
                <Image 
                  src="/img/UpdateSoftware.png" 
                  alt="Update Software" 
                  width={24} 
                  height={24} 
                  draggable="false"
                />
              </div>
            )}
            
            {state.activePrograms.includes('taskmanager') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded`}
              >
                <Image 
                  src="/img/TaskManager-taskbar.png" 
                  alt="Task Manager" 
                  width={24} 
                  height={24} 
                  draggable="false"
                />
              </div>
            )}
            
            {/* Nyantivirus Taskbar Icon - Always visible for virus outbreak clearing */}
            <div 
              className="flex items-center justify-center mx-1 cursor-pointer hover:bg-arcade-cyan/20 p-2 rounded transition-colors relative"
              onClick={clearVirusOutbreak}
              title="Nyantivirus - Click to clear virus outbreak"
            >
              <Image 
                src="/img/meowareBytes-taskbar.png" 
                alt="Nyantivirus" 
                width={32} 
                height={32} 
                draggable="false"
              />
              {state.infectedGifs.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 border-2 border-white rounded-full animate-bounce shadow-lg">
                  <div className="absolute inset-0 bg-red-400 rounded-full animate-ping"></div>
                </div>
              )}
            </div>
            
            {/* Minimized popups in taskbar */}
            {Array.from(state.minimizedPopups).map(popupId => {
              const popup = state.popups.find(p => p.id === popupId);
              if (!popup) return null;

              return (
                <div 
                  key={popupId}
                  className="flex items-center justify-center mx-1 cursor-pointer bg-arcade-magenta/30 hover:bg-arcade-magenta/50 p-1 rounded transition-colors"
                  onClick={() => {
                    // Restore popup from minimized state
                    const next = new Set(state.minimizedPopups);
                    next.delete(popupId);
                    setMinimizedPopups(next);
                  }}
                  style={{
                    minWidth: '80px',
                    maxWidth: '120px'
                  }}
                >
                  <span className="text-xs text-white font-arcade truncate px-1">
                    {popup.brand_elements?.impersonated_brand_name || popup.title || 'Popup'}
                  </span>
                </div>
              );
            })}
          </div>
          

          
          {/* Start Menu Dropdown */}
          {startMenuOpen && (
            <div className="absolute bottom-full left-0 mb-1 bg-arcade-bg/95 border border-arcade-cyan rounded-t-md w-48 overflow-hidden">
              <div 
                className="p-2 font-arcade text-sm text-arcade-cyan hover:bg-arcade-cyan/20 cursor-pointer"
                onClick={() => { window.location.href = '/'; }}
              >
                Back to Homepage
              </div>
              {/* Spawn Random Popup - Hidden from players */}
              {false && (
                <div 
                  className="p-2 font-arcade text-sm text-arcade-cyan hover:bg-arcade-cyan/20 cursor-pointer"
                  onClick={async () => {
                    try {
                      // Fetch a random popup from the database
                      const apiPopup = await fetchRandomPopup();
                      
                      if (apiPopup) {
                        // Transform the API popup to match our Popup interface
                        const randomPopup = transformPopupFromAPI(apiPopup);
                        
                        // Generate position first and store it
                        const popupPosition = generateRandomPosition(randomPopup.ui_type);
                        
                        // Add the popup to the state using the addPopup action
                        addPopup(randomPopup);
                        setPopupPositions({
                          ...state.popupPositions,
                          [randomPopup.id]: popupPosition
                        });
                        
                        debugLog(`[RENDER] Popup ${randomPopup.id} position:`, popupPosition, 'from popupPositions:', state.popupPositions[randomPopup.id]);
                      } else {
                        // Try one more time with a different API call approach
                        try {
                          // Try to get any popup regardless of type
                          debugLog('First API call failed, trying again with different parameters...');
                          const fallbackPopup = generateFallbackPopup();
                          const fallbackPosition = generateRandomPosition(fallbackPopup.ui_type);
                          setPopupPositions({...state.popupPositions, [fallbackPopup.id]: fallbackPosition});
                          addPopup(fallbackPopup);
                        } catch (fallbackError) {
                          debugError('Fallback popup generation failed:', fallbackError);
                        }
                      }
                    } catch (error) {
                      debugError('Error fetching popup:', error);
                      // Use fallback popup
                      const fallbackPopup = generateFallbackPopup();
                      const fallbackPosition = generateRandomPosition(fallbackPopup.ui_type);
                      setPopupPositions({...state.popupPositions, [fallbackPopup.id]: fallbackPosition});
                      addPopup(fallbackPopup);
                    }
                  }}
                >
                  Spawn Random Popup
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Active Power-Up Status - RIGHT SIDE OF TASKBAR */}
        <div className="flex items-center text-arcade-cyan font-arcade text-sm">
          {mechanics.activePowerUp ? (
            <span>
              POWER-UP: {mechanics.activePowerUp.type?.toUpperCase()}
            </span>
          ) : (
            <span>POWER-UP: NONE</span>
          )}
        </div>
      </div>

      {/* Background click handler */}
      <div 
        className="fixed inset-0 z-0"
        onClick={() => {
          // Only unhighlight if game is active and hint modal is not showing
          if (state.gameActive && !state.hintModal.active && !state.systemCrashed) {
            setActivePopupId(null);
          }
        }}
      ></div>

      {/* Render popups */}
      <div className="fixed inset-0 z-[150] pointer-events-none">
        {state.popups.map((popup, index) => {
          // Ensure popup has an ID
          if (!popup.id) {
            const newId = `popup-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
            popup.id = newId;
            debugLog(`[FIX] Assigned missing ID to popup:`, popup.id);
            
            // If there's a position stored under undefined, move it to the new ID
            if (state.popupPositions[undefined as any]) {
              const newPositions = { ...state.popupPositions } as Record<string, { x: number; y: number }>;
              const newPosition = generateRandomPosition(popup.ui_type || 'system_alert');
              newPositions[newId] = newPosition;
              debugLog(`[FIX] Assigned new position for popup ${newId}:`, newPosition);
              setPopupPositions(newPositions);
            }
          }
          
          // Ensure each popup has a stored position; if missing, assign one now
          let popupPos = state.popupPositions[popup.id] as { x: number; y: number } | undefined;
          if (!popupPos) {
            const assigned = generateRandomPosition(popup.ui_type);
            setPopupPositions({ ...state.popupPositions, [popup.id]: assigned });
            popupPos = assigned;
          }
          const isMinimized = state.minimizedPopups.has(popup.id);
          const isActive = state.activePopupId === popup.id;
        
          // Debug log for each popup
          if (state.popups.length > 0) {
            debugLog(`[PopupManic] Rendering popup ${popup.id} (${popup.ui_type}) at position:`, popupPos, 'minimized:', isMinimized);
          }
          
          // Get behavior for this popup
          const behavior = popupBehaviors.get(popup.id) || { id: popup.id, type: 'static', speed: 1, scale: 1, rotation: 0 };
          
          const revealActive = mechanics.activePowerUp?.type === 'reveal-all';
          const revealColor = popup.is_malicious ? '#ef4444' : '#22c55e';
          return state.useModernPopups ? (
            <AnimatedPopup
              key={popup.id}
              behavior={behavior}
              initialX={popupPos.x}
              initialY={popupPos.y}
              width={popup.size?.width || 450}
              height={popup.size?.height || 350}
              cursorPosition={cursorPosition}
              isPaused={state.paused || state.hintModal.active || draggingPopups.has(popup.id)}
              isFrozen={mechanics.activePowerUp?.type === 'freeze'}
              isSlowMo={mechanics.activePowerUp?.type === 'slow-mo'}
              onPositionUpdate={(x, y) => {
                const newPositions = { ...state.popupPositions, [popup.id]: { x, y } };
                setPopupPositions(newPositions);
              }}
              onBehaviorUpdate={(newBehavior) => {
                setPopupBehaviors(prev => new Map(prev).set(popup.id, newBehavior));
              }}
            >
              <div style={{
                border: revealActive ? `4px solid ${revealColor}` : 'none',
                borderRadius: '8px',
                boxShadow: revealActive ? `0 0 20px ${revealColor}` : 'none',
                transition: 'all 0.3s ease'
              }}>
                <ModernPopupIntegration
                  popup={popup}
                  onInteraction={(action) => {
                    handlePopupInteraction(popup, action);
                  }}
                  position={{ x: 0, y: 0 }}
                  onPositionChange={state.hintModal.active ? undefined : (newPosition) => {
                    const newPositions = { ...state.popupPositions, [popup.id]: newPosition } as Record<string, { x: number; y: number }>;
                    setPopupPositions(newPositions);
                  }}
                  onDragStart={() => {
                    // Add popup to dragging set when drag starts
                    setDraggingPopups(prev => new Set(prev).add(popup.id));
                  }}
                  onDragEnd={() => {
                    // Remove popup from dragging set when drag ends
                    setDraggingPopups(prev => {
                      const newSet = new Set(prev);
                      newSet.delete(popup.id);
                      return newSet;
                    });
                  }}
                  onMinimize={state.hintModal.active ? undefined : () => {
                    const newSet = new Set<string>([...Array.from(state.minimizedPopups), popup.id]);
                    setMinimizedPopups(newSet);
                }}
                isMinimized={isMinimized}
                isActive={isActive}
                onClick={() => {
                // Only set active popup if game is active and hint modal is not showing
                if (state.gameActive && !state.hintModal.active && !state.systemCrashed) {
                  setActivePopupId(popup.id);
                }
              }}
              style={{
                zIndex: isActive ? 100 : 50,
                boxShadow: revealActive
                  ? `0 0 0 3px ${revealColor}, 0 0 14px ${revealColor}55`
                  : (isActive ? '0 0 0 2px #ff00ff, 0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.2)'),
                transition: 'box-shadow 0.2s ease, z-index 0.1s'
              }}
            />
              </div>
            </AnimatedPopup>
        ) : (
          <motion.div
            key={popup.id}
            className={`absolute overflow-hidden ${isActive ? 'ring-2 ring-arcade-magenta' : ''}`}
            style={{
              zIndex: isActive ? 100 : 50,
                left: popupPos.x,
                top: popupPos.y,
              width: popup.ui_type === 'system_alert' && popup.is_malicious ? 550 : (popup.size?.width || DEFAULT_POPUP_SIZE.width),
              height: popup.ui_type === 'system_alert' && popup.is_malicious ? 400 : (popup.size?.height || DEFAULT_POPUP_SIZE.height),
              borderRadius: `${popup.style?.borderRadius || 8}px`,
              border: revealActive
                ? `3px solid ${revealColor}`
                : `${popup.style?.borderWidth || 1}px solid ${popup.style?.borderColor || '#ccc'}`,
              boxShadow: revealActive
                ? `0 0 14px ${revealColor}55`
                : (popup.style?.boxShadow || '0 4px 8px rgba(0, 0, 0, 0.2)'),
              backgroundColor: (popup.style as any)?.backgroundColor || popup.style?.bodyColor || '#ffffff',
              color: (popup.style as any)?.color || '#000000',
              fontFamily: popup.ui_type === 'system_alert' && popup.is_malicious ? 'Segoe UI, system-ui, sans-serif' : (popup.style?.fontFamily || 'Arial, sans-serif'),
              fontSize: popup.ui_type === 'system_alert' && popup.is_malicious ? '16px' : (popup.style?.fontSize || '14px')
            }}
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
            drag={popup.closeMethod === 'drag_to_trash' || popup.closeMethod === 'slide_away'}
            onDragEnd={(event, info) => {
            // For slide_away, check if dragged far enough
            if (popup.closeMethod === 'slide_away') {
              const distance = Math.sqrt(Math.pow(info.offset.x, 2) + Math.pow(info.offset.y, 2));
              if (distance > 100) { // Dragged more than 100px
                handlePopupAction(popup, 'close');
              }
            }
            
            // For drag_to_trash, check if near recycle bin
            if (popup.closeMethod === 'drag_to_trash') {
              // Get recycle bin position (assuming it's in a fixed position for now)
              const recycleBinElement = document.querySelector('[alt="Recycle Bin"]');
              if (recycleBinElement && event.target instanceof HTMLElement) {
                const recycleBinRect = recycleBinElement.getBoundingClientRect();
                const popupRect = event.target.getBoundingClientRect();
                
                // Check if popup is dragged near recycle bin
                const distance = Math.sqrt(
                  Math.pow((recycleBinRect.left + recycleBinRect.width/2) - (popupRect.left + popupRect.width/2), 2) +
                  Math.pow((recycleBinRect.top + recycleBinRect.height/2) - (popupRect.top + popupRect.height/2), 2)
                );
                
                if (distance < 100) { // Within 100px of recycle bin
                  handlePopupAction(popup, 'close');
                }
              }
            }
          }}
          onClick={() => {
            // Set this popup as active
            dispatch({ type: 'SET_ACTIVE_POPUP_ID', payload: popup.id });
            
            if (popup.correctAction === 'click') {
              handlePopupAction(popup, 'click')
            } else {
              // Clicking on a popup that should be closed or ignored is a mistake
              handlePopupAction(popup, 'click')
            }
          }}
        >
          {/* Title bar with dynamic styling */}
          <div 
            className="flex justify-between items-center px-2 py-1"
            style={{
              backgroundColor: popup.style.headerColor,
              borderTopLeftRadius: `${popup.style?.borderRadius || 8}px`,
              borderTopRightRadius: `${popup.style?.borderRadius || 8}px`
            }}
          >
            <div className="flex items-center">
              {/* Window controls for Mac style */}
              {popup.style.theme === 'mac' && (
                <div className="flex mr-2">
                  <div className="w-3 h-3 rounded-full bg-red-500 mr-1"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500 mr-1"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
              )}
              
              {/* Logo if present */}
              {popup.elements?.hasLogo && (
                <div className="mr-2">
                  <img 
                    src={popup.elements.logoPath} 
                    alt="Logo" 
                    className="h-5 w-5 object-contain"
                    onError={(e) => {
                      // Fallback for missing logo images
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/img/file-icon.png';
                    }}
                  />
                </div>
              )}
              
              <h3 className="text-sm text-white font-bold truncate">
                {popup.title}
              </h3>
            </div>
            
            {/* Close button with appropriate styling */}
            {((popup.closeMethod === 'click_x') || 
              (popup.closeMethod === 'click_x_after_time' && state.xButtonVisible[popup.id])) && (
              <button 
                className={`text-white rounded px-1.5 py-0.5 text-sm font-bold ${popup.style.theme === 'retro' ? 'border border-gray-700' : 'hover:bg-black/20'}`}
                style={{
                  fontSize: popup.closeMethod === 'click_x_after_time' ? '10px' : '14px'
                }}
                onClick={(e) => {
                  e.stopPropagation()
                  handlePopupAction(popup, 'close')
                }}
              >
                {popup.style.theme === 'mac' ? '×' : popup.style.theme === 'retro' ? 'X' : '✕'}
              </button>
            )}
          </div>
          
          {/* Hint tooltip */}
          <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-black/80 text-white text-xs py-1 px-2 rounded whitespace-nowrap z-50 pointer-events-none">
            {getCloseMethodHint(popup.closeMethod)}
          </div>
          
          {/* Popup content */}
          <div 
            className="p-4 overflow-auto flex-1"
            style={{
              backgroundColor: popup.style.bodyColor,
              color: popup.type === 'malicious' && popup.phishingIndicators?.poorFormatting ? 'red' : 'black'
            }}
          >
            {/* Special handling for video UI type */}
            {popup.ui_type === 'video' ? (
              <div className="flex flex-col items-center">
                {/* Video player with static thumbnail and play button overlay */}
                <div className="w-full h-64 mb-2 rounded overflow-hidden bg-gray-900 relative">
                  {/* Video thumbnail background with gradient pattern */}
                  <div 
                    className="absolute inset-0 bg-gradient-to-br from-blue-900 via-purple-800 to-red-900 opacity-80"
                  >
                    {/* Video thumbnail content */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="text-white text-4xl font-bold opacity-30">
                        {popup.is_malicious ? '⚠️' : '🎬'}
                      </div>
                    </div>
                  </div>
                  
                  {/* Video controls overlay */}
                  <div className="absolute top-2 right-2 flex space-x-1">
                    <div className="bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      HD
                    </div>
                    <div className="bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      CC
                    </div>
                    <div className="bg-black bg-opacity-50 text-white text-xs px-1 rounded">
                      {popup.is_malicious ? 'LIVE' : '1080p'}
                    </div>
                  </div>
                  
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black"></div>
                  
                  {/* Play button */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center hover:bg-opacity-30 cursor-pointer transform transition-transform hover:scale-110">
                      <div className="w-0 h-0 border-t-8 border-t-transparent border-l-16 border-l-white border-b-8 border-b-transparent ml-1"></div>
                    </div>
                  </div>
                  
                  {/* Video info */}
                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <div className="text-white text-sm font-bold truncate">{popup.title}</div>
                    <div className="flex justify-between items-center">
                      <div className="text-gray-300 text-xs">
                        {popup.is_malicious ? 'URGENT: Watch Now!' : `${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`}
                      </div>
                      <div className="text-gray-300 text-xs">
                        {popup.is_malicious ? 'EXPIRES SOON' : `${Math.floor(Math.random() * 10000) + 100} views`}
                      </div>
                    </div>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-700">
                    <div className="h-full bg-red-600" style={{ width: popup.is_malicious ? '95%' : `${Math.floor(Math.random() * 80) + 10}%` }}></div>
                  </div>
                </div>
                
                <p className="text-center text-sm mt-2">{popup.message}</p>
                
                {/* Video player controls */}
                <div className="w-full bg-gray-800 p-3 rounded-b mt-2">
                  {/* Video timeline */}
                  <div className="w-full bg-gray-600 h-1 mb-3 rounded overflow-hidden cursor-pointer">
                    <div className="bg-red-600 h-full" style={{ width: popup.is_malicious ? '95%' : `${Math.floor(Math.random() * 80) + 10}%` }}></div>
                  </div>
                  
                  {/* Video controls bar */}
                  <div className="flex items-center justify-between text-white">
                    <div className="flex items-center space-x-3">
                      {/* Play/pause button */}
                      <button className="hover:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M5 3.5A1.5 1.5 0 0 1 6.5 2h3A1.5 1.5 0 0 1 11 3.5v9a1.5 1.5 0 0 1-1.5 1.5h-3A1.5 1.5 0 0 1 5 12.5v-9z"/>
                        </svg>
                      </button>
                      
                      {/* Volume control */}
                      <button className="hover:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M11.536 14.01A8.473 8.473 0 0 0 14.026 8a8.473 8.473 0 0 0-2.49-6.01l-.708.707A7.476 7.476 0 0 1 13.025 8c0 2.071-.84 3.946-2.197 5.303l.708.707z"/>
                          <path d="M10.121 12.596A6.48 6.48 0 0 0 12.025 8a6.48 6.48 0 0 0-1.904-4.596l-.707.707A5.483 5.483 0 0 1 11.025 8a5.483 5.483 0 0 1-1.61 3.89l.706.706z"/>
                          <path d="M8.707 11.182A4.486 4.486 0 0 0 10.025 8a4.486 4.486 0 0 0-1.318-3.182L8 5.525A3.489 3.489 0 0 1 9.025 8 3.49 3.49 0 0 1 8 10.475l.707.707zM6.717 3.55A.5.5 0 0 1 7 4v8a.5.5 0 0 1-.812.39L3.825 10.5H1.5A.5.5 0 0 1 1 10V6a.5.5 0 0 1 .5-.5h2.325l2.363-1.89a.5.5 0 0 1 .529-.06z"/>
                        </svg>
                      </button>
                      
                      {/* Time display */}
                      <span className="text-xs">
                        {popup.is_malicious ? '0:58 / 1:00' : `${Math.floor(Math.random() * 2)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')} / ${Math.floor(Math.random() * 5) + 1}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-3">
                      {/* Settings */}
                      <button className="hover:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
                          <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 1.255.52l.292-.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
                        </svg>
                      </button>
                      
                      {/* Fullscreen */}
                      <button className="hover:text-gray-300 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 16 16">
                          <path d="M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z"/>
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex space-x-4 mt-4 w-full justify-between">
                  <button 
                    className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 flex-1 transition-colors shadow-md"
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle cancel button click - this is usually the safe option
                      handlePopupInteraction(popup, 'CLOSE_LEGITIMATE_NATIVE');
                    }}
                  >
                    {popup.title.includes('Flash Player') ? 'Cancel' : 'Skip Video'}
                  </button>
                  <button 
                    className={`px-4 py-2 ${popup.is_malicious ? 'bg-red-600 hover:bg-red-500' : 'bg-blue-600 hover:bg-blue-500'} text-white rounded flex-1 transition-colors shadow-md flex items-center justify-center`}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle continue button click - this is usually the unsafe option for malicious popups
                      if (popup.is_malicious) {
                        handlePopupInteraction(popup, 'CLICK_MALICIOUS_BUTTON');
                      } else {
                        handlePopupInteraction(popup, 'CLICK_LEGITIMATE_BUTTON');
                      }
                    }}
                  >
                    {popup.title.includes('Flash Player') ? 'Update Now' : popup.is_malicious ? 'Watch Now' : 'Continue'}
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            ) : (
              /* Regular message content */
              <p className="mb-4">{popup.message}</p>
            )}
            
            {/* Suspicious URL indicator */}
            {popup.type === 'malicious' && popup.phishingIndicators?.suspiciousURL && (
              <div className="text-xs text-gray-600 mb-2 overflow-hidden text-ellipsis">
                {`https://${popup.title.toLowerCase().replace(/\s+/g, '')}.${Math.random().toString(36).substring(2, 7)}.com/secure`}
              </div>
            )}
            
            {/* Message content */}
            <p className="mb-4" style={{ 
              lineHeight: popup.type === 'malicious' && popup.phishingIndicators?.poorFormatting ? '1.8' : '1.5',
              letterSpacing: popup.type === 'malicious' && popup.phishingIndicators?.poorFormatting ? '0.5px' : 'normal'
            }}>
              {popup.message}
            </p>
            
            {/* Input field if present */}
            {popup.elements?.hasInputField && (
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">{popup.elements.inputFieldLabel}</label>
                <input 
                  type={popup.elements.inputFieldLabel?.toLowerCase().includes('password') ? 'password' : 'text'}
                  className="w-full p-2 border rounded"
                  placeholder={`Enter your ${popup.elements.inputFieldLabel}`}
                  onClick={(e) => e.stopPropagation()}
                />
              </div>
            )}
            
            {/* Attachment if present */}
            {popup.elements?.hasAttachment && (
              <div className="mb-4 p-2 border rounded bg-gray-100 flex items-center">
                <div className="mr-2">
                  <img 
                    src={popup.elements.attachmentName?.endsWith('.pdf') ? '/img/pdf-icon.png' : 
                         popup.elements.attachmentName?.endsWith('.exe') || 
                         popup.elements.attachmentName?.endsWith('.bat') || 
                         popup.elements.attachmentName?.endsWith('.scr') ? '/img/exe-icon.png' : 
                         popup.elements.attachmentName?.endsWith('.zip') ? '/img/zip-icon.png' : 
                         popup.elements.attachmentName?.endsWith('.docx') ? '/img/doc-icon.png' : 
                         '/img/file-icon.png'} 
                    alt="Attachment" 
                    className="h-5 w-5 object-contain"
                  />
                </div>
                <span className="text-sm text-blue-600 underline cursor-pointer">
                  {popup.elements.attachmentName}
                </span>
              </div>
            )}
            {/* Puzzle component for solve_puzzle close method */}
            {popup.closeMethod === 'solve_puzzle' && !state.puzzleSolved[popup.id] && (
              <div className="mb-4 p-3 border rounded bg-gray-100">
                <h4 className="text-sm font-medium mb-2">Complete the puzzle to continue:</h4>
                <div className="flex flex-wrap justify-center gap-2 mb-2">
                  {/* Simple puzzle - match the pattern */}
                  {Array.from({ length: 9 }).map((_, i) => {
                    const isTarget = [0, 2, 4, 6, 8].includes(i); // Diagonal pattern
                    return (
                      <div 
                        key={i}
                        className={`w-8 h-8 border rounded cursor-pointer flex items-center justify-center
                          ${state.puzzleSolved[`${popup.id}-${i}`] ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTarget) {
                            // Mark this cell as solved
                            dispatch({ type: 'SET_PUZZLE_SOLVED', payload: { id: `${popup.id}-${i}`, solved: true } });
                             
                            // Check if all target cells are solved
                            const allSolved = [0, 2, 4, 6, 8].every(idx => 
                              state.puzzleSolved[`${popup.id}-${idx}`]);
                             
                            if (allSolved) {
                              dispatch({ type: 'SET_PUZZLE_SOLVED', payload: { id: popup.id, solved: true } });
                              // Allow popup to be closed now
                            }
                          } else {
                            // Wrong cell - reset puzzle
                            [0, 2, 4, 6, 8].forEach(idx => {
                              dispatch({ type: 'SET_PUZZLE_SOLVED', payload: { id: `${popup.id}-${idx}`, solved: false } });
                            });
                          }
                        }}
                      >
                        {state.puzzleSolved[`${popup.id}-${i}`] ? '✓' : ''}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-gray-500">
                  {state.puzzleSolved[popup.id] ? 'Puzzle completed! You can now close this popup.' : 'Click the correct pattern to continue'}
                </p>
              </div>
            )}
            
            {/* IoC detection for click_all_iocs close method */}
            {popup.closeMethod === 'click_all_iocs' && (
              <div className="mb-4">
                <div className="text-xs bg-yellow-100 border border-yellow-300 p-2 rounded mb-2">
                  Click on all suspicious elements before closing
                </div>
                
                {/* Generate IoCs based on popup content */}
                <div className="relative p-2 border rounded bg-gray-50 mb-2">
                  {/* Suspicious URL */}
                  {popup.type === 'malicious' && (
                    <span 
                      className={`text-blue-600 underline cursor-pointer ${state.clickedIoCs[popup.id]?.includes('url') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addClickedIoC(popup.id, 'url');
                      }}
                    >
                      https://{popup.title.toLowerCase().replace(/\s+/g, '')}.{Math.random().toString(36).substring(2, 5)}.com
                    </span>
                  )}
                  
                  {/* Suspicious attachment */}
                  {popup.elements?.hasAttachment && popup.elements.attachmentName?.includes('.exe') && (
                    <div 
                      className={`flex items-center mt-2 cursor-pointer ${state.clickedIoCs[popup.id]?.includes('attachment') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addClickedIoC(popup.id, 'attachment');
                      }}
                    >
                      <span className="text-sm">📎</span>
                      <span className="ml-1 text-sm text-blue-600 underline">{popup.elements.attachmentName}</span>
                    </div>
                  )}
                  
                  {/* Suspicious sender */}
                  {popup.type === 'malicious' && (
                    <div 
                      className={`mt-2 text-sm ${state.clickedIoCs[popup.id]?.includes('sender') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        addClickedIoC(popup.id, 'sender');
                      }}
                    >
                      <span className="text-gray-600">From: </span>
                      <span className="cursor-pointer">security-alert@{Math.random().toString(36).substring(2, 8)}.net</span>
                    </div>
                  )}
                </div>
                
                {/* Progress indicator */}
                <div className="text-xs text-gray-600">
                  IoCs found: {state.clickedIoCs[popup.id]?.length || 0}/3
                </div>
              </div>
            )}
            
            {/* Action buttons with appropriate styling */}
            <div className="flex justify-end gap-2">
              {/* Standard button */}
              {popup.elements?.hasButton && (
                <button 
                  className="px-4 py-1 rounded text-sm text-white"
                  style={{ 
                    backgroundColor: popup.style.headerColor,
                    boxShadow: popup.style.theme === 'retro' ? '2px 2px 0px black' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    if (popup.correctAction === 'click') {
                      handlePopupAction(popup, 'click')
                    } else {
                      handlePopupAction(popup, 'click') // This is a mistake if it should be closed or ignored
                    }
                  }}
                >
                  {popup.elements.buttonText}
                </button>
              )}
              
              {/* Close button */}
              {popup.closeMethod === 'click_button' && (
                <button 
                  className="px-4 py-1 rounded text-sm text-white"
                  style={{ 
                    backgroundColor: popup.style.theme === 'retro' ? '#808080' : '#6b7280',
                    boxShadow: popup.style.theme === 'retro' ? '2px 2px 0px black' : 'none'
                  }}
                  onClick={(e) => {
                    e.stopPropagation()
                    handlePopupAction(popup, 'close')
                  }}
                >
                  {popup.style.theme === 'mac' ? 'Cancel' : 'Close'}
                </button>
              )}
              
              {/* Antivirus button */}
              {popup.closeMethod === 'run_antivirus' && (
                <div className="w-full mb-4">
                  <div className="bg-red-50 border border-red-200 rounded p-3 mb-3">
                    <div className="flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-500 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div>
                        <h4 className="text-sm font-medium text-red-800">Malware Detected!</h4>
                        <p className="text-xs text-red-600">This popup contains malicious content</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-center">
                    <button 
                      className={`px-4 py-2 rounded text-sm text-white flex items-center font-arcade ${state.activePrograms.includes('meowarebytes') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        // This requires the user to open Nyantivirus
                        if (state.activePrograms.includes('meowarebytes')) {
                          handlePopupAction(popup, 'close')
                        } else {
                          // Hint that they need to use the antivirus
                          playSound(false) // Play error sound
                          alert('You need to run Nyantivirus first!')
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {state.activePrograms.includes('meowarebytes') ? 'Remove Threat' : 'Run Antivirus First'}
                    </button>
                  </div>
                  
                  <div className="text-xs text-center mt-2 text-gray-500">
                    Open Nyantivirus from the desktop or taskbar
                  </div>
                </div>
              )}
              
              {/* Hang up button for phone call popups */}
              {popup.closeMethod === 'hang_up' && (
                <div className="w-full mb-4">
                  <div className="flex justify-center items-center mb-2">
                    <div className="w-16 h-16 rounded-full bg-red-500 flex items-center justify-center shadow-lg">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </div>
                  </div>
                  <div className="text-center">
                    <p className="text-sm mb-1">Incoming call from:</p>
                    <p className="text-sm font-bold mb-2">{popup.type === 'malicious' ? 'Unknown Number' : 'Tech Support'}</p>
                    <button 
                      className="px-6 py-2 rounded-full text-sm text-white bg-red-500 hover:bg-red-600 shadow-md"
                      onClick={(e) => {
                        e.stopPropagation()
                        handlePopupAction(popup, 'close')
                      }}
                    >
                      Hang Up
                    </button>
                  </div>
                </div>
              )}
              {(popup.closeMethod !== 'click_button' && 
                popup.closeMethod !== 'click_x' && 
                popup.closeMethod !== 'click_x_after_time' &&
                popup.closeMethod !== 'run_antivirus' &&
                popup.closeMethod !== 'hang_up' &&
                popup.closeMethod !== 'drag_to_trash' &&
                popup.closeMethod !== 'slide_away') && (
                <button 
                  className="px-4 py-1 rounded text-sm font-sans text-white bg-gray-500 hover:bg-gray-600"
                  onClick={(e) => {
                    e.stopPropagation()
                    // Generic close button that doesn't work for these special types
                    alert('This popup requires a special action to close!')
                  }}
                >
                  Close
                </button>
              )}
            </div>
          </div>
        </motion.div>
      );
      })}
      </div>

      {/* Quiz Modal System */}
      {state.quizActive && state.currentQuiz && state.quizQuestions.length > 0 && state.currentQuestionIndex < 5 && state.quizAnswers.length < 5 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-[10000]">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-cyan p-8 rounded-lg max-w-4xl w-full mx-4 shadow-lg shadow-arcade-cyan/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Quiz Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-arcade-cyan font-mono text-lg glow-heading-cyan">Security Quiz - Level {state.currentQuiz.level}</h2>
              <div className="text-arcade-cyan font-mono text-sm">
                Question {Math.min(state.currentQuestionIndex + 1, 5)} / 5
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
              <div 
                className="bg-arcade-cyan h-2 rounded-full transition-all duration-300"
                style={{ width: `${((state.currentQuestionIndex + 1) / state.quizQuestions.length) * 100}%` }}
              ></div>
            </div>
            
            {/* Current Question */}
            {state.quizQuestions[state.currentQuestionIndex] && (
              <div className="bg-gray-800 p-6 rounded-lg mb-6">
                {/* Question Text */}
                <h3 className="text-arcade-magenta font-mono text-lg mb-4">
                  {state.quizQuestions[state.currentQuestionIndex].question}
                </h3>
                
                {/* Popup Preview for Context */}
                <div className="bg-gray-700 p-4 rounded-lg mb-6 border border-arcade-cyan/30">
                  <div className="text-arcade-cyan font-mono text-sm mb-2">Popup Context:</div>
                  <div className="bg-white text-black p-3 rounded border-2 border-gray-400 max-w-md">
                    <div className="font-mono font-semibold text-sm mb-2">
                      {state.quizQuestions[state.currentQuestionIndex].popup.title}
                    </div>
                    <div className="font-mono text-xs">
                      {state.quizQuestions[state.currentQuestionIndex].popup.message}
                    </div>
                  </div>
                </div>
                
                {/* Answer Feedback */}
                {state.showAnswerFeedback && (
                  <div className={`p-4 rounded-lg mb-4 border-2 ${
                    state.showAnswerFeedback.isCorrect 
                      ? 'bg-green-900/50 border-green-400 text-green-300' 
                      : 'bg-red-900/50 border-red-400 text-red-300'
                  }`}>
                    <div className="font-mono text-sm mb-2">
                      {state.showAnswerFeedback.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                    {!state.showAnswerFeedback.isCorrect && (
                      <div className="font-mono text-xs">
                        Correct answer: {state.showAnswerFeedback.correctAnswer}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Question Format: Multiple Choice */}
                {state.quizQuestions[state.currentQuestionIndex].format === 'multiple_choice' && !state.showAnswerFeedback && (
                  <div className="space-y-3">
                    {state.quizQuestions[state.currentQuestionIndex].options.map((option: string, index: number) => (
                      <button
                        key={index}
                        onClick={() => handleQuizAnswer(option)}
                        className="w-full text-left p-4 bg-gray-700 hover:bg-arcade-cyan/20 border border-arcade-cyan/30 rounded-lg transition-colors font-mono text-white"
                      >
                        <span className="text-arcade-cyan mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </button>
                    ))}
                  </div>
                )}
                
                {/* Question Format: Interactive Buttons (Correct Action) */}
                {state.quizQuestions[state.currentQuestionIndex].format === 'interactive_buttons' && !state.showAnswerFeedback && (
                  <div className="space-y-3">
                    <div className="text-arcade-cyan font-mono text-sm mb-4">
                      Click the correct action button:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {state.quizQuestions[state.currentQuestionIndex].options.map((action: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(action)}
                          className="p-4 bg-arcade-magenta text-black hover:bg-arcade-cyan transition-colors rounded-lg font-mono text-sm"
                        >
                          {action.replace(/_/g, ' ')}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Question Format: Drag and Drop (Categorization) */}
                {state.quizQuestions[state.currentQuestionIndex].format === 'drag_drop' && !state.showAnswerFeedback && (
                  <div className="space-y-4">
                    <div className="text-arcade-cyan font-mono text-sm mb-4">
                      Select the correct category for this popup:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {state.quizQuestions[state.currentQuestionIndex].options.map((category: string, index: number) => (
                        <button
                          key={index}
                          onClick={() => handleQuizAnswer(category)}
                          className="p-4 bg-gray-700 hover:bg-arcade-green/20 border-2 border-arcade-green/30 rounded-lg transition-colors text-center"
                        >
                          <div className="text-arcade-green font-mono text-sm mb-1">
                            {category.replace(/_/g, ' ').toUpperCase()}
                          </div>
                          <div className="text-gray-300 font-mono text-xs">
                            Click to select
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
            
            {/* Quiz Stats */}
            <div className="flex justify-between items-center text-arcade-cyan font-mono text-sm">
              <div>
                Correct: {state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length} / 5
              </div>
              <div>
                Mistakes: {state.quizAnswers.filter((a: { isCorrect: boolean }) => !a.isCorrect).length} / 5
              </div>
              <div>
                Quiz Score: {state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length * 10} points
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Virus Outbreak Hint Popup - Show while infection countdown is active */}
      {infectionEndsAt && nowTs < infectionEndsAt && (
        <VirusOutbreakHint onOpenNyantivirus={clearVirusOutbreak} />
      )}
      
      {/* Windows-Style Virus Notification */}
      {state.infectedGifs.length > 0 && (
        <div className="fixed bottom-4 right-4 z-[13000] w-80 bg-gray-800 border border-gray-600 shadow-2xl rounded-lg overflow-hidden animate-slide-in-right ring-4 ring-arcade-cyan">
          {/* Notification Header */}
          <div className="bg-gray-900 text-white px-4 py-2 flex items-center border-b border-gray-700">
            <div className="w-4 h-4 bg-blue-500 rounded-full mr-2 flex items-center justify-center">
              <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <span className="font-semibold text-sm">Windows Security Alert</span>
            <button 
              className="ml-auto text-gray-400 hover:text-white hover:bg-gray-700 w-6 h-6 rounded flex items-center justify-center text-xs transition-colors"
              onClick={() => setInfectedGifs([])}
            >
              ×
            </button>
          </div>
          
          {/* Notification Content */}
          <div className="p-4 bg-gray-800">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-red-900 bg-opacity-50 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-white text-sm mb-1">
                  Virus Outbreak Detected!
                </h3>
                <p className="text-gray-300 text-xs mb-3">
                  Multiple malicious files have infected your system. Immediate action required to prevent data loss.
                </p>
                <div className="flex space-x-2">
                  <button 
                    className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black px-3 py-1 rounded text-xs font-medium flex items-center transition-colors ring-4 ring-arcade-cyan animate-pulse shadow-[0_0_20px_#00FFFF80]"
                    onClick={clearVirusOutbreak}
                  >
                    <img src="/img/meowareBytes-taskbar.png" alt="" className="w-3 h-3 mr-1" />
                    Run Nyantivirus
                  </button>
                  <button 
                    className="bg-gray-600 hover:bg-gray-500 text-gray-200 px-3 py-1 rounded text-xs transition-colors"
                    onClick={() => setInfectedGifs([])}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar animation */}
          <div className="h-1 bg-gray-700">
            <div className="h-full bg-red-600 animate-pulse" style={{ width: '100%' }}></div>
          </div>
        </div>
      )}

      {/* Virus Warning Overlay */}
      {state.showVirusWarning && (
        <div 
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{
            background: 'rgba(255, 0, 0, 0.7)',
            animation: 'glitch 0.2s infinite',
            textShadow: '0 0 10px #fff, 0 0 20px #ff0000, 0 0 30px #ff0000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontFamily: 'Arial, sans-serif',
            fontSize: '3rem',
            fontWeight: 'bold',
            color: 'white',
            textAlign: 'center',
            padding: '20px',
            transform: `translate(${Math.random() * 10 - 5}px, ${Math.random() * 10 - 5}px)`,
            clipPath: `polygon(0% 0%, 100% 0%, 100% 100%, 0% 100%)`,
          }}
        >
          <div 
            style={{
              animation: 'glitch-text 0.1s infinite',
              transform: `rotate(${Math.random() * 4 - 2}deg)`,
            }}
          >
            WARNING: VIRUS DETECTED!
          </div>
          <style jsx global>{`
            @keyframes glitch {
              0% { filter: hue-rotate(0deg) brightness(1.5); }
              20% { filter: hue-rotate(90deg) brightness(1.7); }
              40% { filter: hue-rotate(180deg) brightness(1.3); }
              60% { filter: hue-rotate(270deg) brightness(1.6); }
              80% { filter: hue-rotate(0deg) brightness(1.4); }
              100% { filter: hue-rotate(360deg) brightness(1.5); }
            }
            @keyframes glitch-text {
              0% { text-shadow: 5px 0 red, -5px 0 cyan; }
              25% { text-shadow: -5px 0 red, 5px 0 cyan; }
              50% { text-shadow: 5px 0 red, -5px 0 cyan; }
              75% { text-shadow: -5px 0 red, 5px 0 cyan; }
              100% { text-shadow: 5px 0 red, -5px 0 cyan; }
            }
          `}</style>
        </div>
      )}
      
      {/* Quiz Result Modal (derived from state) */}
      {(state.quizActive === false && state.quizAnswers && state.quizAnswers.length > 0 && state.currentQuestionIndex >= state.quizQuestions.length) && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
          onClick={() => {
            // Dismiss summary: resume game and clear answers
            setPaused(false);
            dispatch({ type: 'SET_QUIZ_ANSWERS', payload: [] });
          }}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border-2 border-arcade-cyan rounded-lg p-8 max-w-md w-full mx-4 text-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pass/Fail Header */}
            {(() => {
              const correct = state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
              const total = state.quizAnswers.length;
              const passed = total > 0 ? (correct / total) >= 0.7 : false;
              return (
                <div className={`text-4xl font-mono mb-4 ${passed ? 'text-green-400' : 'text-red-400'}`}>
                  {passed ? '✓ PASSED!' : '✗ FAILED'}
                </div>
              );
            })()}
            
            {/* Score Display */}
            <div className="text-arcade-cyan font-mono text-xl mb-4">
              {(() => {
                const correct = state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
                const total = state.quizAnswers.length;
                const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
                return `${percentage}% (${correct}/${total})`;
              })()}
            </div>
            
            {/* Pass/Fail Message */}
            {(() => {
              const correct = state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
              const total = state.quizAnswers.length;
              const passed = total > 0 ? (correct / total) >= 0.7 : false;
              return (
                <div className="text-white font-mono text-sm mb-6">
                  {passed ? (
                    <div>
                      <div className="text-green-300 mb-2">Excellent work!</div>
                      <div>You've demonstrated strong cybersecurity awareness. You can now advance to the next level and face more challenging threats!</div>
                    </div>
                  ) : (
                    <div>
                      <div className="text-red-300 mb-2">Keep Learning!</div>
                      <div>You need 70% or higher to advance. Don't worry - every security expert started somewhere. Review the popups you've encountered and try again!</div>
                    </div>
                  )}
                </div>
              );
            })()}
            
            {/* Motivational Message */}
            <div className="text-arcade-magenta font-mono text-xs mb-4">
              {(() => {
                const correct = state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
                const total = state.quizAnswers.length;
                const passed = total > 0 ? (correct / total) >= 0.7 : false;
                return passed
                  ? "Ready for the next challenge? Let's keep building your cyber defenses!"
                  : "Remember: Real cybersecurity threats are everywhere. Practice makes perfect!";
              })()}
            </div>
            
            {/* Score Breakdown */}
            <div className="bg-gray-800 p-4 rounded-lg font-mono text-xs mb-4">
              <div className="text-arcade-cyan mb-2">Quiz Results:</div>
              {(() => {
                const correct = state.quizAnswers.filter((a: { isCorrect: boolean }) => a.isCorrect).length;
                const total = state.quizAnswers.length;
                const score = correct * 10;
                return (
                  <>
                    <div className="text-green-400">Correct: {correct}</div>
                    <div className="text-red-400">Incorrect: {total - correct}</div>
                    <div className="text-arcade-cyan">Score: {score} points</div>
                  </>
                );
              })()}
            </div>
            
            {/* Click to continue instruction */}
            <div className="text-gray-400 font-mono text-xs animate-pulse">
              Click anywhere to continue
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Infected GIFs Overlay - Virus Outbreak */}
      {state.infectedGifs.map((gif: any) => (
        <div
          key={gif.id}
          className="fixed pointer-events-none z-[60]"
          style={{
            left: gif.x,
            top: gif.y,
            width: (gif.size || 60) * 5, // 5x scale outbreak GIFs
            height: (gif.size || 60) * 5,
            display: 'none' // Start hidden, show only when image loads successfully
          }}
        >
          <img
            src={gif.gifName ? `/silly-gif/${gif.gifName}` : '/silly-gif/silly-gif (1).gif'}
            alt=""
            className="w-full h-full object-contain"
            style={{
              filter: 'drop-shadow(0 0 15px rgba(255, 0, 0, 0.7))',
              transform: 'scale(1)', // Ensure no additional scaling
            }}
            onError={(e) => {
              // Hide the entire container for broken images
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) {
                container.style.display = 'none';
              }
            }}
            onLoad={(e) => {
              // Show the container only when image loads successfully
              const container = (e.target as HTMLImageElement).parentElement;
              if (container) {
                container.style.display = 'block';
              }
            }}
          />
        </div>
      ))}





      {/* Educational Hint Modal */}
      {state.hintModal.active && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-[8999]">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-cyan p-6 rounded-lg max-w-2xl w-full mx-4 shadow-lg shadow-arcade-cyan/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-arcade-cyan font-arcade text-xl glow-heading-cyan">Security Learning</h2>
              <div className="text-arcade-cyan font-arcade text-sm">
                {state.hintModal.currentSlide + 1} / 4
              </div>
            </div>
            
            <div className="bg-gray-800 p-4 rounded-lg mb-6 min-h-[200px] max-h-[300px] overflow-y-auto">
              {state.hintModal.currentSlide === 0 && (
                <div>
                  <h3 className="text-arcade-magenta font-arcade text-lg mb-3">Why This Popup is {state.hintModal.popup?.is_malicious ? 'Malicious' : 'Safe'}</h3>
                  <p className="text-gray-300 font-terminal text-base leading-relaxed">
                    {state.hintModal.popup?.explanation?.why_this_popup_is_X_type || 'This popup requires careful evaluation to determine its legitimacy.'}
                  </p>
                </div>
              )}
              
              {state.hintModal.currentSlide === 1 && (
                <div>
                  <h3 className="text-arcade-magenta font-arcade text-lg mb-3">What to Look For</h3>
                  <ul className="text-gray-300 font-terminal text-base space-y-2">
                    {(state.hintModal.popup?.explanation?.what_to_look_for || []).map((item: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-arcade-cyan mr-2">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {state.hintModal.currentSlide === 2 && (
                <div>
                  <h3 className="text-arcade-magenta font-arcade text-lg mb-3">Real-World Impact</h3>
                  <p className="text-gray-300 font-terminal text-base leading-relaxed">
                    {state.hintModal.popup?.explanation?.real_world_impact || 'Understanding the consequences helps you make better security decisions.'}
                  </p>
                </div>
              )}
              
              {state.hintModal.currentSlide === 3 && (
                <div>
                  <h3 className="text-arcade-magenta font-arcade text-lg mb-3">Prevention Tips</h3>
                  <ul className="text-gray-300 font-terminal text-base space-y-2">
                    {(state.hintModal.popup?.explanation?.prevention_tips || []).map((tip: string, index: number) => (
                      <li key={index} className="flex items-start">
                        <span className="text-arcade-green mr-2">✓</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="flex justify-between">
              <button
                onClick={() => {
                  if (state.hintModal.currentSlide > 0) {
                    dispatch({ type: 'SET_HINT_MODAL', payload: { ...state.hintModal, currentSlide: state.hintModal.currentSlide - 1 } });
                  }
                }}
                disabled={state.hintModal.currentSlide === 0}
                className={`px-4 py-2 rounded font-arcade text-sm transition-colors ${
                  state.hintModal.currentSlide === 0 
                    ? 'bg-gray-600 text-gray-400 cursor-not-allowed' 
                    : 'bg-arcade-cyan text-black hover:bg-arcade-magenta hover:text-white'
                }`}
              >
                ← Previous
              </button>
              
              {state.hintModal.currentSlide < 3 ? (
                <button
                  onClick={() => {
                    dispatch({ type: 'SET_HINT_MODAL', payload: { ...state.hintModal, currentSlide: state.hintModal.currentSlide + 1 } });
                  }}
                  className="px-4 py-2 bg-arcade-cyan text-black rounded font-arcade text-sm hover:bg-arcade-magenta hover:text-white transition-colors"
                >
                  Next →
                </button>
              ) : (
                <button
                  onClick={() => {
                    // Close modal and remove the popup
                    if (state.hintModal.popup) removePopup(state.hintModal.popup.id);
                    dispatch({ type: 'SET_HINT_MODAL', payload: { active: false, popup: null, slide: 1, currentSlide: 0 } });
                  }}
                  className="px-4 py-2 bg-arcade-green text-black rounded font-arcade text-sm hover:bg-green-600 hover:text-white transition-colors"
                >
                  Close
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}

      {/* NEW GAME MECHANICS UI */}
      {/* Game HUD */}
      {state.gameActive && !state.systemCrashed && (
        <GameHUD 
          mechanics={mechanics}
          onPowerUpActivate={(powerUp) => {
            if (powerUp.type === 'auto-report') {
              // One-shot: automatically close one malicious popup (scores as correct)
              const target = state.popups.find(p => (p as any).is_malicious || p.type === 'malicious')
              if (target) {
                try {
                  handlePopupInteraction(target as any, 'close')
                } catch {
                  // fallback to legacy handler
                  handlePopupAction(target as any, 'close')
                }
              }
              setMechanics(prev => ({
                ...prev,
                activePowerUp: null,
                powerUps: prev.powerUps.filter(p => p.id !== powerUp.id),
              }))
              return
            }

            // Timed power-ups (freeze, slow-mo, reveal-all)
            setMechanics(prev => ({
              ...prev,
              activePowerUp: powerUp,
              powerUps: prev.powerUps.map(p => p.id === powerUp.id ? { ...p, active: true } : p),
            }))

            if (powerUp.duration > 0) {
              setTimeout(() => {
                setMechanics(prev => ({
                  ...prev,
                  activePowerUp: null,
                  powerUps: prev.powerUps.filter(p => p.id !== powerUp.id),
                }))
              }, powerUp.duration * 1000)
            }
          }}
        />
      )}

      {/* Trap GIFs */}
      {trapGIFs.map(trap => (
        <TrapGIF
          key={trap.id}
          x={trap.x}
          y={trap.y}
          onClick={() => handleTrapClick(trap.id)}
        />
      ))}

      {/* Infected GIFs (from public/silly-gif) */}
      {sillyGifs.map(g => (
        <InfectedGIF key={g.id} x={g.x} y={g.y} url={g.url} size={g.size} onClick={() => handleInfectedGifClick(g.id)} />
      ))}

      {/* Score Popups */}
      <AnimatePresence>
        {scorePopups.map(score => (
          <ScorePopup
            key={score.id}
            x={score.x}
            y={score.y}
            value={score.value}
            isCombo={score.isCombo}
          />
        ))}
      </AnimatePresence>

      {/* Badge Notification */}
      <AnimatePresence>
        {showBadge && <BadgeNotification badge={showBadge} />}
      </AnimatePresence>

      {/* Difficulty Up Notification */}
      <AnimatePresence>
        {showDifficultyUp && <DifficultyUpNotification level={showDifficultyUp} />}
      </AnimatePresence>

      {/* Infection Overlay */}
      <AnimatePresence>
        {showInfection && <InfectionOverlay />}
      </AnimatePresence>

      {/* Power-Up Effects */}
      <AnimatePresence>
        {mechanics.activePowerUp?.type === 'freeze' && <FreezeEffect />}
        {mechanics.activePowerUp?.type === 'slow-mo' && <SlowMotionEffect />}
      </AnimatePresence>

      {/* Infection countdown bar with warning (shows during full-system infection) */}
      {infectionEndsAt && nowTs < infectionEndsAt && (
        <div className="fixed top-0 left-0 right-0 z-[10000] flex items-center justify-center pointer-events-none">
          <div className="bg-black/95 border-4 border-red-500 rounded-b-2xl shadow-2xl px-8 py-6 flex items-center gap-6 max-w-5xl w-full mx-4">
            <img src="/silly-gif/theoffic-staycalm.gif" alt="Stay Calm" className="h-20 w-auto rounded hidden sm:block" />
            <div className="text-white font-terminal flex-1">
              <div className="text-2xl font-bold mb-3">
                <strong className="text-red-500">⚠️ SYSTEM INFECTION DETECTED!</strong>
              </div>
              <div className="text-lg mb-4">
                Quarantine the threat before your system crashes!
              </div>
              <div className="h-8 bg-gray-800 rounded-lg overflow-hidden border-2 border-red-500">
                <div 
                  className="h-full bg-gradient-to-r from-red-600 via-orange-500 to-red-600 transition-all duration-100" 
                  style={{ width: `${Math.max(0, ((infectionEndsAt - nowTs) / 20000) * 100)}%` }} 
                />
              </div>
              <div className="text-right text-sm mt-2 text-red-400 font-bold">
                {Math.ceil((infectionEndsAt - nowTs) / 1000)}s remaining
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Game Summary Modal */}
      {showGameSummary && (
        <GameSummaryModal
          isOpen={showGameSummary}
          onClose={() => setShowGameSummary(false)}
          onPlayAgain={handlePlayAgain}
          onNextGame={() => {
            // Navigate to phish404 game
            window.location.href = '/games/phish404'
          }}
          onBackToHome={() => {
            window.location.href = '/'
          }}
          summary={calculateGameSummary(mechanics)}
        />
      )}

      {/* Old Game Over Modal removed - using Game Summary Modal instead */}
      </div>
    </>
  );
}
