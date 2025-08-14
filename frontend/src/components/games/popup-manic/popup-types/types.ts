// Common types for popup components

export type PopupStyle = {
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

export type PopupPosition = {
  x: number
  y: number
}

export type PopupSize = {
  width: number
  height: number
}

export type PopupButton = {
  text: string
  is_safe: boolean
}

export type PopupIndicator = {
  element: string
  indicator_type: string
  description: string
  severity: 'low' | 'medium' | 'high'
}

export type PopupBrandElements = {
  impersonated_brand_name?: string
  logo_url?: string
}

export type PopupPhishingIndicators = {
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

export type PopupElements = {
  hasLogo?: boolean
  logoPath?: string
  hasButton?: boolean
  buttonText?: string
  hasInputField?: boolean
  inputFieldLabel?: string
  hasAttachment?: boolean
  attachmentName?: string
}

// Popup class that handles both old and new properties
export interface Popup {
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
  phishingIndicators?: PopupPhishingIndicators
  elements?: PopupElements
  hint?: string
  content?: string
}

// Common props for all popup UI components
export interface PopupComponentProps {
  popup: Popup
  onInteraction: (action: string) => void
  position: PopupPosition
  onPositionChange?: (newPosition: PopupPosition) => void
  isActive: boolean
  setActive: () => void
}
