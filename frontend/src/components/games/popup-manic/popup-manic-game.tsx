"use client"

import React, { useState, useEffect, useRef, useReducer, use } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { Fish, LogIn, User, Settings, Info } from "lucide-react"
import { AboutUsModal } from "../../modals/about-us-modal"
import { GameOverModal } from "../../modals/game-over-modal"
import axios from 'axios'
import { v4 as uuidv4 } from 'uuid'
import { DraggableWindow } from './draggable-window'
import ModernPopupIntegration from './modern-popup-integration';

// Default dimensions for legacy popups
const DEFAULT_POPUP_SIZE = { width: 400, height: 300 };

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
    console.log(`[POPUP CONSTRUCTOR] Creating popup with ID:`, generatedId, 'from data.id:', data.id);
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
    console.log('Fetching popup from:', url);
    
    // Add timeout to avoid long waiting periods
    const response = await axios.get(url, { timeout: 5000 });
    
    // Validate the response data
    if (response.data && response.data.success && response.data.data) {
      console.log('Successfully fetched popup from API:', response.data.data);
      return response.data.data;
    } else {
      console.warn('API response missing expected data structure:', response.data);
      throw new Error('Invalid API response format');
    }
  } catch (error: any) {
    // Provide more detailed error information
    if (error.code === 'ECONNREFUSED' || error.code === 'ERR_NETWORK') {
      console.error('Cannot connect to backend server. Make sure it is running at:', 
        process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000');
    } else if (error.response) {
      // The request was made and the server responded with a status code outside of 2xx range
      console.error('API error response:', error.response.status, error.response.data);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received from API. Backend server might be down.');
    } else {
      // Something happened in setting up the request
      console.error('Error setting up request:', error.message);
    }
    
    // Return mock popup data if API call fails
    console.log('Using mock popup data instead');
    const mockPopup = getMockPopup(type as 'malicious' | 'benign' | 'neutral');
    console.log('Generated mock popup:', mockPopup);
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
};

type GameAction =
  | { type: 'SET_SCORE'; payload: number }
  | { type: 'SET_LEVEL'; payload: number }
  | { type: 'SET_GAME_ACTIVE'; payload: boolean }
  | { type: 'SET_GAME_OVER'; payload: boolean }
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
    case 'SET_POPUPS':
      return { ...state, popups: action.payload };
    case 'ADD_POPUP':
      console.log('[REDUCER] Adding popup to state:', action.payload.id);
      return { ...state, popups: [...state.popups, action.payload] };
    case 'REMOVE_POPUP':
      console.log('[REDUCER] Removing popup from state:', action.payload);
      return { 
        ...state, 
        popups: state.popups.filter(popup => popup.id !== action.payload) 
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
    case 'SET_MISTAKES':
      return { ...state, mistakes: action.payload };
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
    case 'ADD_POPUP':
      console.log('[PopupManic] Adding popup to state:', action.payload.id);
      return {
        ...state,
        popups: [...state.popups, action.payload]
      };
    case 'REMOVE_POPUP':
      console.log('[PopupManic] Removing popup from state:', action.payload);
      return {
        ...state,
        popups: state.popups.filter(popup => popup.id !== action.payload)
      };
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
  quizScore: 0
});

// Action creators for type safety
const setScore = (score: number) => dispatch({ type: 'SET_SCORE', payload: score });
const setLevel = (level: number) => dispatch({ type: 'SET_LEVEL', payload: level });
const setGameActive = (active: boolean) => dispatch({ type: 'SET_GAME_ACTIVE', payload: active });
const setGameOver = (over: boolean) => dispatch({ type: 'SET_GAME_OVER', payload: over });
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
  // Play different sounds based on popup type
  if (popup.ui_type === 'chat_message' && systemAlertSound2Ref.current) {
    // Play chat message sound
    systemAlertSound2Ref.current.currentTime = 0;
    systemAlertSound2Ref.current.play().catch(err => console.error('Error playing chat sound:', err));
  } else if ((popup.ui_type === 'system_alert' || popup.ui_type === 'browser_notification') && systemAlertSound1Ref.current) {
    // Play system alert sound
    systemAlertSound1Ref.current.currentTime = 0;
    systemAlertSound1Ref.current.play().catch(err => console.error('Error playing alert sound:', err));
  } else if (notificationSoundRef.current) {
    // Default notification sound for other types
    notificationSoundRef.current.currentTime = 0;
    notificationSoundRef.current.play().catch(err => console.error('Error playing notification sound:', err));
  }
  dispatch({ type: 'ADD_POPUP', payload: popup });
};
const removePopup = (id: string) =>
  dispatch({ type: 'REMOVE_POPUP', payload: id });

// Note: removePopupById helper exists later in the file and operates on a popup object.

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

  // Virus outbreak alert sound
  virusAlertSoundRef.current = new Audio('/sounds/alert-369027.mp3');
  virusAlertSoundRef.current.volume = 0.6;
  virusAlertSoundRef.current.loop = true; // Loop during outbreak

  // Virus outbreak siren sound
  virusSirenSoundRef.current = new Audio('/sounds/siren-alert-96052.mp3');
  virusSirenSoundRef.current.volume = 0.5;
  virusSirenSoundRef.current.loop = true; // Loop during outbreak

  // Cheerful sound for clearing virus outbreak
  cheerfulSoundRef.current = new Audio('/sounds/cartoon-sfx-cheerful-wow-wah-cute-adorable-surprised-338343.mp3');
  cheerfulSoundRef.current.volume = 0.7;

  console.log('All audio elements initialized with specific sounds including virus outbreak sounds');
}, [])

// ...
  const [updatingSoftware, setUpdatingSoftware] = useState(false)
  const [softwareUpdateProgress, setSoftwareUpdateProgress] = useState<{[key: string]: number}>({
    'Firecat Browser': 0,
    'Nyantivirus': 0,
    'Windows Security': 0
  })
  
  // Firecat browser state
  const [firecatOpen, setFirecatOpen] = useState(false)
  const [firecatUrl, setFirecatUrl] = useState('https://www.meowgle.com')
  const [browserHistory, setBrowserHistory] = useState<string[]>(['https://www.meowgle.com'])
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState(0)
  
  // Task Manager state
  const [taskManagerOpen, setTaskManagerOpen] = useState(false)
  const [taskManagerTab, setTaskManagerTab] = useState<'processes' | 'performance'>('processes')
  const [systemResources, setSystemResources] = useState({
    cpu: 30,
    memory: 45,
    disk: 20,
    network: 15
  })
  const [malwareDetected, setMalwareDetected] = useState(false)
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [updateWindowOpen, setUpdateWindowOpen] = useState(false)
  const [wifiMenuOpen, setWifiMenuOpen] = useState(false)
  const [wifiStatus, setWifiStatus] = useState<'connected' | 'poor' | 'disconnected'>('connected')
  
  // Tutorial system removed - now using educational modal system
  const [seenPopupCategories, setSeenPopupCategories] = useState<Set<string>>(new Set())
  
  // Track popup interactions to prevent spam clicking
  const [interactedPopups, setInteractedPopups] = useState<Set<string>>(new Set())
  
  // Quiz system state
  const [encounteredPopups, setEncounteredPopups] = useState<Popup[]>([])
  const [quizActive, setQuizActive] = useState<boolean>(false)
  const [quizQuestions, setQuizQuestions] = useState<any[]>([])
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0)
  const [currentQuiz, setCurrentQuiz] = useState<any>(null)
  const [quizAnswers, setQuizAnswers] = useState<any[]>([])
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
    console.log('Using mock session:', mockSession)
  }, [])

  // Random virus outbreak system
  useEffect(() => {
    if (!state.gameActive || state.gameOver || state.systemCrashed) {
      return;
    }

    // Schedule random virus outbreak between 50-120 seconds
    const scheduleVirusOutbreak = () => {
      const randomDelay = Math.random() * (120000 - 50000) + 50000; // 50-120 seconds in milliseconds
      console.log(`[VirusOutbreak] Next outbreak scheduled in ${Math.round(randomDelay / 1000)} seconds`);
      
      return setTimeout(() => {
        triggerRandomVirusOutbreak();
        // Schedule the next outbreak
        const nextTimer = scheduleVirusOutbreak();
        return nextTimer;
      }, randomDelay);
    };

    const virusTimer = scheduleVirusOutbreak();

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

    const spawnInterval = Math.max(1000, 4000 - (state.level * 200)); // Faster spawning at higher levels
    console.log(`[GameLoop] Starting popup spawn timer, interval: ${spawnInterval}ms`);

    const spawnTimer = setInterval(async () => {
      // Don't spawn if too many popups already exist
      if (state.popups.length >= 5) {
        return;
      }

      console.log(`[GameLoop] Spawning new popup, current count: ${state.popups.length}`);
      
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
            console.log(`[GameLoop] Skipping debug popup: ${randomPopup.title}`);
            return; // Skip this popup
          }
          
          // Add the popup to the state using addPopup action
          console.log(`[GameLoop] Adding popup ${randomPopup.id} to state`);
          addPopup(randomPopup);
          setPopupPositions({
            ...state.popupPositions,
            [randomPopup.id]: popupPosition
          });
          
          console.log(`[GameLoop] Spawned popup ${randomPopup.id} at position:`, popupPosition);
        } else {
          // Fallback to generating a random popup if API fails
          const fallbackPopup = generateFallbackPopup();
          const popupPosition = generateRandomPosition(fallbackPopup.ui_type);
          
          console.log(`[GameLoop] Adding fallback popup ${fallbackPopup.id} to state`);
          addPopup(fallbackPopup);
          setPopupPositions({
            ...state.popupPositions,
            [fallbackPopup.id]: popupPosition
          });
          
          console.log(`[GameLoop] Spawned fallback popup ${fallbackPopup.id} at position:`, popupPosition);
        }
      } catch (error) {
        console.error('[GameLoop] Error spawning popup:', error);
      }
    }, spawnInterval);

    return () => {
      console.log(`[GameLoop] Clearing spawn timer`);
      clearInterval(spawnTimer);
    };
  }, [state.gameActive, state.gameOver, state.systemCrashed, state.level, state.popups.length])

  // Desktop icons configuration - organized in two columns
  const leftColumnIcons: DesktopIcon[] = [
    {
      name: "Firecat",
      imagePath: "/img/firecat-taskbar.png",
      action: () => {
        console.log("Opening Firecat browser")
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
        console.log("Opening Nyantivirus")
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
        console.log("Opening Notepad")
        setActivePrograms([...state.activePrograms, "notepad"])
      }
    }
  ]
  
  const rightColumnIcons: DesktopIcon[] = [
    {
      name: "Task Manager",
      imagePath: "/img/TaskManager-taskbar.png",
      action: () => {
        console.log("Opening Task Manager")
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
        console.log("Opening Recycle Bin")
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

  // Start the game
  const startGame = () => {
    setShowInstructions(false)
    setGameActive(true)
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
    setQuizActive(false)
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
      console.error('Error fetching popups from API:', error)
      
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
        console.log(`[PopupManic] Assigned position for popup ${popup.id}:`, pos);
      }
    });

    // Batch update popupPositions state
    setPopupPositions({ ...state.popupPositions, ...assignedPositions });
    
    // Add all popups to the state using the addPopup action
    newPopups.forEach(popup => {
      console.log(`[PopupManic] Adding popup to state: ${popup.id}`);
      addPopup(popup);
    });
    
    return newPopups;
  }
  
  // Function to generate a random position for a popup based on its UI type
  const generateRandomPosition = (
    uiType?: string,
    extraOccupiedPositions: { x: number; y: number }[] = []
  ): { x: number, y: number } => {
    console.log(`Generating position for UI type: ${uiType}`);
    console.log(`Current popup positions:`, Object.keys(state.popupPositions).length, Object.values(state.popupPositions));
    
    // Default popup dimensions
    const popupWidth = 350;
    const popupHeight = 250;
    
    // Special handling for chat messages - always bottom right
    if (uiType === 'chat_message') {
      return {
        x: Math.max(50, window.innerWidth - chatWidth - 20), // Adjusted for larger chat width
        y: Math.max(50, window.innerHeight - chatHeight - 20) // Adjusted for larger chat height
      };
    }
    
    // Special handling for video popups - center screen for visibility
    if (uiType === 'video') {
      return {
        x: Math.max(50, (window.innerWidth - videoWidth) / 2), // Center horizontally
        y: Math.max(50, (window.innerHeight - videoHeight) / 3) // Position in upper third of screen
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
    
    // For other popups, use a fixed grid system with predefined positions
    // This ensures better distribution and prevents clumping
    
    // Calculate available screen space
    const maxX = window.innerWidth - popupWidth - 50; // popup width + padding
    const maxY = window.innerHeight - popupHeight - 80; // popup height + padding
    
    // Avoid taskbar area at bottom of screen
    const taskbarHeight = 60;
    const availableY = maxY - taskbarHeight;
    
    // Create a grid with fixed cell sizes much larger than popup dimensions
    // This ensures popups are well-separated
    const gridCellWidth = popupWidth * 2.2; // 220% of popup width - increased for more spacing
    const gridCellHeight = popupHeight * 2.2; // 220% of popup height - increased for more spacing
    
    // Calculate number of cells that fit in the screen
    const gridColumns = Math.max(3, Math.floor(maxX / gridCellWidth));
    const gridRows = Math.max(3, Math.floor(availableY / gridCellHeight));
    
    // Define fixed positions for popups based on a grid
    // This ensures they are evenly distributed across the screen
    const fixedPositions: {x: number, y: number}[] = [];
    
    // Create a grid of fixed positions
    for (let col = 0; col < gridColumns; col++) {
      for (let row = 0; row < gridRows; row++) {
        fixedPositions.push({
          x: Math.max(50, col * gridCellWidth + (gridCellWidth - popupWidth) / 2),
          y: Math.max(50, row * gridCellHeight + (gridCellHeight - popupHeight) / 2)
        });
      }
    }
    
    // Get all existing positions
    const existingPositions = Object.values(setPopupPositions);
    const allOccupiedPositions = [...existingPositions, ...extraOccupiedPositions];

    // Find all available fixed positions that aren't already occupied
    const availablePositions = fixedPositions.filter(fixedPos => {
      return !allOccupiedPositions.some(existingPos => {
        // Check if this fixed position is already occupied
        return Math.abs(existingPos.x - fixedPos.x) < popupWidth * 0.5 &&
               Math.abs(existingPos.y - fixedPos.y) < popupHeight * 0.5;
      });
    });

    // Debug log
    console.log('[PopupManic] Available grid positions:', availablePositions.length, availablePositions);

    // If we have available positions, choose one randomly
    if (availablePositions.length > 0) {
      // Add a small random offset to the fixed position for visual variety
      const selectedPos = availablePositions[Math.floor(Math.random() * availablePositions.length)];
      const jitterX = (Math.random() - 0.5) * popupWidth * 0.2; // Small random offset
      const jitterY = (Math.random() - 0.5) * popupHeight * 0.2; // Small random offset
      
      const finalPosition = {
        x: Math.max(50, Math.min(maxX, selectedPos.x + jitterX)),
        y: Math.max(50, Math.min(availableY, selectedPos.y + jitterY))
      };
      
      console.log(`Selected position from ${availablePositions.length} available:`, finalPosition);
      return finalPosition;
    }
    
    // Fallback: If all fixed positions are occupied, find the position furthest from all occupied popups
    console.log(`[PopupManic] No available fixed positions, using fallback positioning`);
    let bestPos = {x: 0, y: 0};
    let maxMinDistance = 0;
    // Try 30 random positions and pick the one furthest from all occupied popups
    for (let i = 0; i < 30; i++) {
      const testPos = {
        x: Math.max(50, Math.random() * maxX),
        y: Math.max(50, Math.random() * availableY)
      };
      // Find minimum distance to any occupied popup
      let minDistance = Number.MAX_VALUE;
      for (const pos of allOccupiedPositions) {
        const distance = Math.sqrt(
          Math.pow(pos.x - testPos.x, 2) +
          Math.pow(pos.y - testPos.y, 2)
        );
        minDistance = Math.min(minDistance, distance);
      }
      // If this position is better than our current best, update it
      if (minDistance > maxMinDistance) {
        maxMinDistance = minDistance;
        bestPos = testPos;
      }
    }
    console.log(`[PopupManic] Fallback position selected:`, bestPos, `with min distance:`, maxMinDistance);
    return bestPos;
  };
  
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
            "Never provide personal information via text",
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
      correctSoundRef.current.play().catch(err => console.error('Error playing correct sound:', err))
    } else if (!isCorrect && wrongSoundRef.current) {
      wrongSoundRef.current.currentTime = 0
      wrongSoundRef.current.play().catch(err => console.error('Error playing wrong sound:', err))
    }
  }

  // Function to check if a popup category is new and trigger tutorial
  // Tutorial functions removed - now using educational modal system

  // List of available silly GIFs from the public folder
  const availableSillyGifs = [
    'silly-gif (1).gif', 'silly-gif (2).gif', 'silly-gif (3).gif', 'silly-gif (4).gif', 'silly-gif (5).gif',
    'silly-gif (6).gif', 'silly-gif (7).gif', 'silly-gif (8).gif', 'silly-gif (9).gif', 'silly-gif (10).gif',
    'silly-gif (11).gif', 'silly-gif (12).gif', 'silly-gif (13).gif', 'silly-gif (14).gif', 'silly-gif (15).gif',
    'silly-gif (16).gif', 'silly-gif (17).gif', 'silly-gif (18).gif', 'silly-gif (19).gif', 'silly-gif (20).gif',
    'silly-gif (21).gif', 'silly-gif (22).gif', 'silly-gif (23).gif', 'silly-gif (24).gif', 'silly-gif (25).gif',
    'silly-gif (26).gif', 'silly-gif (27).gif', 'silly-gif (28).gif', 'silly-gif (29).gif', 'silly-gif (30).gif',
    'silly-gif (31).gif', 'silly-gif (32).gif', 'silly-gif (33).gif', 'silly-gif (34).gif', 'silly-gif (35).gif',
    'silly-gif (36).gif', 'silly-gif (37).gif', 'silly-gif (38).gif'
  ];

  // Trigger random virus outbreak with silly GIFs
  const triggerRandomVirusOutbreak = () => {
    console.log('[VirusOutbreak] Random virus outbreak triggered!');
    
    setIsInfected(true);
    setShowVirusWarning(true);
    
    // Play virus outbreak sounds
    if (virusAlertSoundRef.current) {
      virusAlertSoundRef.current.currentTime = 0;
      virusAlertSoundRef.current.play().catch(err => console.error('Error playing virus alert sound:', err));
    }
    
    if (virusSirenSoundRef.current) {
      virusSirenSoundRef.current.currentTime = 0;
      virusSirenSoundRef.current.play().catch(err => console.error('Error playing virus siren sound:', err));
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
    
    console.log(`[VirusOutbreak] Spawned ${gifCount} silly GIFs. Click Nyantivirus to clear them!`);
  };

  // Clear virus outbreak when Nyantivirus is clicked
  const clearVirusOutbreak = () => {
    if (state.infectedGifs.length > 0) {
      console.log('[VirusOutbreak] Nyantivirus activated! Clearing virus outbreak...');
      
      // Stop virus outbreak sounds immediately
      if (virusAlertSoundRef.current) {
        virusAlertSoundRef.current.pause();
        virusAlertSoundRef.current.currentTime = 0;
        console.log('[VirusOutbreak] Stopped virus alert sound');
      }
      
      if (virusSirenSoundRef.current) {
        virusSirenSoundRef.current.pause();
        virusSirenSoundRef.current.currentTime = 0;
        console.log('[VirusOutbreak] Stopped virus siren sound');
      }
      
      // Clear all virus-related state
      setInfectedGifs([]);
      setIsInfected(false);
      setShowVirusWarning(false);
      
      // Play cheerful success sound
      if (cheerfulSoundRef.current) {
        cheerfulSoundRef.current.currentTime = 0;
        cheerfulSoundRef.current.play().catch(err => console.error('Error playing cheerful sound:', err));
      }
      
      // Show success message
      alert('🎉 Nyantivirus has successfully cleared the virus outbreak!');
    }
  };

  // Make clearVirusOutbreak available globally for existing desktop icon
  React.useEffect(() => {
    (window as any).clearVirusOutbreak = clearVirusOutbreak;
    return () => {
      delete (window as any).clearVirusOutbreak;
    };
  }, [clearVirusOutbreak]);

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
    setShowAnswerFeedback(null);
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
    
    // Stop all sounds
    if (systemAlertSound1Ref.current) systemAlertSound1Ref.current.pause();
    if (systemAlertSound2Ref.current) systemAlertSound2Ref.current.pause();
    if (crashSoundRef.current) crashSoundRef.current.pause();
    
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
    dispatch({ type: 'SET_USE_MODERN_POPUPS', payload: false });
    
    // Reset hint modal
    dispatch({
      type: 'SET_HINT_MODAL',
      payload: { active: false, popup: null, slide: 0, currentSlide: 0 }
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
      // Correct action - award points and close popup
      playSound(true);
      const newScore = state.score + 10;
      setScore(newScore);
      
      // Check if player should level up (every 100 points)
      if (newScore > 0 && newScore % 100 === 0) {
        const newLevel = Math.floor(newScore / 100) + 1;
        setLevel(newLevel);
        
        // Show level pass message
        setLevelPassMessage({show: true, level: newLevel});
        
        // Hide message after 5 minutes (much longer duration)
        setTimeout(() => {
          setLevelPassMessage({show: false, level: 0});
        }, 300000); // 300 seconds = 5 minutes
      }
      
      // Track encountered popup for quiz system and trigger quiz if needed
      setEncounteredPopups(prev => {
        const exists = prev.find(p => p.id === popup.id);
        const updatedPopups = exists ? prev : [...prev, popup];
        
        // Check if quiz should be triggered (every 100 points)
        // We check the updated popups array here to ensure we have the latest count
        if (newScore > 0 && newScore % 100 === 0 && updatedPopups.length >= 5) {
          // Use setTimeout to ensure state updates have completed
          setTimeout(() => triggerQuiz(newScore), 0);
        }
        
        return updatedPopups;
      });
      
      removePopupById(popup);
    } else {
      // Incorrect action - increment mistakes and show educational hint modal
      playSound(false);
      const newMistakes = state.mistakes + 1;
      setMistakes(newMistakes);
      
      // Check if game should end due to too many mistakes
      if (newMistakes >= 5) {
        // Play crash sound when system crashes
        if (crashSoundRef.current) {
          crashSoundRef.current.currentTime = 0;
          crashSoundRef.current.play().catch(err => console.error('Error playing crash sound:', err));
        }
        setGameOver(true);
        setGameActive(false);
      }
      
      setHintModal({ active: true, popup, slide: 1, currentSlide: 0 });
      // Note: Popup will be removed when user closes the educational modal
      // No automatic timeout removal to prevent unexpected popup closing
    }
  };
  
  // Check if user action matches the correct action for the popup
  const checkCorrectAction = (popup: any, userAction: 'click' | 'close' | 'ignore'): boolean => {
    const correctAction = popup.correct_action;
    
    // Map correct_action to user actions
    if (correctAction === 'FORCE_CLOSE_OS_LEVEL' || correctAction === 'IGNORE_UNTIL_AUTOCLOSE') {
      return userAction === 'close';
    } else if (correctAction === 'ACCEPT_OFFER' || correctAction === 'CLICK_BUTTON') {
      return userAction === 'click';
    } else if (correctAction === 'VERIFY_LEGITIMACY_EXTERNALLY') {
      return userAction === 'close'; // Should close and verify externally
    }
    
    // Default: malicious popups should be closed, benign should be clicked
    if (popup.is_malicious) {
      return userAction === 'close';
    } else {
      return userAction === 'click';
    }
  };
  
  // Remove popup and clean up state
  const removePopupById = (popup: any) => {
    // Check if popup ID is valid to prevent removing multiple popups
    if (!popup || !popup.id) {
      console.error('Attempted to remove popup with invalid ID:', popup);
      console.trace('removePopup called with invalid popup');
      return;
    }

    console.log(`Removing popup ${popup.id}`);
    console.log(`Current popups before removal:`, state.popups.map(p => p.id));

    // Remove ALL popups with this ID
    const filtered = state.popups.filter(p => p.id !== popup.id);
    setPopups(filtered);

    // Clean up popup position and minimized state
    const newPositions = { ...state.popupPositions } as Record<string, { x: number; y: number }>;
    if (popup.id in newPositions) {
      delete newPositions[popup.id];
    }
    setPopupPositions(newPositions);

    const newMinimized = new Set(state.minimizedPopups);
    if (newMinimized.has(popup.id)) {
      newMinimized.delete(popup.id);
    }
    setMinimizedPopups(newMinimized);

    // Clean up interacted popups state
    setInteractedPopups(prev => {
      const newSet = new Set(Array.from(prev));
      if (newSet.has(popup.id)) {
        newSet.delete(popup.id);
      }
      return newSet;
    });

    // Log all popup positions after removal
    setTimeout(() => {
      console.log(`[removePopup] Popup positions after removal:`, newPositions);
    }, 100);
  };

  // Quiz System Functions
  const triggerQuiz = (currentScore: number) => {
    if (encounteredPopups.length < 5) {
      console.log('Not enough encountered popups for quiz');
      return;
    }
    
    console.log(`Triggering quiz at score ${currentScore}`);
    setGameActive(false); // Pause the game
    setQuizActive(true);
    setQuizStartTime(Date.now());
  
  // Generate 5 quiz questions from encountered popups
  const questions = generateQuizQuestions(encounteredPopups);
    setQuizQuestions(questions);
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setQuestionStartTime(Date.now());
    
    setCurrentQuiz({
      level: Math.floor(currentScore / 100),
      score: currentScore,
      startTime: Date.now()
    });
  };
  
  const generateQuizQuestions = (popups: Popup[]): any[] => {
    const questions: any[] = [];
    const questionTypes = ['categorization', 'correct_action', 'justification', 'prevention'];
    
    // Ensure we have enough unique popups
    const availablePopups = [...popups];
    
    for (let i = 0; i < 5; i++) {
      if (availablePopups.length === 0) break;
      
      const randomPopup = availablePopups[Math.floor(Math.random() * availablePopups.length)];
      const questionType = questionTypes[i % questionTypes.length];
      
      const question = createQuizQuestion(randomPopup, questionType, availablePopups);
      if (question) {
        questions.push(question);
      }
    }
    
    return questions;
  };
  
  const createQuizQuestion = (popup: Popup, type: string, allPopups: Popup[]): any => {
    switch (type) {
      case 'categorization':
        return {
          id: `q_${Date.now()}_${Math.random()}`,
          type: 'categorization',
          popup: popup,
          question: 'What category does this popup belong to?',
          options: generateCategoryOptions(popup, allPopups),
          correctAnswer: popup.category,
          format: 'drag_drop'
        };
        
      case 'correct_action':
        return {
          id: `q_${Date.now()}_${Math.random()}`,
          type: 'correct_action', 
          popup: popup,
          question: 'What is the correct action for this popup?',
          options: generateActionOptions(popup),
          correctAnswer: popup.correct_action,
          format: 'interactive_buttons'
        };
        
      case 'justification':
        return {
          id: `q_${Date.now()}_${Math.random()}`,
          type: 'justification',
          popup: popup,
          question: popup.is_malicious ? 'Why is this popup malicious?' : 'Why is this popup safe?',
          options: generateJustificationOptions(popup, allPopups),
          correctAnswer: popup.explanation?.why_this_popup_is_X_type || 'This popup requires careful evaluation.',
          format: 'multiple_choice'
        };
        
      case 'prevention':
        return {
          id: `q_${Date.now()}_${Math.random()}`,
          type: 'prevention',
          popup: popup,
          question: 'What is the best prevention tip for this type of threat?',
          options: generatePreventionOptions(popup, allPopups),
          correctAnswer: popup.explanation?.prevention_tips?.[0] || 'Always verify before taking action.',
          format: 'multiple_choice'
        };
        
      default:
        return null;
    }
  };
  
  const generateCategoryOptions = (correctPopup: Popup, allPopups: Popup[]): string[] => {
    const categories = ['credential_harvesting', 'brand_impersonation', 'prize_reward', 'benign_notification', 'neutral_ad'];
    const options = [correctPopup.category];
    
    // Add 3 random wrong categories
    const wrongCategories = categories.filter(cat => cat !== correctPopup.category);
    for (let i = 0; i < 3 && wrongCategories.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * wrongCategories.length);
      options.push(wrongCategories.splice(randomIndex, 1)[0]);
    }
    
    return shuffleArray(options);
  };
  
  const generateActionOptions = (popup: Popup): string[] => {
    const actions = [
      'FORCE_CLOSE_OS_LEVEL',
      'CLOSE_LEGITIMATE_NATIVE', 
      'ACCEPT_OFFER',
      'DECLINE_OFFER',
      'IGNORE_UNTIL_AUTOCLOSE'
    ];
    
    const options = [popup.correct_action];
    const wrongActions = actions.filter(action => action !== popup.correct_action);
    
    // Add 3 random wrong actions
    for (let i = 0; i < 3 && wrongActions.length > 0; i++) {
      const randomIndex = Math.floor(Math.random() * wrongActions.length);
      options.push(wrongActions.splice(randomIndex, 1)[0]);
    }
    
    return shuffleArray(options);
  };
  
  const generateJustificationOptions = (correctPopup: Popup, allPopups: Popup[]): string[] => {
    const options = [correctPopup.explanation?.why_this_popup_is_X_type || 'This popup requires careful evaluation.'];
    
    // Add explanations from other popups as wrong answers
    const otherExplanations = allPopups
      .filter(p => p.id !== correctPopup.id && p.explanation?.why_this_popup_is_X_type)
      .map(p => p.explanation!.why_this_popup_is_X_type!)
      .slice(0, 3);
      
    options.push(...otherExplanations);
    
    // Fill with generic wrong answers if needed
    while (options.length < 4) {
      options.push('This is a generic security warning.');
    }
    
    return shuffleArray(options);
  };
  
  const generatePreventionOptions = (correctPopup: Popup, allPopups: Popup[]): string[] => {
    const correctTip = correctPopup.explanation?.prevention_tips?.[0] || 'Always verify before taking action.';
    const options = [correctTip];
    
    // Add prevention tips from other popups
    const otherTips = allPopups
      .filter(p => p.id !== correctPopup.id && p.explanation?.prevention_tips?.length)
      .flatMap(p => p.explanation!.prevention_tips!)
      .slice(0, 3);
      
    options.push(...otherTips);
    
    // Fill with generic tips if needed
    const genericTips = [
      'Keep your software updated.',
      'Use strong passwords.',
      'Be cautious with email attachments.'
    ];
    
    while (options.length < 4) {
      const randomTip = genericTips[Math.floor(Math.random() * genericTips.length)];
      if (!options.includes(randomTip)) {
        options.push(randomTip);
      }
    }
    
    return shuffleArray(options);
  };
  
  const shuffleArray = (array: any[]): any[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };
  
  const [showAnswerFeedback, setShowAnswerFeedback] = useState<{show: boolean, isCorrect: boolean, correctAnswer: string} | null>(null);
  const [quizResult, setQuizResult] = useState<{passed: boolean, percentage: number, correctAnswers: number, totalQuestions: number, score: number} | null>(null);
  
  const handleQuizAnswer = (answer: any) => {
    // Prevent processing more than 5 answers
    if (quizAnswers.length >= 5) {
      console.log('Quiz already has 5 answers, ignoring additional answer');
      return;
    }
    
    const currentQuestion = quizQuestions[currentQuestionIndex];
    const isCorrect = answer === currentQuestion.correctAnswer;
    const reactionTime = Date.now() - questionStartTime;
    
    const answerData = {
      questionId: currentQuestion.id,
      popupId: currentQuestion.popup.id,
      questionType: currentQuestion.type,
      playerAnswer: answer,
      correctAnswer: currentQuestion.correctAnswer,
      isCorrect: isCorrect,
      reactionTimeMs: reactionTime
    };
    
    setQuizAnswers(prev => [...prev, answerData]);
    
    // Show answer feedback
    setShowAnswerFeedback({
      show: true,
      isCorrect: isCorrect,
      correctAnswer: currentQuestion.correctAnswer
    });
    
    // Wait 0.5 seconds before moving to next question
    setTimeout(() => {
      setShowAnswerFeedback(null);
      
      // Robust check: finish quiz if we've reached question 5 (index 4) or have 5 answers
      const currentAnswerCount = quizAnswers.length + 1; // +1 because current answer was just added
      const isLastQuestion = currentQuestionIndex >= 4 || currentAnswerCount >= 5;
      
      if (isLastQuestion) {
        console.log(`Finishing quiz: questionIndex=${currentQuestionIndex}, answerCount=${currentAnswerCount}`);
        finishQuiz();
      } else {
        console.log(`Moving to next question: questionIndex=${currentQuestionIndex}, answerCount=${currentAnswerCount}`);
        setCurrentQuestionIndex(prev => prev + 1);
        setQuestionStartTime(Date.now());
      }
    }, 500); // Reduced from 2000ms to 500ms for faster feedback
  };
  
  const finishQuiz = async () => {
    const correctAnswers = quizAnswers.filter(a => a.isCorrect).length;
    const totalQuestions = 5; // Always 5 questions per quiz
    const finalScore = correctAnswers * 10;
    const percentage = Math.round((correctAnswers / totalQuestions) * 100);
    const passed = percentage >= 70;
    const quizEndTime = Date.now();
    const totalTimeMs = quizEndTime - currentQuiz.startTime;
    
    const quizResult = {
      userId: 'player', // In a real app, this would be the actual user ID
      quizLevel: currentQuiz.level,
      score: finalScore,
      totalQuestions: totalQuestions,
      correctAnswers: correctAnswers,
      totalTimeMs: totalTimeMs,
      questions: quizAnswers,
      completedAt: new Date().toISOString(),
      passed: passed,
      percentage: percentage
    };
    
    // TODO: Implement quiz results API endpoint
    // try {
    //   const response = await fetch('/api/quiz-results', {
    //     method: 'POST',
    //     headers: {
    //       'Content-Type': 'application/json',
    //     },
    //     body: JSON.stringify(quizResult),
    //   });
    //   
    //   if (!response.ok) {
    //     throw new Error('Failed to save quiz result');
    //   }
    //   
    //   console.log('Quiz result saved successfully');
    // } catch (error) {
    //   console.error('Error saving quiz result:', error);
    // }
    
    console.log('Quiz completed:', quizResult);
    
    // Show pass/fail message
    setQuizResult({
      passed: passed,
      percentage: percentage,
      correctAnswers: correctAnswers,
      totalQuestions: totalQuestions,
      score: finalScore
    });
    
    // Quiz result modal will persist until user clicks to dismiss
    // No auto-dismiss timeout - user must manually close the modal
  };
  
  // Handle dismissing quiz result modal
  const dismissQuizResult = () => {
    const passed = quizResult?.passed || false;
    
    // Reset quiz state
    setQuizActive(false);
    setQuizQuestions([]);
    setCurrentQuestionIndex(0);
    setQuizAnswers([]);
    setCurrentQuiz(null);
    setShowAnswerFeedback(null);
    setQuizResult(null);
    
    // Level up if passed, otherwise stay at level 1
    if (passed) {
      setLevel(state.level + 1);
    } else {
      setLevel(1); // Keep at level 1 until they pass
    }
    
    // Resume game
    setGameActive(true);
  };
  
  // Handle popup interaction (legacy function for compatibility)
  const handlePopupAction = (popup: Popup, action: 'click' | 'close' | 'ignore') => {
    // Remove the popup from the list
    setPopups(state.popups.filter(p => p.id !== popup.id))
    
    // Clean up popup position and minimized state
    const newPositions = { ...state.popupPositions };
    delete newPositions[popup.id];
    setPopupPositions(newPositions);
    const newMinimized = new Set(state.minimizedPopups);
    newMinimized.delete(popup.id);
    setMinimizedPopups(newMinimized);
    
    // Check if the action was correct
    if (action === popup.correctAction) {
      // Correct action - play correct sound
      playSound(true)
      setScore(state.score + (state.level * 10))
      
      // If all popups are handled, generate new ones and increase level
      if (state.popups.length === 1) {
        setLevel(state.level + 1)
        generatePopups(state.level + 1)
      }
    } else {
      // Incorrect action - play wrong sound
      playSound(false)
      setMistakes(state.mistakes + 1)
      
      // 10% chance to trigger virus warning effect
      if (Math.random() < 0.1) {
        setShowVirusWarning(true);
        // Auto-hide after 3 seconds
        setTimeout(() => setShowVirusWarning(false), 3000);
      }
      
      // Game over if too many mistakes
      if (state.mistakes >= 5) {
        setSystemCrashed(true);
        setGameActive(false);
      }
    }
  };

  return (
    <>
      {/* Game Area */}
      <div className="relative w-full h-screen bg-blue-900 overflow-hidden">
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
      
      {/* System crash overlay */}
      {state.systemCrashed && (
        <div className="absolute inset-0 bg-blue-800 z-[9999] flex flex-col items-center justify-center text-white p-8">
          <div className="max-w-2xl w-full bg-blue-900 border-4 border-white p-8 rounded-lg shadow-2xl">
            <h2 className="text-4xl font-arcade mb-6 text-center">SYSTEM CRASH</h2>
            <div className="mb-6">
              <p className="text-xl mb-4">Your system has crashed due to excessive popup overload!</p>
              <p className="mb-4">Too many popups (22) were active simultaneously, causing a catastrophic system failure.</p>
              <p className="mb-4">This is a common result of malware infections that generate excessive popups.</p>
            </div>
            <div className="text-center">
              <button 
                onClick={rebootSystem}
                className="bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-arcade py-3 px-8 rounded-lg text-xl transition-colors"
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
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-40 flex flex-col"
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
                            console.error('Error fetching popup:', error);
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
                                
                                console.log(`Spawned product popup ${randomPopup.id} at position:`, popupPosition);
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
                                
                                console.log(`Spawned product fallback popup ${fallbackPopup.id} at position:`, fallbackPosition);
                              }
                            } catch (error) {
                              console.error('Error fetching popup:', error);
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
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-40"
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
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-40"
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
              <button 
                className={`font-arcade text-sm px-4 py-2 rounded ${!updatingSoftware ? 'bg-arcade-cyan text-black hover:bg-arcade-cyan/80' : 'bg-gray-600 text-gray-400 cursor-not-allowed'}`}
                onClick={() => {
                  if (!updatingSoftware) {
                    setUpdatingSoftware(true)
                    setSoftwareUpdateProgress({
                      'Firecat Browser': 0,
                      'Nyantivirus': 0,
                      'Windows Security': 0
                    })
                  }
                }}
                disabled={updatingSoftware}
              >
                {updatingSoftware ? 'Updating...' : 'Update All'}
              </button>
            </div>
          </div>
        </DraggableWindow>
      )}
      
      {/* Game HUD as Windows taskbar at bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-arcade-bg/90 backdrop-blur-sm p-2 z-50 flex justify-between items-center border-t border-gray-700">
        <div className="flex items-center relative">
          <div 
            className={`bg-arcade-cyan/20 p-1.5 rounded mr-4 flex items-center cursor-pointer ${startMenuOpen ? 'bg-arcade-cyan/40' : ''}`}
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
          <div className="flex items-center justify-center mx-2 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded relative"
            onClick={() => {
              setWifiMenuOpen(!wifiMenuOpen)
              // Close start menu if open
              if (startMenuOpen) setStartMenuOpen(false)
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
          <div className="flex items-center justify-center mx-2 cursor-pointer hover:bg-arcade-cyan/20 p-1 rounded">
            <Image 
              src="/img/bell-rmb.png" 
              alt="Notifications" 
              width={20} 
              height={20} 
              draggable="false"
            />
          </div>
          
          {/* Running programs in taskbar */}
          <div className="flex items-center ml-2">
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
                      
                      console.log(`Spawned popup ${randomPopup.id} at position:`, popupPosition);
                    } else {
                      // Try one more time with a different API call approach
                      try {
                        // Try to get any popup regardless of type
                        console.log('First API call failed, trying again with different parameters...');
                        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
                        const fallbackResponse = await axios.get(`${baseUrl}/api/popup/random`, { timeout: 3000 });
                        
                        if (fallbackResponse.data && fallbackResponse.data.data) {
                          const apiPopup = fallbackResponse.data.data;
                          
                          // Generate random position for the popup using our improved function
                          const randomPosition = generateRandomPosition(apiPopup.ui_type);
                          
                          // Generate random size based on UI type
                          const randomSize = {
                            width: Math.floor(Math.random() * 150) + 300, // 300-450px
                            height: Math.floor(Math.random() * 100) + 200 // 200-300px
                          };
                          
                          // Transform the API popup to match our Popup interface with random position and size
                          const randomPopup = transformPopupFromAPI(apiPopup, randomPosition, randomSize);
                           
                          // Add the popup to the state using the addPopup action
                          addPopup(randomPopup);
                          setPopupPositions({
                            ...state.popupPositions,
                            [randomPopup.id]: randomPosition
                          });
                          
                          console.log(`Spawned fallback popup ${randomPopup.id} at position:`, randomPosition);
                          console.log('Successfully added random popup from second API attempt');
                        } else {
                          throw new Error('Second API attempt failed');
                        }
                      } catch (fallbackError) {
                        console.error('Both API attempts failed, using mock popup:', fallbackError);
                        
                        // Generate a mock popup as last resort
                        const mockPopup = getMockPopup(Math.random() > 0.5 ? 'malicious' : 'benign');
                        
                        // Generate random position using our improved function
                        const randomPosition = generateRandomPosition(mockPopup.ui_type);
                        
                        // Transform the mock popup with random position
                        const fallbackPopup = transformPopupFromAPI(mockPopup, randomPosition);
                        addPopup(fallbackPopup);
                        setPopupPositions({
                          ...state.popupPositions,
                          [fallbackPopup.id]: randomPosition
                        });
                        
                        console.log(`Spawned mock popup ${fallbackPopup.id} at position:`, randomPosition);
                      }
                    }
                  } catch (error) {
                    console.error('Error fetching popup:', error);
                  }
                }}
              >
                Update Windows
              </div>
              <div 
                className="p-2 font-arcade text-sm text-arcade-cyan hover:bg-arcade-cyan/20 cursor-pointer"
                onClick={() => {
                  setUpdateWindowOpen(true)
                  setActivePrograms([...state.activePrograms, 'updatesoftware'])
                }}
              >
                Update Software
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <div className="text-arcade-cyan font-arcade text-xs">
            <span className="mr-4">SCORE: {state.score}</span>
            <span className="mr-4">LEVEL: {state.level}</span>
            <span  className="text-arcade-red">MISTAKES: {state.mistakes}/5</span>
          </div>
        </div>
      </div>
      
      {/* Virus Warning Overlay */}
      {state.showVirusWarning && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80">
          <motion.div 
            className="text-red-500 text-6xl font-bold text-center p-8 bg-black/90 border-4 border-red-500"
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8],
              textShadow: [
                '0 0 10px #ff0000', 
                '0 0 20px #ff0000, 0 0 30px #ff0000', 
                '0 0 10px #ff0000'
              ]
            }}
            transition={{
              duration: 0.5,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            WARNING: YOUR COMPUTER IS INFECTED!
          </motion.div>
        </div>
      )}
      
      {/* Virus Infection Overlay */}
      {state.isInfected && (
        <div className="fixed inset-0 z-[9999] pointer-events-none">
          {state.infectedGifs.map((gif) => (
            <motion.div
              key={gif.id}
              className="absolute w-48 h-32"
              style={{
                left: gif.x,
                top: gif.y,
                transform: `rotate(${gif.rotation}deg)`,
              }}
              animate={{
                y: [0, 50, 0],
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: 'reverse',
              }}
            >
              <Image
                src={`/silly-gif/video${Math.floor(Math.random() * 3) + 1}.gif`}
                alt="Virus!"
                width={200}
                height={150}
                className="w-full h-full object-contain"
                unoptimized
              />
            </motion.div>
          ))}
        </div>
      )}

      {/* Desktop Icons - two columns */}
      <div className="flex justify-start relative z-10 pl-[80px] pt-6">
        {/* Left column */}
        <div className="flex flex-col gap-8 mr-16">
          {leftColumnIcons.map((icon, index) => (
            <motion.div 
              key={icon.name}
              className="flex flex-col items-center cursor-pointer group w-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={icon.action}
            >
              <div className="w-16 h-16 relative mb-2 bg-white/10 rounded-lg p-1 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Image 
                  src={icon.imagePath} 
                  alt={icon.name} 
                  width={64} 
                  height={64} 
                  style={{ objectFit: 'contain' }}
                  draggable="false"
                />
              </div>
              <p className="text-white font-arcade text-[10px] text-center shadow-black drop-shadow-md group-hover:text-arcade-cyan transition-colors">
                {icon.name}
              </p>
            </motion.div>
          ))}
        </div>
        
        {/* Right column */}
        <div className="flex flex-col gap-8">
          {rightColumnIcons.map((icon, index) => (
            <motion.div 
              key={icon.name}
              className="flex flex-col items-center cursor-pointer group w-20"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={icon.action}
            >
              <div className="w-16 h-16 relative mb-2 bg-white/10 rounded-lg p-1 backdrop-blur-sm group-hover:bg-white/20 transition-colors">
                <Image 
                  src={icon.imagePath} 
                  alt={icon.name} 
                  width={64} 
                  height={64} 
                  style={{ objectFit: 'contain' }}
                  draggable="false"
                />
              </div>
              <p className="text-white font-arcade text-[10px] text-center shadow-black drop-shadow-md group-hover:text-arcade-cyan transition-colors">
                {icon.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game instructions */}
      {state.showInstructions && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-cyan p-8 rounded-lg max-w-2xl text-center shadow-lg shadow-arcade-cyan/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-arcade-magenta font-arcade text-2xl mb-6 glow-heading-pink">POP-UP MANIC</h2>
            <div className="text-gray-300 font-terminal text-lg mb-6 space-y-4">
              <p>Welcome to your new desktop! Unfortunately, it's been infected with pop-up malware!</p>
              <p>Your mission is to handle each pop-up correctly while using your desktop:</p>
              <ul className="text-left list-disc pl-6 space-y-2">
                <li><span className="text-arcade-red">Malicious pop-ups:</span> Close them immediately using the appropriate method!</li>
                <li><span className="text-arcade-green">Benign pop-ups:</span> Click to accept them (they're legitimate)</li>
                <li><span className="text-arcade-yellow">Neutral pop-ups:</span> Ignore them - they'll go away on their own</li>
              </ul>

            </div>
            <div className="flex flex-col space-y-4">
              {/* Modern popups are now the default and only option */}
              <button 
                onClick={startGame}
                className="font-arcade text-lg px-8 py-3 bg-arcade-magenta text-black rounded hover:bg-arcade-cyan hover:text-white transition-colors"
              >
                START GAME
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Game over screen */}
      {state.gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-red p-8 rounded-lg max-w-md text-center shadow-lg shadow-arcade-red/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-arcade-red font-arcade text-2xl mb-4 glow-heading-pink">SYSTEM CRASH</h2>
            <div className="text-gray-300 font-terminal text-lg mb-6">
              <p className="mb-2">Final Score: {state.score}</p>
              <p>Level Reached: {state.level}</p>
              <p className="mt-4 text-arcade-red">Too many malicious pop-ups compromised your system!</p>
            </div>
            <button 
              onClick={startGame}
              className="font-arcade text-lg px-8 py-3 bg-arcade-cyan text-black rounded hover:bg-arcade-magenta hover:text-white transition-colors"
            >
              REBOOT SYSTEM
            </button>
          </motion.div>
        </div>
      )}

      {/* Educational Hint Modal */}
      {state.hintModal.active && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/90 z-[9999]">
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
                    if (state.hintModal.popup) removePopupById(state.hintModal.popup.id);
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

      {/* Level Pass Message */}
      
      {/* Background click handler to unhighlight popups */}
      <div 
        className="fixed inset-0 z-0"
        onClick={() => {
          // Only unhighlight if game is active and hint modal is not showing
          if (state.gameActive && !state.hintModal.active && !state.systemCrashed) {
            dispatch({ type: 'SET_ACTIVE_POPUP_ID', payload: null });
          }
        }}
      ></div>

      {/* Debug logging */}
      {(() => {
        console.log(`[PopupManic] Rendering ${state.popups.length} popups, useModernPopups: ${state.useModernPopups}`, state.popups);
        return null;
      })()}
      
      {/* Popups */}
      <div className={state.hintModal.active ? 'pointer-events-none opacity-50' : !state.gameActive ? 'pointer-events-none opacity-50' : ''}>
        {state.popups.map((popup, index) => {
        // Fix undefined ID issue by ensuring each popup has a unique ID
        if (!popup.id) {
          const newId = `popup-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 9)}`;
          popup.id = newId;
          console.log(`[FIX] Assigned missing ID to popup:`, popup.id);
          
          // If there's a position stored under undefined, move it to the new ID
          if (state.popupPositions[undefined as any]) {
            const newPositions = { ...state.popupPositions } as Record<string, { x: number; y: number }>;
            // Generate a new position for this popup since they were all sharing undefined
            const newPosition = generateRandomPosition(popup.ui_type || 'system_alert');
            newPositions[newId] = newPosition;
            console.log(`[FIX] Assigned new position for popup ${newId}:`, newPosition);
            dispatch({ type: 'SET_POPUP_POSITIONS', payload: newPositions });
          }
        }
        
        const popupPosition = state.popupPositions[popup.id] || { x: 100, y: 100 };
        
        const isMinimized = state.minimizedPopups.has(popup.id);
        const isActive = state.activePopupId === popup.id;
        
        // Debug log for each popup
        if (state.popups.length > 0) {
          console.log(`[PopupManic] Rendering popup ${popup.id} (${popup.ui_type}) at position:`, popupPosition, 'minimized:', isMinimized);
        }
        
        return state.useModernPopups ? (
          <ModernPopupIntegration
            key={popup.id}
            popup={popup}
            onInteraction={(action) => {
              handlePopupInteraction(popup, action);
            }}
            position={popupPosition}
            onPositionChange={state.hintModal.active ? undefined : (newPosition) => {
              dispatch({ type: 'SET_POPUP_POSITIONS', payload: { ...state.popupPositions, [popup.id]: newPosition } });
            }}
            onMinimize={state.hintModal.active ? undefined : () => {
              const next = new Set(state.minimizedPopups);
              next.add(popup.id);
              setMinimizedPopups(next);
            }}
            isMinimized={isMinimized}
            isActive={isActive}
            onClick={() => {
              // Only set active popup if game is active and hint modal is not showing
              if (state.gameActive && !state.hintModal.active && !state.systemCrashed) {
                dispatch({ type: 'SET_ACTIVE_POPUP_ID', payload: popup.id });
              }
            }}
            style={{
              zIndex: isActive ? 50 : 40,
              boxShadow: isActive ? '0 0 0 2px #ff00ff, 0 4px 12px rgba(0, 0, 0, 0.4)' : '0 4px 8px rgba(0, 0, 0, 0.2)',
              transition: 'box-shadow 0.2s ease, z-index 0.1s'
            }}
          />
        ) : (
          <motion.div
            key={popup.id}
            className={`absolute overflow-hidden ${isActive ? 'ring-2 ring-arcade-magenta' : ''}`}
            style={{
              zIndex: isActive ? 50 : 40,
              left: popupPosition.x,
              top: popupPosition.y,
              width: popup.size?.width || DEFAULT_POPUP_SIZE.width,
              height: popup.size?.height || DEFAULT_POPUP_SIZE.height,
              borderRadius: `${popup.style?.borderRadius || 8}px`,
              border: `${popup.style?.borderWidth || 1}px solid ${popup.style?.borderColor || '#ccc'}`,
              boxShadow: popup.style.boxShadow,
              fontFamily: popup.style.fontFamily,
              fontSize: popup.style.fontSize
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
              borderTopLeftRadius: `${popup.style.borderRadius}px`,
              borderTopRightRadius: `${popup.style.borderRadius}px`
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
                      className={`px-4 py-2 rounded text-sm text-white flex items-center ${state.activePrograms.includes('meowarebytes') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}`}
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
      {quizActive && currentQuiz && quizQuestions.length > 0 && currentQuestionIndex < 5 && quizAnswers.length < 5 && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/95 z-[10000]">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-cyan p-8 rounded-lg max-w-4xl w-full mx-4 shadow-lg shadow-arcade-cyan/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {/* Quiz Header */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-arcade-cyan font-mono text-lg glow-heading-cyan">Security Quiz - Level {currentQuiz.level}</h2>
              <div className="text-arcade-cyan font-mono text-sm">
                Question {Math.min(currentQuestionIndex + 1, 5)} / 5
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="w-full bg-gray-800 rounded-full h-2 mb-6">
              <div 
                className="bg-arcade-cyan h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestionIndex + 1) / quizQuestions.length) * 100}%` }}
              ></div>
            </div>
            
            {/* Current Question */}
            {quizQuestions[currentQuestionIndex] && (
              <div className="bg-gray-800 p-6 rounded-lg mb-6">
                {/* Question Text */}
                <h3 className="text-arcade-magenta font-mono text-lg mb-4">
                  {quizQuestions[currentQuestionIndex].question}
                </h3>
                
                {/* Popup Preview for Context */}
                <div className="bg-gray-700 p-4 rounded-lg mb-6 border border-arcade-cyan/30">
                  <div className="text-arcade-cyan font-mono text-sm mb-2">Popup Context:</div>
                  <div className="bg-white text-black p-3 rounded border-2 border-gray-400 max-w-md">
                    <div className="font-mono font-semibold text-sm mb-2">
                      {quizQuestions[currentQuestionIndex].popup.title}
                    </div>
                    <div className="font-mono text-xs">
                      {quizQuestions[currentQuestionIndex].popup.message}
                    </div>
                  </div>
                </div>
                
                {/* Answer Feedback */}
                {showAnswerFeedback && (
                  <div className={`p-4 rounded-lg mb-4 border-2 ${
                    showAnswerFeedback.isCorrect 
                      ? 'bg-green-900/50 border-green-400 text-green-300' 
                      : 'bg-red-900/50 border-red-400 text-red-300'
                  }`}>
                    <div className="font-mono text-sm mb-2">
                      {showAnswerFeedback.isCorrect ? '✓ Correct!' : '✗ Incorrect'}
                    </div>
                    {!showAnswerFeedback.isCorrect && (
                      <div className="font-mono text-xs">
                        Correct answer: {showAnswerFeedback.correctAnswer}
                      </div>
                    )}
                  </div>
                )}
                
                {/* Question Format: Multiple Choice */}
                {quizQuestions[currentQuestionIndex].format === 'multiple_choice' && !showAnswerFeedback && (
                  <div className="space-y-3">
                    {quizQuestions[currentQuestionIndex].options.map((option: string, index: number) => (
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
                {quizQuestions[currentQuestionIndex].format === 'interactive_buttons' && !showAnswerFeedback && (
                  <div className="space-y-3">
                    <div className="text-arcade-cyan font-mono text-sm mb-4">
                      Click the correct action button:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {quizQuestions[currentQuestionIndex].options.map((action: string, index: number) => (
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
                {quizQuestions[currentQuestionIndex].format === 'drag_drop' && !showAnswerFeedback && (
                  <div className="space-y-4">
                    <div className="text-arcade-cyan font-mono text-sm mb-4">
                      Select the correct category for this popup:
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      {quizQuestions[currentQuestionIndex].options.map((category: string, index: number) => (
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
                Correct: {quizAnswers.filter(a => a.isCorrect).length} / 5
              </div>
              <div>
                Mistakes: {quizAnswers.filter(a => !a.isCorrect).length} / 5
              </div>
              <div>
                Quiz Score: {quizAnswers.filter(a => a.isCorrect).length * 10} points
              </div>
            </div>
          </motion.div>
        </div>
      )}
      
      {/* Windows-Style Virus Notification */}
      {state.infectedGifs.length > 0 && (
        <div className="fixed top-4 right-4 z-[9999] w-80 bg-white border border-gray-300 shadow-2xl rounded-lg overflow-hidden animate-slide-in-right">
          {/* Notification Header */}
          <div className="bg-red-600 text-white px-4 py-2 flex items-center">
            <div className="w-4 h-4 bg-white rounded-full mr-2 flex items-center justify-center">
              <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
            </div>
            <span className="font-semibold text-sm">Windows Security Alert</span>
            <button 
              className="ml-auto text-white hover:bg-red-700 w-6 h-6 rounded flex items-center justify-center text-xs"
              onClick={() => setInfectedGifs([])}
            >
              ×
            </button>
          </div>
          
          {/* Notification Content */}
          <div className="p-4">
            <div className="flex items-start">
              <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center mr-3 flex-shrink-0">
                <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 text-sm mb-1">
                  Virus Outbreak Detected!
                </h3>
                <p className="text-gray-600 text-xs mb-3">
                  Multiple malicious files have infected your system. Immediate action required to prevent data loss.
                </p>
                <div className="flex space-x-2">
                  <button 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs font-medium flex items-center"
                    onClick={clearVirusOutbreak}
                  >
                    <img src="/img/meowareBytes-taskbar.png" alt="" className="w-3 h-3 mr-1" />
                    Run Nyantivirus
                  </button>
                  <button 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded text-xs"
                    onClick={() => setInfectedGifs([])}
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
          
          {/* Progress bar animation */}
          <div className="h-1 bg-gray-200">
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
      
      {/* Quiz Result Modal */}
      {quizResult && (
        <div 
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 cursor-pointer"
          onClick={dismissQuizResult}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-900 border-2 border-arcade-cyan rounded-lg p-8 max-w-md w-full mx-4 text-center cursor-default"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Pass/Fail Header */}
            <div className={`text-4xl font-mono mb-4 ${
              quizResult.passed ? 'text-green-400' : 'text-red-400'
            }`}>
              {quizResult.passed ? '✓ PASSED!' : '✗ FAILED'}
            </div>
            
            {/* Score Display */}
            <div className="text-arcade-cyan font-mono text-xl mb-4">
              {quizResult.percentage}% ({quizResult.correctAnswers}/{quizResult.totalQuestions})
            </div>
            
            {/* Pass/Fail Message */}
            <div className="text-white font-mono text-sm mb-6">
              {quizResult.passed ? (
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
            
            {/* Motivational Message */}
            <div className="text-arcade-magenta font-mono text-xs mb-4">
              {quizResult.passed ? (
                "Ready for the next challenge? Let's keep building your cyber defenses!"
              ) : (
                "Remember: Real cybersecurity threats are everywhere. Practice makes perfect!"
              )}
            </div>
            
            {/* Score Breakdown */}
            <div className="bg-gray-800 p-4 rounded-lg font-mono text-xs mb-4">
              <div className="text-arcade-cyan mb-2">Quiz Results:</div>
              <div className="text-green-400">Correct: {quizResult.correctAnswers}</div>
              <div className="text-red-400">Incorrect: {quizResult.totalQuestions - quizResult.correctAnswers}</div>
              <div className="text-arcade-cyan">Score: {quizResult.score} points</div>
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
            width: (gif.size || 60) * 3, // 500% scale up (60px base * 5 = 300px)
            height: (gif.size || 60) * 3, // 500% scale up
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

      {/* Desktop Nyantivirus Icon */}
      <div 
        className="fixed bottom-20 left-4 w-16 h-20 cursor-pointer z-50 hover:scale-110 transition-transform"
        onClick={clearVirusOutbreak}
        title="Nyantivirus - Click to clear virus outbreak"
      >
        <div className="w-full h-16 bg-gray-100 rounded-lg flex items-center justify-center shadow-lg border border-gray-300 hover:bg-gray-200">
          <img 
            src="/img/meowareBytes-taskbar.png" 
            alt="Nyantivirus" 
            className="w-12 h-12 object-contain"
          />
        </div>
        <div className="text-xs text-white text-center mt-1 font-mono bg-black bg-opacity-50 px-1 rounded">Nyantivirus</div>
      </div>

      {/* Taskbar */}
      <div className="fixed bottom-0 left-0 right-0 h-16 bg-gray-800 border-t border-gray-600 flex items-center px-4 z-40">
        <div className="flex items-center space-x-2">
          {/* Nyantivirus Taskbar Icon */}
          <div 
            className="w-12 h-12 bg-gray-700 hover:bg-gray-600 rounded flex items-center justify-center cursor-pointer transition-colors"
            onClick={clearVirusOutbreak}
            title="Nyantivirus - Click to clear virus outbreak"
          >
            <img 
              src="/img/meowareBytes-taskbar.png" 
              alt="Nyantivirus" 
              className="w-8 h-8 object-contain"
            />
          </div>
          
          {/* Game Status */}
          <div className="ml-4 flex items-center space-x-4 text-white">
            <span className="text-sm">Score: {state.score}</span>
            <span className="text-sm">Level: {state.level}</span>
            <span className="text-sm">Mistakes: {state.mistakes}/5</span>
            {state.infectedGifs.length > 0 && (
              <span className="text-red-400 text-sm font-bold animate-pulse">
                🦠 Virus Outbreak Active! Click Nyantivirus to clean!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Tutorial overlay removed - now using educational modal system */}

      {/* Game Over Modal */}
      <GameOverModal
        isOpen={state.gameOver}
        currentGame="popup-manic"
        score={state.score}
        level={state.level}
        mistakes={state.mistakes}
        onRestart={restartGame}
        customStats={[
          { label: 'Popups Closed', value: Math.floor(state.score / 10) + state.mistakes, color: 'text-arcade-cyan' },
          { label: 'Correct Actions', value: Math.floor(state.score / 10), color: 'text-arcade-green' }
        ]}
      />
    </div>
    </>
  );
}

