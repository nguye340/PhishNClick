"use client"

import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { SystemAlert } from '../../components/ui/popups/system-alert'
import { BrowserNotification } from '../../components/ui/popups/browser-notification'
import { LoginForm } from '../../components/ui/popups/login-form'
import { SoftwareInstaller } from '../../components/ui/popups/software-installer'

// Define the popup data structure
interface PopupData {
  id: string
  title: string
  message: string
  type: 'malicious' | 'benign' | 'neutral'
  closeMethod: string
  correctAction: string
  theme?: string
  hasButton?: boolean
  buttonText?: string
  hasInputField?: boolean
  inputFieldLabel?: string
  hasLogo?: boolean
  logoPath?: string
}

// Define the interaction types
type InteractionType = 
  | { type: 'CLICK_BUTTON' }
  | { type: 'SUBMIT_FORM', data: Record<string, string> }
  | { type: 'CLOSE' }
  | { type: 'FORCE_CLOSE_OS_LEVEL' }

interface ModernPopupFetcherProps {
  onPopupInteraction?: (popup: PopupData, interaction: InteractionType) => void
}

export default function ModernPopupFetcher({ onPopupInteraction }: ModernPopupFetcherProps) {
  const [popup, setPopup] = useState<PopupData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch a random popup on component mount
  useEffect(() => {
    const fetchRandomPopup = async () => {
      try {
        setLoading(true)
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'
        const response = await axios.get(`${baseUrl}/api/popups/random`)
        
        if (response.data && response.data.data) {
          setPopup(response.data.data)
        } else {
          // Fallback to mock data if response format is unexpected
          setPopup(getMockPopup())
        }
        setError(null)
      } catch (error) {
        console.error('Error fetching popup:', error)
        setError('Failed to fetch popup')
        // Use mock data as fallback
        setPopup(getMockPopup())
      } finally {
        setLoading(false)
      }
    }

    fetchRandomPopup()
  }, [])

  // Handle popup interactions
  const handleInteraction = (interaction: InteractionType) => {
    if (popup && onPopupInteraction) {
      onPopupInteraction(popup, interaction)
      // Fetch a new popup after interaction
      setPopup(null)
      setLoading(true)
      setTimeout(() => {
        setPopup(getMockPopup())
        setLoading(false)
      }, 1000)
    }
  }

  // Generate a mock popup for testing
  const getMockPopup = (): PopupData => {
    const types = ['malicious', 'benign', 'neutral'] as const
    const type = types[Math.floor(Math.random() * types.length)]
    const themes = ['system-alert', 'browser', 'login', 'installer']
    const theme = themes[Math.floor(Math.random() * themes.length)]
    
    return {
      id: Math.random().toString(36).substring(2, 9),
      title: type === 'malicious' ? 'Security Alert!' : 'System Notification',
      message: type === 'malicious' 
        ? 'Your computer has been infected with a virus! Click here to clean your system.' 
        : 'System update available. Would you like to install now?',
      type: type,
      closeMethod: 'click_x',
      correctAction: type === 'malicious' ? 'close' : 'click',
      theme: theme,
      hasButton: true,
      buttonText: theme === 'login' ? 'Sign In' : 'OK'
    }
  }

  // Render the appropriate popup component based on the popup data
  const renderPopup = () => {
    if (!popup) return null

    // Map popup type to component
    switch (popup.theme) {
      case 'system-alert':
        return (
          <SystemAlert
            title={popup.title}
            message={popup.message}
            onButtonClick={() => handleInteraction({ type: 'CLICK_BUTTON' })}
            onClose={() => handleInteraction({ type: 'CLOSE' })}
            buttonText={popup.buttonText || 'OK'}
          />
        )
      
      case 'browser':
        return (
          <BrowserNotification
            title={popup.title}
            message={popup.message}
            onButtonClick={() => handleInteraction({ type: 'CLICK_BUTTON' })}
            onClose={() => handleInteraction({ type: 'CLOSE' })}
            buttonText={popup.buttonText || 'Allow'}
          />
        )
      
      case 'login':
        return (
          <LoginForm
            title={popup.title}
            message={popup.message}
            onSubmit={(data) => handleInteraction({ type: 'SUBMIT_FORM', data })}
            onClose={() => handleInteraction({ type: 'CLOSE' })}
          />
        )
      
      case 'installer':
        return (
          <SoftwareInstaller
            title={popup.title}
            message={popup.message}
            onButtonClick={() => handleInteraction({ type: 'CLICK_BUTTON' })}
            onClose={() => handleInteraction({ type: 'CLOSE' })}
            buttonText={popup.buttonText || 'Install Now'}
          />
        )
      
      default:
        // Default to system alert
        return (
          <SystemAlert
            title={popup.title}
            message={popup.message}
            onButtonClick={() => handleInteraction({ type: 'CLICK_BUTTON' })}
            onClose={() => handleInteraction({ type: 'CLOSE' })}
            buttonText={popup.buttonText || 'OK'}
          />
        )
    }
  }

  return (
    <div className="modern-popup-container">
      {loading ? (
        <div>Loading popup...</div>
      ) : error ? (
        <div>Error: {error}</div>
      ) : (
        renderPopup()
      )}
    </div>
  )
}
