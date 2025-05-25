"use client"

import React, { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { getSession } from 'next-auth/react'
import axios from 'axios'
import { DraggableWindow } from './draggable-window'

interface Popup {
  id: string
  title: string
  message: string
  type: 'malicious' | 'benign' | 'neutral'
  position: {
    x: number
    y: number
  }
  size: {
    width: number
    height: number
  }
  closeMethod: 'click_x' | 'click_x_after_time' | 'click_button' | 'slide_away' | 'run_antivirus' | 'hang_up' | 'drag_to_trash' | 'shake_to_close' | 'solve_puzzle' | 'click_all_iocs' | 'no_action'
  correctAction: 'click' | 'close' | 'ignore'
  // Visual styling
  style: {
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
  // Phishing indicators
  phishingIndicators?: {
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
  // Content elements
  elements?: {
    hasLogo?: boolean
    logoPath?: string
    hasButton?: boolean
    buttonText?: string
    hasInputField?: boolean
    inputFieldLabel?: string
    hasAttachment?: boolean
    attachmentName?: string
  }
  // Additional properties
  hint?: string
}

interface DesktopIcon {
  name: string
  imagePath: string
  action: () => void
}

// Function to fetch a random popup from the database
async function fetchRandomPopup(type?: string) {
  try {
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/popups/random`;
    if (type) {
      url += `?type=${type}`;
    }
    const response = await axios.get(url);
    return response.data.data;
  } catch (error) {
    console.error('Error fetching random popup:', error);
    return null;
  }
}

// Get random close method for a popup
const getRandomCloseMethod = (): Popup['closeMethod'] => {
  const methods: Popup['closeMethod'][] = [
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
  
  return methods[Math.floor(Math.random() * methods.length)]
}

// Add misspellings to text
const addMisspellings = (text: string): string => {
  const commonMisspellings: Record<string, string> = {
    'Microsoft': 'Microsft',
    'Google': 'Goggle',
    'Amazon': 'Amaz0n',
    'PayPal': 'PayPa1',
    'account': 'acount',
    'security': 'securty',
    'password': 'pasword',
    'immediately': 'imediately',
    'verify': 'verrify',
    'update': 'updaet',
    'computer': 'computor',
    'system': 'sistam',
    'virus': 'virrus',
    'detected': 'detectid',
    'important': 'importent'
  }

  let result = text
  Object.keys(commonMisspellings).forEach(word => {
    if (text.includes(word) && Math.random() > 0.5) {
      result = result.replace(new RegExp(word, 'g'), commonMisspellings[word])
    }
  })

  return result
}

// Add grammatical errors to text
const addGrammaticalErrors = (text: string): string => {
  // Use Record<string, string> to properly type the object with an index signature
  const errorPatterns: Record<string, string> = {
    'You have': 'You has',
    'We have': 'We has',
    'They have': 'They has',
    'has been': 'have been',
    'is required': 'are required',
    'was detected': 'were detected',
    'Please update': 'Please updating',
    'will be': 'will being',
    'Your account': 'You account',
    'This is': 'This are'
  }

  let result = text
  Object.keys(errorPatterns).forEach(pattern => {
    if (text.includes(pattern) && Math.random() > 0.5) {
      // Now TypeScript knows that pattern is a valid key for errorPatterns
      result = result.replace(new RegExp(pattern, 'g'), errorPatterns[pattern])
    }
  })

  return result
}

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
  })
  
  return indicators
}

// Generate random style for a popup based on its type
const generateRandomStyle = (type: 'malicious' | 'benign' | 'neutral') => {
  // Base style properties
  const style: Popup['style'] = {
    theme: 'modern',
    headerColor: '#4285f4',
    bodyColor: '#ffffff',
    borderColor: '#dadce0',
    borderWidth: 1,
    borderRadius: 8,
    fontFamily: '"Roboto", sans-serif',
    fontSize: '14px',
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
  }
  
  // Adjust style based on popup type
  if (type === 'malicious') {
    // Malicious popups often use alarming colors
    style.headerColor = Math.random() > 0.5 ? '#d32f2f' : '#ff5722'
    style.borderColor = '#ff5252'
    style.boxShadow = '0 4px 12px rgba(255, 82, 82, 0.2)'
    
    // Sometimes use Windows-style for malicious popups
    if (Math.random() > 0.7) {
      style.theme = 'windows'
      style.headerColor = '#0078d7'
      style.borderColor = '#0078d7'
      style.fontFamily = '"Segoe UI", sans-serif'
    }
  } else if (type === 'benign') {
    // Benign popups often use calming colors
    style.headerColor = Math.random() > 0.5 ? '#4caf50' : '#2196f3'
    style.borderColor = '#81c784'
    
    // Sometimes use Mac-style for benign popups
    if (Math.random() > 0.7) {
      style.theme = 'mac'
      style.headerColor = '#f5f5f7'
      style.bodyColor = '#f5f5f7'
      style.borderRadius = 6
      style.fontFamily = '"SF Pro", "Helvetica Neue", sans-serif'
    }
  } else {
    // Neutral popups use more subdued colors
    style.headerColor = Math.random() > 0.5 ? '#9e9e9e' : '#607d8b'
    style.borderColor = '#e0e0e0'
    
    // Sometimes use retro-style for neutral popups
    if (Math.random() > 0.8) {
      style.theme = 'retro'
      style.headerColor = '#008080'
      style.borderColor = '#c0c0c0'
      style.borderWidth = 2
      style.fontFamily = '"MS Sans Serif", "Courier New", monospace'
    }
  }
  
  return style
}

// Generate random elements for a popup based on its type
const generateRandomElements = (type: 'malicious' | 'benign' | 'neutral') => {
  const elements: NonNullable<Popup['elements']> = {
    hasLogo: Math.random() > 0.5,
    hasButton: Math.random() > 0.3,
    hasInputField: Math.random() > 0.7,
    hasAttachment: Math.random() > 0.8
  }
  
  // Add more details based on type
  if (type === 'malicious') {
    // Malicious popups often have suspicious elements
    if (elements.hasLogo) {
      elements.logoPath = '/img/suspicious-logo.png'
    }
    if (elements.hasButton) {
      elements.buttonText = Math.random() > 0.5 ? 'Download Now' : 'Click Here'
    }
    if (elements.hasInputField) {
      elements.inputFieldLabel = Math.random() > 0.5 ? 'Enter Password' : 'Credit Card Number'
    }
    if (elements.hasAttachment) {
      elements.attachmentName = 'important-document.exe'
    }
  } else if (type === 'benign') {
    // Benign popups have legitimate-looking elements
    if (elements.hasLogo) {
      elements.logoPath = '/img/trusted-logo.png'
    }
    if (elements.hasButton) {
      elements.buttonText = Math.random() > 0.5 ? 'Accept Cookies' : 'Continue'
    }
    if (elements.hasInputField) {
      elements.inputFieldLabel = Math.random() > 0.5 ? 'Email Address' : 'Search'
    }
    if (elements.hasAttachment) {
      elements.attachmentName = 'newsletter.pdf'
    }
  } else {
    // Neutral popups have generic elements
    if (elements.hasLogo) {
      elements.logoPath = '/img/generic-logo.png'
    }
    if (elements.hasButton) {
      elements.buttonText = Math.random() > 0.5 ? 'OK' : 'Close'
    }
    if (elements.hasInputField) {
      elements.inputFieldLabel = 'Enter Text'
    }
    if (elements.hasAttachment) {
      elements.attachmentName = 'document.txt'
    }
  }
  
  return elements
}

// Function to transform API popup to match our Popup interface
const transformPopupFromAPI = (apiPopup: any, position = { x: 0, y: 0 }, size = { width: 300, height: 200 }): Popup => {
  // Default style based on popup type
  const defaultStyle = generateRandomStyle(apiPopup.type)
  
  // Map backend close_method to frontend closeMethod
  const closeMethodMap: Record<string, 'click_x' | 'click_x_after_time' | 'click_button' | 'slide_away' | 'run_antivirus' | 'hang_up' | 'drag_to_trash' | 'shake_to_close' | 'solve_puzzle' | 'click_all_iocs' | 'no_action'> = {
    'click_x': 'click_x',
    'click_x_after_time': 'click_x_after_time',
    'click_button': 'click_button',
    'slide_away': 'slide_away',
    'run_antivirus': 'run_antivirus',
    'hang_up': 'hang_up',
    'drag_to_trash': 'drag_to_trash',
    'shake_to_close': 'shake_to_close',
    'solve_puzzle': 'solve_puzzle',
    'click_all_iocs': 'click_all_iocs',
    'no_action': 'no_action'
  }
  
  // Create a popup object that matches our interface
  const popup: Popup = {
    id: apiPopup._id || `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
    title: apiPopup.title,
    message: apiPopup.message,
    type: apiPopup.type,
    position,
    size,
    closeMethod: closeMethodMap[apiPopup.close_method] || getRandomCloseMethod(),
    correctAction: apiPopup.correct_action || (apiPopup.type === 'malicious' ? 'close' : apiPopup.type === 'benign' ? 'click' : 'ignore'),
    style: defaultStyle,
    elements: generateRandomElements(apiPopup.type)
  }
  
  // Add phishing indicators for malicious popups
  if (apiPopup.type === 'malicious') {
    popup.phishingIndicators = generatePhishingIndicators()
    
    // Modify message based on phishing indicators
    if (popup.phishingIndicators.misspellings) {
      popup.message = addMisspellings(popup.message)
    }
    if (popup.phishingIndicators.grammaticalErrors) {
      popup.message = addGrammaticalErrors(popup.message)
    }
    if (popup.phishingIndicators.urgencyLanguage) {
      popup.message = addUrgencyLanguage(popup.message)
    }
  }
  
  // Add hint if available
  if (apiPopup.hint) {
    popup.hint = apiPopup.hint
  }
  
  return popup
}

export default function PopupManicGame() {
  const router = useRouter()
  const [session, setSession] = useState<any>(null)
  const [score, setScore] = useState(0)
  const [level, setLevel] = useState(1)
  const [time, setTime] = useState(60)
  const [gameActive, setGameActive] = useState(false)
  const [gameOver, setGameOver] = useState(false)
  const [popups, setPopups] = useState<Popup[]>([])
  const [mistakes, setMistakes] = useState(0)
  const [showInstructions, setShowInstructions] = useState(true)
  const [activePrograms, setActivePrograms] = useState<string[]>([])
  const [startMenuOpen, setStartMenuOpen] = useState(false)
  const [wifiMenuOpen, setWifiMenuOpen] = useState(false)
  const [wifiStatus, setWifiStatus] = useState<'connected' | 'poor' | 'disconnected'>('connected')
  const [updateWindowOpen, setUpdateWindowOpen] = useState(false)
  const [updatingSoftware, setUpdatingSoftware] = useState(false)
  const [softwareUpdateProgress, setSoftwareUpdateProgress] = useState<{[key: string]: number}>({
    'Firecat Browser': 0,
    'MeowareBytes Antivirus': 0,
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
  
  // Fetch session data on component mount
  useEffect(() => {
    const fetchSession = async () => {
      const sessionData = await getSession()
      setSession(sessionData)
    }
    
    fetchSession()
  }, [])

  // Desktop icons configuration - organized in two columns
  const leftColumnIcons: DesktopIcon[] = [
    {
      name: "Firecat.exe",
      imagePath: "/img/firecat-taskbar.png",
      action: () => {
        console.log("Opening Firecat browser")
        setFirecatOpen(true)
        setActivePrograms(prev => [...prev.includes("firecat") ? prev : [...prev, "firecat"]])
      }
    },
    {
      name: "MeowareBytes - Antivirus.exe",
      imagePath: "/img/meowareBytes-taskbar.png",
      action: () => {
        console.log("Opening MeowareBytes antivirus")
        setActivePrograms(prev => [...prev, "meowarebytes"])
        
        // If there are popups that require running antivirus to close
        const antivirusPopups = popups.filter(p => p.closeMethod === 'run_antivirus')
        if (antivirusPopups.length > 0) {
          antivirusPopups.forEach(popup => {
            handlePopupAction(popup, 'close')
          })
        }
      }
    },
    {
      name: "Notepad.exe",
      imagePath: "/img/notepad-taskbar.png",
      action: () => {
        console.log("Opening Notepad")
        setActivePrograms(prev => [...prev, "notepad"])
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
        setActivePrograms(prev => [...prev.includes("taskmanager") ? prev : [...prev, "taskmanager"]])
        
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
        setActivePrograms(prev => [...prev, "recyclebin"])
        
        // If there are popups that require dragging to trash
        const trashPopups = popups.filter(p => p.closeMethod === 'drag_to_trash')
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
    setTime(60)
    setMistakes(0)
    setGameOver(false)
    setPopups([])
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
    
    setPopups(newPopups)
  }
  
  // Generate a fallback popup when API fails
  const generateFallbackPopup = (): Popup => {
    const type = Math.random() > 0.6 ? 'malicious' : Math.random() > 0.5 ? 'benign' : 'neutral'
    const correctAction = type === 'malicious' ? 'close' : type === 'benign' ? 'click' : 'ignore'
    
    // Create a popup with varied visual style
    const popup: Popup = {
      id: `popup-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      title: getRandomTitle(type),
      message: getRandomMessage(type),
      type,
      position: {
        x: 100 + Math.random() * (window.innerWidth - 500),
        y: 100 + Math.random() * (window.innerHeight - 400)
      },
      size: {
        width: 250 + Math.random() * 150,
        height: 150 + Math.random() * 150
      },
      closeMethod: getRandomCloseMethod(),
      correctAction,
      style: generateRandomStyle(type),
      elements: generateRandomElements(type)
    }
    
    // Add phishing indicators for malicious popups
    if (type === 'malicious') {
      popup.phishingIndicators = generatePhishingIndicators()
      
      // Modify message based on phishing indicators
      if (popup.phishingIndicators.misspellings) {
        popup.message = addMisspellings(popup.message)
      }
      if (popup.phishingIndicators.grammaticalErrors) {
        popup.message = addGrammaticalErrors(popup.message)
      }
      if (popup.phishingIndicators.urgencyLanguage) {
        popup.message = addUrgencyLanguage(popup.message)
      }
    }
    
    return popup
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
        return 'Run MeowareBytes Antivirus to remove this threat'
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
    })
  
    return indicators
  }
  
  // Add grammatical errors to text
  const addGrammaticalErrors = (text: string): string => {
    // Use Record<string, string> to properly type the object with an index signature
    const errorPatterns: Record<string, string> = {
      'We have': 'We has',
      'They have': 'They has',
      'has been': 'have been',
      'is required': 'are required',
      'was detected': 'were detected',
      'Please update': 'Please updating',
      'will be': 'will being',
      'Your account': 'You account',
      'This is': 'This are'
    }
  
    let result = text
    Object.keys(errorPatterns).forEach(pattern => {
      if (text.includes(pattern) && Math.random() > 0.5) {
        // Now TypeScript knows that pattern is a valid key for errorPatterns
        result = result.replace(new RegExp(pattern, 'g'), errorPatterns[pattern])
      }
    })
    
    return result
  }
  
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

  // Handle popup interaction
  const handlePopupAction = (popup: Popup, action: 'click' | 'close' | 'ignore') => {
    // Remove the popup from the list
    setPopups(popups.filter(p => p.id !== popup.id))
    
    // Check if the action was correct
    if (action === popup.correctAction) {
      // Correct action - play correct sound
      playSound(true)
      setScore(score + (level * 10))
      
      // If all popups are handled, generate new ones and increase level
      if (popups.length === 1) {
        setLevel(level + 1)
        generatePopups(level + 1)
      }
    } else {
      // Incorrect action - play wrong sound
      playSound(false)
      setMistakes(mistakes + 1)
      
      // Game over if too many mistakes
      if (mistakes >= 2) {
        setGameOver(true)
        setGameActive(false)
      }
    }
  }

  // Game timer and popup spawner
  useEffect(() => {
    if (gameActive && !gameOver) {
      // Timer to countdown game time
      const timer = setInterval(() => {
        setTime(prevTime => {
          if (prevTime <= 1) {
            clearInterval(timer)
            setGameOver(true)
            return 0
          }
          return prevTime - 1
        })
      }, 1000)
      
      // Spawn new popups periodically based on level
      const popupSpawner = setInterval(() => {
        // Only spawn new popups if we're under the max limit
        if (popups.length < Math.min(level + 2, 8)) { // Max 8 popups at once
          spawnRandomPopup()
        }
      }, Math.max(8000 - level * 1000, 3000)) // Spawn faster as level increases, but not faster than every 3 seconds
      
      return () => {
        clearInterval(timer)
        clearInterval(popupSpawner)
      }
    }
  }, [gameActive, gameOver, level, popups.length])

  // Function to spawn a random popup during gameplay
  const spawnRandomPopup = async () => {
    try {
      // For higher levels, increase the chance of malicious popups
      const popupType = level > 3 ? 
        (Math.random() > 0.3 ? 'malicious' : Math.random() > 0.5 ? 'benign' : 'neutral') : 
        (Math.random() > 0.7 ? 'malicious' : Math.random() > 0.5 ? 'benign' : 'neutral')
      
      // Try to fetch a popup from the API
      const apiPopup = await fetchRandomPopup(popupType)
      
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
        setPopups(prevPopups => [...prevPopups, popup])
      } else {
        // Fallback to generating a random popup if API fetch failed
        const newPopup = generateFallbackPopup()
        setPopups(prevPopups => [...prevPopups, newPopup])
      }
    } catch (error) {
      console.error('Error spawning random popup:', error)
      // Fallback to generating a random popup if API fails
      const newPopup = generateFallbackPopup()
      setPopups(prevPopups => [...prevPopups, newPopup])
    }
  }
  

  

  
  // Puzzle solver
  // State for popup interaction mechanics
  const [puzzleSolved, setPuzzleSolved] = useState<{[key: string]: boolean}>({})
  const [shakeCount, setShakeCount] = useState<{[key: string]: number}>({})
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })
  const [popupTimers, setPopupTimers] = useState<{[key: string]: NodeJS.Timeout}>({})
  const [xButtonVisible, setXButtonVisible] = useState<{[key: string]: boolean}>({})
  const [clickedIoCs, setClickedIoCs] = useState<{[key: string]: string[]}>({})
  const [lastMousePositions, setLastMousePositions] = useState<{[key: string]: {x: number, y: number}[]}>({})

  // Track mouse movement for shake detection
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY })
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  // Update last mouse positions for shake detection
  useEffect(() => {
    // For each popup with shake_to_close method
    popups.forEach(popup => {
      if (popup.closeMethod === 'shake_to_close') {
        setLastMousePositions(prev => {
          const positions = prev[popup.id] || []
          positions.push({ x: mousePosition.x, y: mousePosition.y })
          
          // Keep only the last 10 positions
          if (positions.length > 10) {
            positions.shift()
          }
          
          return { ...prev, [popup.id]: positions }
        })
        
        // Check for shake gesture
        const positions = lastMousePositions[popup.id] || []
        if (positions.length >= 10) {
          let totalMovement = 0
          let directionChanges = 0
          
          for (let i = 1; i < positions.length; i++) {
            const dx = positions[i].x - positions[i-1].x
            totalMovement += Math.abs(dx)
            
            if (i > 1) {
              const prevDx = positions[i-1].x - positions[i-2].x
              if ((dx > 0 && prevDx < 0) || (dx < 0 && prevDx > 0)) {
                directionChanges++
              }
            }
          }
          
          // If there's significant movement and direction changes, count as a shake
          if (totalMovement > 100 && directionChanges >= 3) {
            setShakeCount(prev => {
              const count = (prev[popup.id] || 0) + 1
              
              // If enough shakes, close the popup
              if (count >= 3) {
                handlePopupAction(popup, 'close')
              }
              
              return { ...prev, [popup.id]: count }
            })
            
            // Reset positions after detecting a shake
            setLastMousePositions(prev => ({ ...prev, [popup.id]: [] }))
          }
        }
      }
    })
  }, [mousePosition, popups])

  // Handle no_action popups that close automatically
  useEffect(() => {
    popups.forEach(popup => {
      if (popup.closeMethod === 'no_action' && !popupTimers[popup.id]) {
        const timer = setTimeout(() => {
          // Auto-close after 5 seconds
          handlePopupAction(popup, 'ignore')
        }, 5000)
        
        setPopupTimers(prev => ({ ...prev, [popup.id]: timer }))
      }
      
      // Handle delayed X button appearance
      if (popup.closeMethod === 'click_x_after_time' && !xButtonVisible[popup.id]) {
        const timer = setTimeout(() => {
          setXButtonVisible(prev => ({ ...prev, [popup.id]: true }))
        }, 3000) // Show X button after 3 seconds
        
        setPopupTimers(prev => ({ ...prev, [popup.id]: timer }))
      }
    })
    
    // Cleanup timers when component unmounts or popups change
    return () => {
      Object.values(popupTimers).forEach(timer => clearTimeout(timer))
    }
  }, [popups])

  // Generate popups at regular intervals
  useEffect(() => {
    if (gameActive && !gameOver) {
      const interval = setInterval(() => {
        // Add new popup if there are fewer than the max for the current level
        if (popups.length < Math.min(level + 1, 5)) {
          generatePopups(level)
        }
      }, 5000) // New popup every 5 seconds
      
      return () => clearInterval(interval)
    }
  }, [gameActive, gameOver, level, popups.length])

  // Software update progress simulation
  useEffect(() => {
    if (updatingSoftware) {
      const updateInterval = setInterval(() => {
        setSoftwareUpdateProgress(prev => {
          const newProgress = {...prev}
          let allComplete = true
          
          Object.keys(newProgress).forEach(software => {
            if (newProgress[software] < 100) {
              // Randomly increment by 5-15%
              newProgress[software] = Math.min(100, newProgress[software] + Math.floor(Math.random() * 10) + 5)
              if (newProgress[software] < 100) {
                allComplete = false
              }
            }
          })
          
          if (allComplete) {
            clearInterval(updateInterval)
            setUpdatingSoftware(false)
          }
          
          return newProgress
        })
      }, 800)
      
      return () => clearInterval(updateInterval)
    }
  }, [updatingSoftware])

  // Game initialization
  useEffect(() => {
    // Any game initialization can go here
  }, [])
  
  return (
    <div className="relative w-full h-screen overflow-hidden">
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
      
      {/* Firecat Browser Window */}
      {firecatOpen && (
        <DraggableWindow
          title={`Firecat Browser - ${firecatUrl}`}
          initialPosition={{ x: 150, y: 100 }}
          width={700}
          height={500}
          className="bg-arcade-bg border border-arcade-cyan rounded-md shadow-xl z-40"
          handleClassName="bg-arcade-cyan/30"
          onClose={() => {
            setFirecatOpen(false)
            setActivePrograms(prev => prev.filter(p => p !== 'firecat'))
          }}
          onMinimize={() => {
            setFirecatOpen(false)
          }}
          allowMaximize={true}
        >
          
          {/* Browser toolbar */}
          <div className="bg-gray-800 p-2 flex items-center">
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
            <div className="flex-1 bg-gray-700 rounded p-1 mx-2 text-white font-arcade text-sm">
              {firecatUrl}
            </div>
          </div>
          
          {/* Browser content */}
          <div className="bg-white p-4 h-[400px] overflow-auto relative">
            {firecatUrl === 'https://www.meowgle.com' && (
              <div className="text-black">
                <div className="flex justify-center mb-6">
                  <h1 className="text-3xl font-bold text-blue-500">Meowgle</h1>
                </div>
                <div className="flex justify-center mb-6">
                  <div className="w-[400px] border border-gray-300 rounded-full p-2 flex">
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
                            const randomPopup = transformPopupFromAPI(apiPopup, 
                              { x: Math.random() * 400 + 150, y: Math.random() * 200 + 150 },
                              { width: 350, height: 250 }
                            );
                            
                            // Add the popup to the state
                            setPopups(prev => [...prev, randomPopup]);
                          } else {
                            // Fallback to a default popup if API call fails
                            const fallbackPopup: Popup = {
                              id: `popup-${Date.now()}`,
                              title: 'Claim Your Prize!',
                              message: 'Enter your credit card details to claim your FREE prize worth $1000!',
                              type: 'malicious',
                              position: { x: Math.random() * 400 + 150, y: Math.random() * 200 + 150 },
                              size: { width: 350, height: 250 },
                              closeMethod: 'click_button',
                              correctAction: 'close',
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
                            };
                            setPopups(prev => [...prev, fallbackPopup]);
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
                              // Force size to be appropriate for a cart notification
                              const randomPopup = transformPopupFromAPI(apiPopup, 
                                { x: Math.random() * 400 + 150, y: Math.random() * 200 + 150 },
                                { width: 300, height: 150 }
                              );
                              
                              // Add the popup to the state
                              setPopups(prev => [...prev, randomPopup]);
                            } else {
                              // Fallback to a default popup if API call fails
                              const fallbackPopup: Popup = {
                                id: `popup-${Date.now()}`,
                                title: 'Add to Cart',
                                message: 'Item added to your cart!',
                                type: 'benign',
                                position: { x: Math.random() * 400 + 150, y: Math.random() * 200 + 150 },
                                size: { width: 300, height: 150 },
                                closeMethod: 'click_x',
                                correctAction: 'close',
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
                                elements: {
                                  hasLogo: true,
                                  logoPath: '/img/logos/shopping-cart.png',
                                  hasButton: false
                                }
                              };
                              setPopups(prev => [...prev, fallbackPopup]);
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
            setActivePrograms(prev => prev.filter(p => p !== 'taskmanager'))
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
                    {activePrograms.includes('firecat') && (
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
                              setActivePrograms(prev => prev.filter(p => p !== 'firecat'))
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activePrograms.includes('meowarebytes') && (
                      <div className="grid grid-cols-5 font-arcade text-xs text-white py-1 border-b border-gray-600">
                        <div>MeowareBytes.exe</div>
                        <div>Running</div>
                        <div>22%</div>
                        <div>350 MB</div>
                        <div>
                          <button 
                            className="bg-red-600 text-white px-2 py-0.5 rounded text-xs"
                            onClick={() => {
                              setActivePrograms(prev => prev.filter(p => p !== 'meowarebytes'))
                            }}
                          >
                            End Task
                          </button>
                        </div>
                      </div>
                    )}
                    
                    {activePrograms.includes('updatesoftware') && (
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
                              setActivePrograms(prev => prev.filter(p => p !== 'updatesoftware'))
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
                            setActivePrograms(prev => prev.filter(p => p !== 'taskmanager'))
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
                              setScore(prev => prev + 50)
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
                      <div>{popups.filter(p => p.type === 'malicious').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Benign</div>
                      <div>{popups.filter(p => p.type === 'benign').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Neutral</div>
                      <div>{popups.filter(p => p.type === 'neutral').length}</div>
                    </div>
                    
                    <div className="grid grid-cols-2 font-arcade text-xs text-white py-1 border-b border-gray-600">
                      <div>Total</div>
                      <div>{popups.length}</div>
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
            setActivePrograms(prev => prev.filter(p => p !== 'updatesoftware'))
            if (updatingSoftware) {
              setUpdatingSoftware(false)
              setSoftwareUpdateProgress({
                'Firecat Browser': 0,
                'MeowareBytes Antivirus': 0,
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
                      'MeowareBytes Antivirus': 0,
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
            {activePrograms.includes('firecat') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer ${firecatOpen ? 'bg-arcade-cyan/30' : 'hover:bg-arcade-cyan/20'} p-1 rounded`}
                onClick={() => setFirecatOpen(!firecatOpen)}
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
            
            {activePrograms.includes('updatesoftware') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer ${updateWindowOpen ? 'bg-arcade-cyan/30' : 'hover:bg-arcade-cyan/20'} p-1 rounded`}
                onClick={() => setUpdateWindowOpen(!updateWindowOpen)}
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
            
            {activePrograms.includes('taskmanager') && (
              <div 
                className={`flex items-center justify-center mx-1 cursor-pointer ${taskManagerOpen ? 'bg-arcade-cyan/30' : 'hover:bg-arcade-cyan/20'} p-1 rounded`}
                onClick={() => setTaskManagerOpen(!taskManagerOpen)}
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
          </div>
          
          {/* Start Menu Dropdown */}
          {startMenuOpen && (
            <div className="absolute bottom-full left-0 mb-1 bg-arcade-bg/95 border border-arcade-cyan rounded-t-md w-48 overflow-hidden">
              <div 
                className="p-2 font-arcade text-sm text-arcade-cyan hover:bg-arcade-cyan/20 cursor-pointer"
                onClick={() => router.push('/')}
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
                      
                      // Add the popup to the state
                      setPopups(prev => [...prev, randomPopup]);
                    } else {
                      // Fallback to a default popup if API call fails
                      const fallbackPopup: Popup = {
                        id: `popup-${Date.now()}`,
                        title: 'Windows Update',
                        message: 'Your Windows needs to update. Install now?',
                        type: 'neutral',
                        position: { x: Math.random() * 400 + 100, y: Math.random() * 200 + 100 },
                        size: { width: 300, height: 200 },
                        closeMethod: 'click_button',
                        correctAction: 'close',
                        style: {
                          theme: 'windows',
                          headerColor: '#ffb300',
                          bodyColor: '#ffffff',
                          borderColor: '#d1d1d1',
                          borderWidth: 1,
                          borderRadius: 3,
                          fontFamily: '"Segoe UI", sans-serif',
                          fontSize: '14px',
                          boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)'
                        },
                        elements: {
                          hasLogo: true,
                          logoPath: '/img/logos/microsoft.png',
                          hasButton: true,
                          buttonText: 'Install Updates'
                        }
                      };
                      setPopups(prev => [...prev, fallbackPopup]);
                    }
                  } catch (error) {
                    console.error('Error fetching popup:', error);
                  }
                  
                  setStartMenuOpen(false);
                }}
              >
                Update Windows
              </div>
              <div 
                className="p-2 font-arcade text-sm text-arcade-cyan hover:bg-arcade-cyan/20 cursor-pointer"
                onClick={() => {
                  setUpdateWindowOpen(true)
                  setActivePrograms(prev => [...prev, 'updatesoftware'])
                  setStartMenuOpen(false)
                }}
              >
                Update Software
              </div>
            </div>
          )}
        </div>
        <div className="flex items-center">
          <div className="text-arcade-cyan font-arcade text-xs mr-6">
            <span className="mr-4">SCORE: {score}</span>
            <span className="mr-4">LEVEL: {level}</span>
            <span>MISTAKES: {mistakes}/3</span>
          </div>
          <div className="text-arcade-magenta font-arcade text-xs">
            TIME: {time}s
          </div>
        </div>
      </div>
      
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
              <p className="text-white font-arcade text-xs text-center shadow-black drop-shadow-md group-hover:text-arcade-cyan transition-colors">
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
              <p className="text-white font-arcade text-xs text-center shadow-black drop-shadow-md group-hover:text-arcade-cyan transition-colors">
                {icon.name}
              </p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Game instructions */}
      {showInstructions && (
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
              <p>Some pop-ups require special actions:</p>
              <ul className="text-left list-disc pl-6 space-y-2">
                <li>Use <span className="text-arcade-cyan">MeowareBytes</span> to remove virus pop-ups</li>
                <li>Drag some pop-ups to the <span className="text-arcade-cyan">Recycle Bin</span></li>
                <li>Use <span className="text-arcade-cyan">Task Manager</span> to close frozen programs</li>
              </ul>
              <p>You have 60 seconds and can make up to 3 mistakes. Each level gets faster and more challenging!</p>
            </div>
            <button 
              onClick={startGame}
              className="font-arcade text-lg px-8 py-3 bg-arcade-magenta text-black rounded hover:bg-arcade-cyan hover:text-white transition-colors"
            >
              START GAME
            </button>
          </motion.div>
        </div>
      )}

      {/* Game over screen */}
      {gameOver && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 z-50">
          <motion.div 
            className="bg-arcade-bg border-2 border-arcade-red p-8 rounded-lg max-w-md text-center shadow-lg shadow-arcade-red/30"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <h2 className="text-arcade-red font-arcade text-2xl mb-4 glow-heading-pink">SYSTEM CRASH</h2>
            <div className="text-gray-300 font-terminal text-lg mb-6">
              <p className="mb-2">Final Score: {score}</p>
              <p>Level Reached: {level}</p>
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

      {/* Popups */}
      {popups.map((popup) => (
        <motion.div
          key={popup.id}
          className="absolute z-40 overflow-hidden"
          style={{
            left: popup.position.x,
            top: popup.position.y,
            width: popup.size.width,
            height: popup.size.height,
            borderRadius: `${popup.style.borderRadius}px`,
            border: `${popup.style.borderWidth}px solid ${popup.style.borderColor}`,
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
              (popup.closeMethod === 'click_x_after_time' && xButtonVisible[popup.id])) && (
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
          
          {/* Popup content with dynamic styling */}
          <div 
            className="p-4 overflow-auto"
            style={{ 
              backgroundColor: popup.style.bodyColor,
              color: popup.type === 'malicious' && popup.phishingIndicators?.poorFormatting ? 'red' : 'black',
              textAlign: popup.type === 'malicious' && popup.phishingIndicators?.poorFormatting ? 'justify' : 'left'
            }}
          >
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
            {popup.closeMethod === 'solve_puzzle' && !puzzleSolved[popup.id] && (
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
                          ${puzzleSolved[`${popup.id}-${i}`] ? 'bg-green-500 text-white' : 'bg-gray-200'}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (isTarget) {
                            // Mark this cell as solved
                            setPuzzleSolved(prev => ({
                              ...prev,
                              [`${popup.id}-${i}`]: true
                            }));
                            
                            // Check if all target cells are solved
                            const allSolved = [0, 2, 4, 6, 8].every(idx => 
                              puzzleSolved[`${popup.id}-${idx}`]);
                            
                            if (allSolved) {
                              setPuzzleSolved(prev => ({
                                ...prev,
                                [popup.id]: true
                              }));
                              // Allow popup to be closed now
                            }
                          } else {
                            // Wrong cell - reset puzzle
                            [0, 2, 4, 6, 8].forEach(idx => {
                              setPuzzleSolved(prev => ({
                                ...prev,
                                [`${popup.id}-${idx}`]: false
                              }));
                            });
                          }
                        }}
                      >
                        {puzzleSolved[`${popup.id}-${i}`] ? '✓' : ''}
                      </div>
                    );
                  })}
                </div>
                <p className="text-xs text-center text-gray-500">
                  {puzzleSolved[popup.id] ? 'Puzzle completed! You can now close this popup.' : 'Click the correct pattern to continue'}
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
                      className={`text-blue-600 underline cursor-pointer ${clickedIoCs[popup.id]?.includes('url') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedIoCs(prev => ({
                          ...prev,
                          [popup.id]: [...(prev[popup.id] || []), 'url']
                        }));
                      }}
                    >
                      https://{popup.title.toLowerCase().replace(/\s+/g, '')}.{Math.random().toString(36).substring(2, 5)}.com
                    </span>
                  )}
                  
                  {/* Suspicious attachment */}
                  {popup.elements?.hasAttachment && popup.elements.attachmentName?.includes('.exe') && (
                    <div 
                      className={`flex items-center mt-2 cursor-pointer ${clickedIoCs[popup.id]?.includes('attachment') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedIoCs(prev => ({
                          ...prev,
                          [popup.id]: [...(prev[popup.id] || []), 'attachment']
                        }));
                      }}
                    >
                      <span className="text-sm">📎</span>
                      <span className="ml-1 text-sm text-blue-600 underline">{popup.elements.attachmentName}</span>
                    </div>
                  )}
                  
                  {/* Suspicious sender */}
                  {popup.type === 'malicious' && (
                    <div 
                      className={`mt-2 text-sm ${clickedIoCs[popup.id]?.includes('sender') ? 'line-through text-gray-400' : ''}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setClickedIoCs(prev => ({
                          ...prev,
                          [popup.id]: [...(prev[popup.id] || []), 'sender']
                        }));
                      }}
                    >
                      <span className="text-gray-600">From: </span>
                      <span className="cursor-pointer">security-alert@{Math.random().toString(36).substring(2, 8)}.net</span>
                    </div>
                  )}
                </div>
                
                {/* Progress indicator */}
                <div className="text-xs text-gray-600">
                  IoCs found: {clickedIoCs[popup.id]?.length || 0}/3
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
                      className={`px-4 py-2 rounded text-sm text-white flex items-center ${activePrograms.includes('meowarebytes') ? 'bg-green-500 hover:bg-green-600' : 'bg-gray-400'}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        // This requires the user to open MeowareBytes
                        if (activePrograms.includes('meowarebytes')) {
                          handlePopupAction(popup, 'close')
                        } else {
                          // Hint that they need to use the antivirus
                          playSound(false) // Play error sound
                          alert('You need to run MeowareBytes Antivirus first!')
                        }
                      }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                      </svg>
                      {activePrograms.includes('meowarebytes') ? 'Remove Threat' : 'Run Antivirus First'}
                    </button>
                  </div>
                  
                  <div className="text-xs text-center mt-2 text-gray-500">
                    Open MeowareBytes Antivirus from the desktop or taskbar
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
      ))}

      {/* Removed trash bin for drag_to_trash popups */}
    </div>
  )
}
