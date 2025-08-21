"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { resetGameProgression } from '../../utils/game-progression'

interface QuizQuestion {
  id: number
  question: string
  type: 'multiple_choice' | 'true_false' | 'select_all' | 'matching' | 'drag_drop' | 'popup_ui' | 'vishing_audio'
  options: string[]
  correctAnswer: number | number[] | {[key: string]: string}
  explanation: string
  category: 'popup_manic' | 'phish404' | 'phish_hunt' | 'hooked_or_cooked' | 'general_security'
  gameSource?: string
  difficulty: 'easy' | 'medium' | 'hard'
  audioFile?: string
  popupContent?: {
    title: string
    message: string
    buttons: string[]
    style: 'warning' | 'error' | 'info' | 'scam'
  }
  dragItems?: string[]
  dropZones?: string[]
}

interface PlayerStats {
  level: number
  accuracy: number
  gamesCompleted: string[]
  totalScore: number
}

// Enhanced quiz questions covering all 4 games with diverse question types
const QUIZ_QUESTIONS: QuizQuestion[] = [
  // POPUP UI QUESTION
  {
    id: 1,
    question: "What is the most appropriate action for this popup?",
    type: 'popup_ui',
    options: [
      "Click 'Download Now' to fix the issue",
      "Close the popup using the X button",
      "Force close the browser (Ctrl+Alt+Del)",
      "Call the phone number provided"
    ],
    correctAnswer: 2,
    explanation: "This is a scareware popup. The safest action is to force close the browser to avoid clicking any malicious elements.",
    category: 'popup_manic',
    gameSource: 'Popup Manic Training',
    difficulty: 'medium',
    popupContent: {
      title: "⚠️ CRITICAL SECURITY ALERT ⚠️",
      message: "Your computer is infected with 47 viruses! Your personal data is at risk. Download our security software immediately or call 1-800-SCAM-NOW for immediate assistance.",
      buttons: ["Download Now", "Call Support", "Ignore (Unsafe)"],
      style: 'scam'
    }
  },
  // VISHING AUDIO QUESTION
  {
    id: 2,
    question: "Listen to this voice call. What type of social engineering attack is this?",
    type: 'vishing_audio',
    options: [
      "Legitimate bank security call",
      "Vishing (voice phishing) attempt",
      "Technical support scam",
      "Survey or marketing call"
    ],
    correctAnswer: 1,
    explanation: "This is a vishing attempt. Legitimate banks never ask for full account details over unsolicited calls.",
    category: 'phish404',
    gameSource: 'Phish404 Vishing Training',
    difficulty: 'medium',
    // Audio will be fetched from API
  },
  // DRAG AND DROP PHISHING INTENT
  {
    id: 3,
    question: "Match each email to its primary phishing intent:",
    type: 'drag_drop',
    options: [],
    correctAnswer: {
      "Urgent: Account will be closed in 24 hours": "Credential Harvesting",
      "You've won $500,000! Download attachment to claim": "Malware Delivery",
      "Invoice overdue - please wire transfer immediately": "Financial Fraud",
      "CEO needs you to buy gift cards for client meeting": "Business Email Compromise"
    },
    explanation: "Each email type has a specific malicious intent. Recognizing these patterns helps identify threats.",
    category: 'phish404',
    gameSource: 'Email Dataset Analysis',
    difficulty: 'hard',
    dragItems: [
      "Urgent: Account will be closed in 24 hours",
      "You've won $500,000! Download attachment to claim",
      "Invoice overdue - please wire transfer immediately",
      "CEO needs you to buy gift cards for client meeting"
    ],
    dropZones: [
      "Credential Harvesting",
      "Malware Delivery",
      "Financial Fraud",
      "Business Email Compromise"
    ]
  },
  // SELECT ALL THAT APPLY WITH CHECKBOXES
  {
    id: 4,
    question: "Which of the following are red flags in phishing emails? (Select all that apply)",
    type: 'select_all',
    options: [
      "Urgent language demanding immediate action",
      "Generic greetings like 'Dear Customer'",
      "Misspelled domain names (e.g., 'gooogle.com')",
      "Professional company letterhead",
      "Requests for personal information via email",
      "Links that don't match the claimed destination"
    ],
    correctAnswer: [0, 1, 2, 4, 5],
    explanation: "Professional letterhead alone doesn't indicate legitimacy. All other options are common phishing red flags.",
    category: 'phish404',
    gameSource: 'Phish404 Email Training',
    difficulty: 'medium'
  },
  {
    id: 5,
    question: "True or False: All popups claiming to be from Microsoft are legitimate if they have the Microsoft logo.",
    type: 'true_false',
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "False. Logos can be easily copied. Legitimate Microsoft alerts come through Windows Security Center, not web popups.",
    category: 'popup_manic',
    gameSource: 'Popup Manic Training',
    difficulty: 'easy'
  },
  {
    id: 3,
    question: "Select ALL popup characteristics that indicate malicious intent:",
    type: 'select_all',
    options: [
      "Creates sense of urgency (\"Act now!\")",
      "Claims to scan your computer",
      "Asks for personal information",
      "Provides official support phone numbers",
      "Uses scare tactics about viruses",
      "Offers free software downloads"
    ],
    correctAnswer: [0, 1, 2, 4, 5],
    explanation: "Malicious popups use urgency, fake scans, request personal info, use scare tactics, and offer suspicious downloads.",
    category: 'popup_manic',
    gameSource: 'Popup Manic Training',
    difficulty: 'hard'
  },
  
  // PHISH404 QUESTIONS (Email & Voice)
  {
    id: 4,
    question: "What is the primary red flag in this email: 'Your PayPal account has been temporarily suspended due to suspicious activity. Click here to verify your identity immediately or your account will be permanently closed within 24 hours.'",
    type: 'multiple_choice',
    options: [
      "Poor grammar and spelling",
      "Urgency and threat of account closure",
      "Lack of personalization",
      "All of the above"
    ],
    correctAnswer: 3,
    explanation: "This email combines urgency, threats, and generic language - all classic phishing indicators from our email dataset.",
    category: 'phish404',
    gameSource: 'Phish404 Email Dataset',
    difficulty: 'medium'
  },
  {
    id: 5,
    question: "True or False: Voice calls claiming to be from your bank asking for account verification are always legitimate if they know some of your personal details.",
    type: 'true_false',
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "False. Vishing attackers often have some personal details from data breaches. Always hang up and call the official number.",
    category: 'phish404',
    gameSource: 'Phish404 Voice Call System',
    difficulty: 'easy'
  },
  {
    id: 6,
    question: "Match the phishing technique with its description:",
    type: 'matching',
    options: [
      "Business Email Compromise|CEO requests urgent wire transfer",
      "Credential Harvesting|Fake login page steals passwords",
      "Malware Delivery|Malicious attachment installs virus",
      "Homoglyph Spoofing|g00gle.com instead of google.com"
    ],
    correctAnswer: {
      "Business Email Compromise": "CEO requests urgent wire transfer",
      "Credential Harvesting": "Fake login page steals passwords",
      "Malware Delivery": "Malicious attachment installs virus",
      "Homoglyph Spoofing": "g00gle.com instead of google.com"
    },
    explanation: "Each technique targets different vulnerabilities: authority (BEC), credentials, system infection, and visual deception.",
    category: 'phish404',
    gameSource: 'Phish404 Email Dataset',
    difficulty: 'hard'
  },
  
  // PHISH HUNT QUESTIONS
  {
    id: 7,
    question: "In the Phish Hunt game, what should you do when you see a suspicious email flying across the screen?",
    type: 'multiple_choice',
    options: [
      "Ignore it and let it fly away",
      "Click on it first to read the content, then decide whether to shoot",
      "Shoot it immediately without reading",
      "Report it to authorities first"
    ],
    correctAnswer: 1,
    explanation: "Best practice is to examine the email content first (click to read) then make an informed decision to shoot or let pass.",
    category: 'phish_hunt',
    gameSource: 'Phish Hunt Gameplay',
    difficulty: 'medium'
  },
  {
    id: 8,
    question: "True or False: In real-world email security, speed is more important than accuracy when identifying phishing emails.",
    type: 'true_false',
    options: ["True", "False"],
    correctAnswer: 1,
    explanation: "False. While response time matters, accuracy is crucial. A false positive (blocking legitimate email) can be as problematic as missing a real threat.",
    category: 'phish_hunt',
    gameSource: 'Phish Hunt Training Principles',
    difficulty: 'medium'
  },
  
  // HOOKED OR COOKED QUESTIONS
  {
    id: 9,
    question: "Based on the Hooked or Cooked email dataset, which sender domain is most suspicious?",
    type: 'multiple_choice',
    options: [
      "updates@github.com",
      "security@fakebank.com",
      "events@meetup.com",
      "friend@example.com"
    ],
    correctAnswer: 1,
    explanation: "'security@fakebank.com' uses a generic domain name that impersonates a bank, a classic phishing tactic.",
    category: 'hooked_or_cooked',
    gameSource: 'Hooked or Cooked Email Dataset',
    difficulty: 'easy'
  },
  {
    id: 10,
    question: "Select ALL attachment types that should be treated with extreme caution:",
    type: 'select_all',
    options: [
      ".exe (executable files)",
      ".pdf (document files)",
      ".zip (compressed files)",
      ".jpg (image files)",
      ".docm (macro-enabled documents)",
      ".txt (text files)"
    ],
    correctAnswer: [0, 2, 4],
    explanation: "Executable files (.exe), compressed files (.zip), and macro-enabled documents (.docm) can contain malicious code.",
    category: 'hooked_or_cooked',
    gameSource: 'Hooked or Cooked Attachment Analysis',
    difficulty: 'hard'
  },
  
  // ADVANCED CROSS-GAME QUESTIONS
  {
    id: 11,
    question: "Match the attack vector with the game that best trains against it:",
    type: 'matching',
    options: [
      "Malicious Popups|Popup Manic",
      "Email Phishing|Phish404",
      "Fast-paced Threat Detection|Phish Hunt",
      "Link and Attachment Analysis|Hooked or Cooked"
    ],
    correctAnswer: {
      "Malicious Popups": "Popup Manic",
      "Email Phishing": "Phish404",
      "Fast-paced Threat Detection": "Phish Hunt",
      "Link and Attachment Analysis": "Hooked or Cooked"
    },
    explanation: "Each game focuses on specific attack vectors to provide comprehensive cybersecurity training.",
    category: 'general_security',
    gameSource: 'Cross-Game Analysis',
    difficulty: 'medium'
  },
  {
    id: 12,
    question: "True or False: The techniques learned in these 4 games cover the majority of common cybersecurity threats faced by individuals and organizations.",
    type: 'true_false',
    options: ["True", "False"],
    correctAnswer: 0,
    explanation: "True. Popup/malware, email phishing, voice calls, and attachment analysis cover most common attack vectors.",
    category: 'general_security',
    gameSource: 'Comprehensive Training Assessment',
    difficulty: 'easy'
  },
  
  // REAL-WORLD APPLICATION QUESTIONS
  {
    id: 13,
    question: "You receive an email with subject 'CEO Request: Urgent Wire Transfer' asking you to process a $10,000 transfer by EOD. What should you do?",
    type: 'multiple_choice',
    options: [
      "Process it immediately since it's from the CEO",
      "Call the CEO directly to verify the request",
      "Reply to the email asking for confirmation",
      "Forward it to the finance team"
    ],
    correctAnswer: 1,
    explanation: "This is a classic Business Email Compromise attack. Always verify high-stakes requests through a separate communication channel.",
    category: 'phish404',
    gameSource: 'Phish404 BEC Training',
    difficulty: 'medium'
  },
  {
    id: 14,
    question: "Select ALL indicators that an email link might be malicious:",
    type: 'select_all',
    options: [
      "URL shorteners (bit.ly, tinyurl)",
      "Misspelled domains (g00gle.com)",
      "HTTP instead of HTTPS",
      "Hover text doesn't match display text",
      "Links to official company websites",
      "Suspicious top-level domains (.tk, .ml)"
    ],
    correctAnswer: [0, 1, 2, 3, 5],
    explanation: "URL shorteners, misspelled domains, HTTP, mismatched hover text, and suspicious TLDs are all red flags.",
    category: 'hooked_or_cooked',
    gameSource: 'Hooked or Cooked Link Analysis',
    difficulty: 'hard'
  },
  {
    id: 15,
    question: "What is the most effective defense against the social engineering techniques demonstrated across all 4 games?",
    type: 'multiple_choice',
    options: [
      "Installing the latest antivirus software",
      "Using complex passwords",
      "Developing a healthy skepticism and verification habits",
      "Avoiding all email and web browsing"
    ],
    correctAnswer: 2,
    explanation: "While technical defenses help, developing skepticism and verification habits is the most effective defense against social engineering.",
    category: 'general_security',
    gameSource: 'Comprehensive Training Synthesis',
    difficulty: 'medium'
  },
  {
    id: 2,
    question: "Which of these is a red flag for a phishing website?",
    options: [
      "HTTPS encryption",
      "Misspelled domain name (e.g., 'gooogle.com')",
      "Professional design",
      "Contact information provided"
    ],
    correctAnswer: 1,
    explanation: "Misspelled domain names are a common tactic used by phishers to impersonate legitimate websites.",
    category: 'phish404',
    type: 'multiple_choice',
    gameSource: 'Phish404 Training',
    difficulty: 'medium'
  },
  {
    id: 3,
    question: "What should you do if you receive an unexpected attachment?",
    options: [
      "Open it immediately to see what it is",
      "Scan it with antivirus before opening",
      "Verify with the sender before opening and scan with antivirus",
      "Delete it without checking"
    ],
    correctAnswer: 2,
    explanation: "Always verify unexpected attachments with the sender through a separate channel and scan with antivirus before opening.",
    category: 'hooked_or_cooked',
    type: 'multiple_choice',
    gameSource: 'Hooked or Cooked Training',
    difficulty: 'medium'
  },
  {
    id: 5,
    question: "What is social engineering in cybersecurity?",
    options: [
      "Building secure network infrastructure",
      "Manipulating people to divulge confidential information",
      "Creating user-friendly software interfaces",
      "Developing social media platforms"
    ],
    correctAnswer: 1,
    explanation: "Social engineering involves manipulating people psychologically to reveal confidential information or perform actions that compromise security.",
    category: 'general_security',
    type: 'multiple_choice',
    gameSource: 'Comprehensive Training',
    difficulty: 'medium'
  },
  {
    id: 7,
    question: "What should you do if a caller claims to be from your bank and asks for account details?",
    options: [
      "Provide the information if they know some of your details",
      "Ask them to call back later",
      "Hang up and call your bank directly using the official number",
      "Ask for their employee ID number"
    ],
    correctAnswer: 2,
    explanation: "Never provide sensitive information to unsolicited callers. Always hang up and call the official number to verify.",
    category: 'phish404',
    type: 'multiple_choice',
    gameSource: 'Phish404 Vishing Training',
    difficulty: 'medium'
  },
  {
    id: 9,
    question: "What is the safest way to download software?",
    options: [
      "From any website that offers it for free",
      "From the official website or trusted app stores",
      "From peer-to-peer sharing networks",
      "From email attachments"
    ],
    correctAnswer: 1,
    explanation: "Always download software from official sources or trusted app stores to avoid malware.",
    category: 'general_security',
    type: 'multiple_choice',
    gameSource: 'General Security Training',
    difficulty: 'easy'
  },
  {
    id: 11,
    question: "What should you do if you accidentally click on a suspicious link?",
    options: [
      "Continue browsing to see what happens",
      "Immediately close the browser and run antivirus scan",
      "Enter your password to 'verify' your identity",
      "Download any suggested security software"
    ],
    correctAnswer: 1,
    explanation: "Close the browser immediately and run a security scan to check for any potential threats.",
    category: 'general_security',
    type: 'multiple_choice',
    gameSource: 'General Security Training',
    difficulty: 'medium'
  },
  {
    id: 12,
    question: "Which email subject line is most likely to be a phishing attempt?",
    options: [
      "Monthly newsletter from your subscribed service",
      "URGENT: Your account will be closed in 24 hours!",
      "Meeting reminder for tomorrow",
      "Receipt for your recent purchase"
    ],
    correctAnswer: 1,
    explanation: "Urgent, threatening subject lines are designed to create panic and bypass rational thinking.",
    category: 'phish404',
    type: 'multiple_choice',
    gameSource: 'Phish404 Email Training',
    difficulty: 'easy'
  },
  {
    id: 13,
    question: "What is two-factor authentication (2FA)?",
    options: [
      "Using two different passwords",
      "Logging in from two different devices",
      "Using password plus a second verification method",
      "Having two user accounts"
    ],
    correctAnswer: 2,
    explanation: "2FA requires something you know (password) plus something you have (phone, token) or something you are (biometric).",
    category: 'general_security',
    type: 'multiple_choice',
    gameSource: 'General Security Training',
    difficulty: 'medium'
  },
  {
    id: 14,
    question: "Which behavior indicates a potentially compromised computer?",
    options: [
      "Fast internet connection",
      "Unexpected pop-ups and slow performance",
      "Regular software updates",
      "Strong WiFi signal"
    ],
    correctAnswer: 1,
    explanation: "Unexpected pop-ups, slow performance, and unusual network activity often indicate malware infection.",
    category: 'popup_manic',
    type: 'multiple_choice',
    gameSource: 'Popup Manic Training',
    difficulty: 'medium'
  },
  {
    id: 15,
    question: "What is the best response to a 'You've won a prize!' popup?",
    options: [
      "Click to claim your prize immediately",
      "Provide personal information to verify eligibility",
      "Close the popup without clicking anything",
      "Share it with friends so they can win too"
    ],
    correctAnswer: 2,
    explanation: "Prize popups are almost always scams. Close them without clicking anything to avoid malware or scams.",
    category: 'popup_manic',
    type: 'multiple_choice',
    gameSource: 'Popup Manic Training',
    difficulty: 'easy'
  }
]

export function FinalQuiz() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswers, setSelectedAnswers] = useState<(number | number[])[]>(new Array(QUIZ_QUESTIONS.length).fill(-1))
  const [showResults, setShowResults] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(1200) // 20 minutes for more complex questions
  const [playerStats, setPlayerStats] = useState<PlayerStats>({
    level: 1,
    accuracy: 0,
    gamesCompleted: [],
    totalScore: 0
  })
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeStarted] = useState(Date.now())
  const [showExplanation, setShowExplanation] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<number | number[] | null>(null)
  const [userAnswers, setUserAnswers] = useState<(number | number[])[]>(new Array(QUIZ_QUESTIONS.length).fill(-1))
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())
  const [draggedItems, setDraggedItems] = useState<{[key: string]: string}>({})
  const [audioPlaying, setAudioPlaying] = useState(false)
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null)
  const [dragFeedback, setDragFeedback] = useState<{[key: string]: 'correct' | 'incorrect' | null}>({})
  const [showDragFeedback, setShowDragFeedback] = useState(false)
  const [vishingCall, setVishingCall] = useState<any>(null)
  const [loadingAudio, setLoadingAudio] = useState(false)

  const currentQ = QUIZ_QUESTIONS[currentQuestion]
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1

  // Fetch and play vishing call from database
  const fetchAndPlayVishingCall = async () => {
    if (currentAudio) {
      currentAudio.pause()
      setAudioPlaying(false)
    }
    
    setLoadingAudio(true)
    
    try {
      // Fetch random vishing call from API
      const response = await fetch('/api/voice/random')
      if (!response.ok) {
        throw new Error(`Failed to fetch vishing call: ${response.status}`)
      }
      
      const result = await response.json()
      console.log('Fetched vishing call result:', result)
      
      // Extract call data from response
      const callData = result.data || result
      setVishingCall(callData)
      
      // Try to play the audio file
      if (callData.audioFile) {
        try {
          const audio = new Audio()
          
          // Set up event handlers before setting src
          audio.onloadstart = () => console.log('Audio loading...')
          audio.oncanplay = () => {
            console.log('Audio ready to play')
            setLoadingAudio(false)
          }
          audio.onplay = () => {
            setAudioPlaying(true)
            console.log('Audio playing')
          }
          audio.onended = () => {
            setAudioPlaying(false)
            console.log('Audio ended')
          }
          audio.onerror = (e) => {
            setAudioPlaying(false)
            setLoadingAudio(false)
            console.error('Audio error:', e)
            // Fallback: show text transcript
            showVishingTranscript(callData)
          }
          
          // Set source and load
          audio.src = callData.audioFile
          audio.load()
          
          setCurrentAudio(audio)
          
          // Try to play with better error handling
          const playPromise = audio.play()
          if (playPromise !== undefined) {
            playPromise.catch((error) => {
              console.error('Audio play failed:', error)
              setAudioPlaying(false)
              setLoadingAudio(false)
              showVishingTranscript(callData)
            })
          }
        } catch (error) {
          console.error('Audio setup failed:', error)
          setLoadingAudio(false)
          showVishingTranscript(callData)
        }
      } else {
        // No audio file, show transcript
        setLoadingAudio(false)
        showVishingTranscript(callData)
      }
    } catch (error) {
      console.error('Error fetching vishing call:', error)
      setLoadingAudio(false)
      // Fallback to sample vishing call data
      const sampleCall = {
        transcript: 'Hello, this is your bank security department. We noticed suspicious activity on your account. Please provide your account number and PIN to verify your identity immediately.',
        isVishing: true,
        content: 'Sample vishing call - requests sensitive information with urgency tactics'
      }
      setVishingCall(sampleCall)
      showVishingTranscript(sampleCall)
    }
  }
  
  const showVishingTranscript = (callData: any) => {
    const transcript = callData.transcript || callData.content || 'Sample vishing call transcript not available'
    alert(`Vishing Call Transcript:\n\n"${transcript}"\n\nThis is a ${callData.isVishing ? 'malicious vishing' : 'legitimate'} call.`)
  }
  
  const stopAudio = () => {
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      setAudioPlaying(false)
    }
  }

  // Handle drag and drop
  const handleDragStart = (e: React.DragEvent, item: string) => {
    e.dataTransfer.setData('text/plain', item)
  }

  const handleDrop = (e: React.DragEvent, zone: string) => {
    e.preventDefault()
    const item = e.dataTransfer.getData('text/plain')
    if (item) {
      // Remove item from other zones first
      const newDraggedItems = { ...draggedItems }
      Object.keys(newDraggedItems).forEach(key => {
        if (newDraggedItems[key] === item) {
          delete newDraggedItems[key]
        }
      })
      // Add to new zone
      newDraggedItems[zone] = item
      setDraggedItems(newDraggedItems)
      
      // Clear any previous feedback when user makes changes
      if (showDragFeedback) {
        setShowDragFeedback(false)
        setDragFeedback({})
      }
    }
  }
  
  const validateDragAndDrop = () => {
    const correctMatches = currentQ.correctAnswer as {[key: string]: string}
    const feedback: {[key: string]: 'correct' | 'incorrect' | null} = {}
    let allCorrect = true
    
    // Check each drop zone
    Object.keys(correctMatches).forEach(email => {
      const correctIntent = correctMatches[email]
      const userPlacement = draggedItems[correctIntent]
      
      if (userPlacement === email) {
        feedback[correctIntent] = 'correct'
      } else {
        feedback[correctIntent] = 'incorrect'
        allCorrect = false
      }
    })
    
    setDragFeedback(feedback)
    setShowDragFeedback(true)
    
    return allCorrect
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  useEffect(() => {
    setQuestionStartTime(Date.now())
  }, [currentQuestion])

  const handleAnswerSelect = (answerIndex: number | number[]) => {
    const newAnswers = [...selectedAnswers]
    newAnswers[currentQuestion] = answerIndex
    setSelectedAnswers(newAnswers)
  }

  const handleMultipleSelect = (optionIndex: number) => {
    const currentAnswers = Array.isArray(selectedAnswers[currentQuestion]) 
      ? selectedAnswers[currentQuestion] as number[] 
      : []
    const newAnswers = [...selectedAnswers]
    
    if (currentAnswers.includes(optionIndex)) {
      newAnswers[currentQuestion] = currentAnswers.filter(i => i !== optionIndex)
    } else {
      newAnswers[currentQuestion] = [...currentAnswers, optionIndex]
    }
    setSelectedAnswers(newAnswers)
  }

  const handleSubmitAnswer = () => {
    // Handle drag-and-drop validation
    if (currentQ.type === 'drag_drop') {
      if (Object.keys(draggedItems).length === 0) return
      
      const isCorrect = validateDragAndDrop()
      
      if (isCorrect) {
        // Correct - proceed to next question
        setSelectedAnswer(1)
        setShowExplanation(true)
        const newAnswers = [...userAnswers]
        newAnswers[currentQuestion] = 1
        setUserAnswers(newAnswers)
        setScore(score + 1)
        
        setTimeout(() => {
          if (isLastQuestion) {
            setQuizCompleted(true)
          } else {
            setCurrentQuestion(currentQuestion + 1)
            setSelectedAnswer(null)
            setShowExplanation(false)
            setQuestionStartTime(Date.now())
            setDraggedItems({})
            setDragFeedback({})
            setShowDragFeedback(false)
          }
        }, 3000)
      }
      // If incorrect, just show feedback - don't advance
      return
    }
    
    // Handle other question types
    const currentAnswer = selectedAnswers[currentQuestion]
    if (currentAnswer === null || currentAnswer === undefined || currentAnswer === -1) return
    
    setSelectedAnswer(currentAnswer as number)
    setShowExplanation(true)
    const newAnswers = [...userAnswers]
    newAnswers[currentQuestion] = currentAnswer
    setUserAnswers(newAnswers)

    // Check if answer is correct
    let isCorrect = false
    if (currentQ.type === 'select_all') {
      const correctAnswers = currentQ.correctAnswer as number[]
      const userAnswer = currentAnswer as number[]
      if (Array.isArray(userAnswer) && Array.isArray(correctAnswers)) {
        const sortedCorrect = [...correctAnswers].sort()
        const sortedUser = [...userAnswer].sort()
        isCorrect = JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser)
      }
    } else {
      isCorrect = currentAnswer === currentQ.correctAnswer
    }
    
    if (isCorrect) {
      setScore(score + 1)
    }

    // Auto-advance after showing explanation
    setTimeout(() => {
      if (isLastQuestion) {
        setQuizCompleted(true)
      } else {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowExplanation(false)
        setQuestionStartTime(Date.now())
      }
    }, 4000)
  }

  const getScoreGrade = () => {
    const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100)
    if (percentage >= 90) return { grade: 'A', color: 'text-green-400', message: 'Excellent! You have mastered cybersecurity fundamentals!' }
    if (percentage >= 80) return { grade: 'B', color: 'text-blue-400', message: 'Great job! You have strong cybersecurity knowledge.' }
    if (percentage >= 70) return { grade: 'C', color: 'text-yellow-400', message: 'Good work! Consider reviewing some security concepts.' }
    if (percentage >= 60) return { grade: 'D', color: 'text-orange-400', message: 'You\'re learning! Practice more to improve your security awareness.' }
    return { grade: 'F', color: 'text-red-400', message: 'Keep practicing! Cybersecurity skills need more development.' }
  }

  const handleRetakeQuiz = () => {
    setCurrentQuestion(0)
    setSelectedAnswer(null)
    setUserAnswers([])
    setShowExplanation(false)
    setQuizCompleted(false)
    setScore(0)
  }

  const handleBackToMenu = () => {
    resetGameProgression()
    router.push('/')
  }

  const calculateScore = () => {
    let correct = 0
    userAnswers.forEach((answer, index) => {
      const question = QUIZ_QUESTIONS[index]
      
      if (question.type === 'select_all') {
        // Check if arrays match
        const correctAnswers = question.correctAnswer as number[]
        const userAnswer = answer as number[]
        if (Array.isArray(userAnswer) && Array.isArray(correctAnswers)) {
          const sortedCorrect = [...correctAnswers].sort()
          const sortedUser = [...userAnswer].sort()
          if (JSON.stringify(sortedCorrect) === JSON.stringify(sortedUser)) {
            correct++
          }
        }
      } else if (question.type === 'drag_drop') {
        // Check drag-drop matches
        const correctMatches = question.correctAnswer as {[key: string]: string}
        const userMatches = draggedItems
        let isCorrect = true
        
        for (const [email, intent] of Object.entries(correctMatches)) {
          if (userMatches[intent] !== email) {
            isCorrect = false
            break
          }
        }
        
        if (isCorrect) correct++
      } else {
        // Standard comparison for other question types
        if (answer === question.correctAnswer) {
          correct++
        }
      }
    })
    return correct
  }

  if (quizCompleted) {
    const { grade, color, message } = getScoreGrade()
    const percentage = Math.round((score / QUIZ_QUESTIONS.length) * 100)
    const timeElapsed = Math.round((Date.now() - timeStarted) / 1000)

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-800 border-2 border-arcade-cyan rounded-lg p-8 max-w-2xl w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="text-6xl mb-6"
          >
            🎓
          </motion.div>

          <h1 className="text-4xl font-arcade text-arcade-cyan mb-4 glow-heading">
            Assessment Complete!
          </h1>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className={`text-4xl font-arcade ${color} mb-2`}>{grade}</div>
              <div className="text-lg font-terminal text-gray-300">{score}/{QUIZ_QUESTIONS.length}</div>
              <div className="text-sm font-terminal text-gray-400">({percentage}%)</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-6 border border-gray-700">
              <div className="text-4xl font-arcade text-arcade-magenta mb-2">⏱️</div>
              <div className="text-lg font-terminal text-gray-300">{Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, '0')}</div>
              <div className="text-sm font-terminal text-gray-400">Time</div>
            </div>
          </div>

          <p className="text-xl font-terminal text-gray-300 mb-8">
            {message}
          </p>

          <div className="space-y-4">
            <motion.button
              onClick={handleRetakeQuiz}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-arcade-green text-black font-arcade text-lg py-4 px-6 rounded-lg hover:bg-green-400 transition-colors"
            >
              🔄 Retake Assessment
            </motion.button>

            <motion.button
              onClick={handleBackToMenu}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full bg-arcade-cyan text-black font-arcade text-lg py-4 px-6 rounded-lg hover:bg-cyan-400 transition-colors"
            >
              🏠 Back to Main Menu
            </motion.button>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
      <div className="bg-gray-800 border-2 border-arcade-cyan rounded-lg p-8 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-arcade text-arcade-cyan mb-2 glow-heading">
            Final Cybersecurity Assessment
          </h1>
          <div className="flex justify-center items-center gap-4 text-lg font-terminal text-gray-300">
            <span>Question {currentQuestion + 1} of {QUIZ_QUESTIONS.length}</span>
            <div className="w-32 bg-gray-700 rounded-full h-2">
              <div 
                className="bg-arcade-cyan h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentQuestion + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
              />
            </div>
          </div>
        </div>

        {/* Question */}
        <motion.div
          key={currentQuestion}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-8 overflow-y-auto"
        >
          <h2 className="text-2xl font-terminal text-white mb-6 leading-relaxed">
            {currentQ.question}
          </h2>

          {/* Interactive Question Components */}
          {currentQ.type === 'popup_ui' && currentQ.popupContent && (
            <div className="mb-6">
              {/* Popup UI Simulation */}
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-4 mb-4 max-h-96 overflow-y-auto">
                <h3 className="font-arcade text-arcade-cyan mb-4">Popup Preview:</h3>
                <div className={`border-2 rounded-lg p-6 text-center ${
                  currentQ.popupContent.style === 'scam' ? 'border-red-500 bg-red-900 bg-opacity-30' :
                  currentQ.popupContent.style === 'warning' ? 'border-yellow-500 bg-yellow-900 bg-opacity-30' :
                  currentQ.popupContent.style === 'error' ? 'border-red-600 bg-red-800 bg-opacity-30' :
                  'border-blue-500 bg-blue-900 bg-opacity-30'
                }`}>
                  <h4 className="font-arcade text-xl mb-4 text-red-300 break-words">{currentQ.popupContent.title}</h4>
                  <p className="font-terminal text-gray-200 mb-6 leading-relaxed break-words text-sm">{currentQ.popupContent.message}</p>
                  <div className="flex gap-2 justify-center flex-wrap">
                    {currentQ.popupContent.buttons.map((btn, idx) => (
                      <button key={idx} className="bg-gray-600 hover:bg-gray-500 px-4 py-2 rounded font-terminal text-sm break-words">
                        {btn}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all font-terminal text-lg ${
                      selectedAnswers[currentQuestion] === index
                        ? 'bg-arcade-cyan bg-opacity-20 border-arcade-cyan text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-arcade-cyan hover:bg-gray-600'
                    }`}
                  >
                    <span className="font-arcade mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {currentQ.type === 'vishing_audio' && (
            <div className="mb-6">
              {/* Audio Player */}
              <div className="bg-gray-900 border border-gray-600 rounded-lg p-6 mb-4 text-center">
                <h3 className="font-arcade text-arcade-cyan mb-4">Voice Call Sample</h3>
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.button
                    onClick={fetchAndPlayVishingCall}
                    disabled={loadingAudio}
                    whileHover={{ scale: loadingAudio ? 1 : 1.05 }}
                    whileTap={{ scale: loadingAudio ? 1 : 0.95 }}
                    className={`font-arcade px-6 py-3 rounded-lg transition-colors ${
                      loadingAudio 
                        ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                        : audioPlaying
                          ? 'bg-red-500 text-white hover:bg-red-400'
                          : 'bg-arcade-green text-black hover:bg-green-400'
                    }`}
                  >
                    {loadingAudio ? 'Loading...' : audioPlaying ? 'Stop Audio' : 'Play Audio'}
                  </motion.button>
                  
                  {vishingCall && (
                    <motion.button
                      onClick={() => showVishingTranscript(vishingCall)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="bg-arcade-cyan text-black font-arcade px-4 py-2 rounded-lg hover:bg-cyan-400 transition-colors ml-4"
                    >
                      Show Transcript
                    </motion.button>
                  )}
                </div>
                <p className="font-terminal text-gray-400 text-sm">
                  Listen carefully to identify the social engineering technique
                </p>
              </div>
              
              {/* Answer Options */}
              <div className="space-y-3">
                {currentQ.options.map((option, index) => (
                  <motion.button
                    key={index}
                    onClick={() => handleAnswerSelect(index)}
                    whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                    className={`w-full text-left p-4 rounded-lg border-2 transition-all font-terminal text-lg ${
                      selectedAnswers[currentQuestion] === index
                        ? 'bg-arcade-cyan bg-opacity-20 border-arcade-cyan text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-arcade-cyan hover:bg-gray-600'
                    }`}
                  >
                    <span className="font-arcade mr-3">{String.fromCharCode(65 + index)}.</span>
                    {option}
                  </motion.button>
                ))}
              </div>
            </div>
          )}

          {currentQ.type === 'drag_drop' && currentQ.dragItems && currentQ.dropZones && (
            <div className="mb-6">
              {/* Instructions */}
              <div className="bg-blue-900 bg-opacity-30 border border-blue-400 rounded-lg p-4 mb-4">
                <h4 className="font-arcade text-blue-300 mb-2">Instructions:</h4>
                <p className="font-terminal text-blue-100 text-sm">Drag each email example from the left to its matching phishing intent on the right. Click and hold to drag items.</p>
              </div>
              
              {showDragFeedback && Object.values(dragFeedback).some(f => f === 'incorrect') && (
                <div className="bg-red-900 bg-opacity-30 border border-red-400 rounded-lg p-4 mb-4">
                  <h4 className="font-arcade text-red-300 mb-2">Some matches are incorrect!</h4>
                  <p className="font-terminal text-red-100 text-sm">Review the highlighted zones and try dragging the emails to different intents.</p>
                </div>
              )}
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full max-w-full overflow-hidden">
                {/* Drag Items */}
                <div>
                  <h3 className="font-arcade text-arcade-cyan mb-4">📧 Email Examples (Drag These)</h3>
                  <div className="space-y-3 min-h-[300px]">
                    {currentQ.dragItems.map((item, index) => {
                      const isPlaced = Object.values(draggedItems).includes(item)
                      return (
                        <div
                          key={index}
                          draggable={!isPlaced}
                          onDragStart={(e) => handleDragStart(e, item)}
                          className={`p-4 rounded-lg transition-colors font-terminal border-2 text-sm break-words select-none w-full max-w-full ${
                            isPlaced
                              ? 'bg-gray-800 border-gray-500 opacity-50 cursor-not-allowed'
                              : 'bg-gradient-to-r from-gray-700 to-gray-600 border-arcade-cyan hover:border-arcade-green cursor-grab active:cursor-grabbing hover:shadow-lg'
                          }`}
                          style={{
                            transform: isPlaced ? 'scale(0.95)' : 'scale(1)',
                          }}
                        >
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-arcade-cyan rounded-full mr-3 flex-shrink-0"></div>
                            <div className="break-words flex-1 overflow-hidden">
                              <strong className="text-arcade-cyan">Email:</strong> {item}
                            </div>
                          </div>
                          {isPlaced && (
                            <div className="mt-2 text-gray-400 text-xs flex items-center">
                              <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                              Placed in category
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
                
                {/* Drop Zones */}
                <div>
                  <h3 className="font-arcade text-arcade-cyan mb-4">🎯 Phishing Intents (Drop Here)</h3>
                  <div className="space-y-3 min-h-[300px]">
                    {currentQ.dropZones.map((zone, index) => {
                      const hasItem = draggedItems[zone]
                      const feedbackClass = showDragFeedback && dragFeedback[zone] === 'correct'
                        ? 'border-green-400 bg-green-900 bg-opacity-30'
                        : showDragFeedback && dragFeedback[zone] === 'incorrect'
                          ? 'border-red-400 bg-red-900 bg-opacity-30'
                          : hasItem
                            ? 'border-arcade-green bg-arcade-green bg-opacity-10'
                            : 'border-gray-600 hover:border-arcade-magenta hover:bg-gray-700'
                      
                      return (
                        <div
                          key={index}
                          onDrop={(e) => handleDrop(e, zone)}
                          onDragOver={handleDragOver}
                          className={`border-2 border-dashed p-4 rounded-lg min-h-[80px] transition-all duration-300 w-full max-w-full ${feedbackClass}`}
                        >
                          <div className="text-center">
                            <div className="font-arcade text-arcade-magenta mb-3 text-base font-bold">
                              {zone}
                            </div>
                            
                            {hasItem ? (
                              <div className={`p-3 rounded-lg border transition-all ${
                                showDragFeedback && dragFeedback[zone] === 'correct'
                                  ? 'text-green-200 bg-green-800 border-green-600'
                                  : showDragFeedback && dragFeedback[zone] === 'incorrect'
                                    ? 'text-red-200 bg-red-800 border-red-600'
                                    : 'text-white bg-gray-700 border-gray-500'
                              }`}>
                                <div className="flex items-center justify-center">
                                  <div className="w-2 h-2 bg-arcade-cyan rounded-full mr-2 flex-shrink-0"></div>
                                  <div className="break-words text-sm overflow-hidden">{draggedItems[zone]}</div>
                                </div>
                                {showDragFeedback && (
                                  <div className="mt-2 flex items-center justify-center">
                                    {dragFeedback[zone] === 'correct' && (
                                      <span className="text-green-400 font-bold flex items-center">
                                        <span className="mr-1">✓</span> Correct!
                                      </span>
                                    )}
                                    {dragFeedback[zone] === 'incorrect' && (
                                      <span className="text-red-400 font-bold flex items-center">
                                        <span className="mr-1">✗</span> Try Again
                                      </span>
                                    )}
                                  </div>
                                )}
                              </div>
                            ) : (
                              <div className="text-gray-400 text-sm italic py-4">
                                Drop an email here
                                <div className="mt-1 text-xs text-gray-500">
                                  Drag from left panel
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentQ.type === 'select_all' && (
            <div className="mb-6">
              <p className="font-terminal text-arcade-cyan mb-4">Select all correct answers:</p>
              <div className="space-y-3">
                {currentQ.options.map((option, index) => {
                  const currentAnswers = Array.isArray(selectedAnswers[currentQuestion]) 
                    ? selectedAnswers[currentQuestion] as number[] 
                    : []
                  const isSelected = currentAnswers.includes(index)
                  
                  return (
                    <motion.div
                      key={index}
                      onClick={() => handleMultipleSelect(index)}
                      whileHover={{ scale: 1.02 }}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-all font-terminal text-lg cursor-pointer ${
                        isSelected
                          ? 'bg-arcade-cyan bg-opacity-20 border-arcade-cyan text-white'
                          : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-arcade-cyan hover:bg-gray-600'
                      }`}
                    >
                      <div className="flex items-center">
                        <div className={`w-6 h-6 border-2 rounded mr-4 flex items-center justify-center ${
                          isSelected ? 'border-arcade-cyan bg-arcade-cyan' : 'border-gray-500'
                        }`}>
                          {isSelected && <span className="text-black font-bold">✓</span>}
                        </div>
                        <span className="font-arcade mr-3">{String.fromCharCode(65 + index)}.</span>
                        {option}
                      </div>
                    </motion.div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Standard Question Types */}
          {['multiple_choice', 'true_false', 'matching'].includes(currentQ.type) && (
            <div className="space-y-3 mb-6">
              {currentQ.options.map((option, index) => (
                <motion.button
                  key={index}
                  onClick={() => handleAnswerSelect(index)}
                  whileHover={{ scale: showExplanation ? 1 : 1.02 }}
                  whileTap={{ scale: showExplanation ? 1 : 0.98 }}
                  disabled={showExplanation}
                  className={`w-full text-left p-4 rounded-lg border-2 transition-all font-terminal text-lg ${
                    showExplanation
                      ? index === currentQ.correctAnswer
                        ? 'bg-green-900 border-green-400 text-green-100'
                        : index === selectedAnswer && index !== currentQ.correctAnswer
                          ? 'bg-red-900 border-red-400 text-red-100'
                          : 'bg-gray-700 border-gray-600 text-gray-300'
                      : selectedAnswers[currentQuestion] === index
                        ? 'bg-arcade-cyan bg-opacity-20 border-arcade-cyan text-white'
                        : 'bg-gray-700 border-gray-600 text-gray-300 hover:border-arcade-cyan hover:bg-gray-600'
                  }`}
                >
                  <span className="font-arcade mr-3">
                    {String.fromCharCode(65 + index)}.
                  </span>
                  {option}
                  {showExplanation && index === currentQ.correctAnswer && (
                    <span className="ml-2 text-green-400">✓</span>
                  )}
                  {showExplanation && index === selectedAnswer && index !== currentQ.correctAnswer && (
                    <span className="ml-2 text-red-400">✗</span>
                  )}
                </motion.button>
              ))}
            </div>
          )}

          {/* Explanation */}
          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-blue-900 bg-opacity-50 border border-blue-400 rounded-lg p-4 mb-6"
              >
                <h3 className="font-arcade text-blue-300 mb-2">Explanation:</h3>
                <p className="font-terminal text-blue-100">{currentQ.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          {!showExplanation && (
            <div className="text-center">
              {currentQ.type === 'drag_drop' && showDragFeedback && Object.values(dragFeedback).some(f => f === 'incorrect') && (
                <motion.button
                  onClick={() => {
                    setShowDragFeedback(false)
                    setDragFeedback({})
                    setDraggedItems({})
                  }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="font-arcade text-lg py-3 px-6 rounded-lg bg-arcade-magenta text-black hover:bg-purple-400 transition-colors mb-4 mr-4"
                >
                  Reset & Try Again
                </motion.button>
              )}
              <motion.button
                onClick={handleSubmitAnswer}
                disabled={(() => {
                  const currentAnswer = selectedAnswers[currentQuestion]
                  if (currentQ.type === 'select_all') {
                    const answers = Array.isArray(currentAnswer) ? currentAnswer as number[] : []
                    return answers.length === 0
                  }
                  if (currentQ.type === 'drag_drop') {
                    return Object.keys(draggedItems).length === 0
                  }
                  if (currentQ.type === 'matching') {
                    return Object.keys(draggedItems).length === 0
                  }
                  return currentAnswer === null || currentAnswer === undefined || currentAnswer === -1
                })()}
                className={`font-arcade text-xl py-4 px-8 rounded-lg transition-all ${(() => {
                  const currentAnswer = selectedAnswers[currentQuestion]
                  if (currentQ.type === 'select_all') {
                    const answers = Array.isArray(currentAnswer) ? currentAnswer as number[] : []
                    return answers.length > 0
                      ? 'bg-arcade-green text-black hover:bg-green-400 cursor-pointer'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                  if (currentQ.type === 'drag_drop') {
                    return Object.keys(draggedItems).length > 0
                      ? 'bg-arcade-green text-black hover:bg-green-400 cursor-pointer'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                  if (currentQ.type === 'matching') {
                    return Object.keys(draggedItems).length > 0
                      ? 'bg-arcade-green text-black hover:bg-green-400 cursor-pointer'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }
                  return currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== -1
                    ? 'bg-arcade-green text-black hover:bg-green-400 cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                })()}`}
                whileHover={{ scale: (() => {
                  const currentAnswer = selectedAnswers[currentQuestion]
                  if (currentQ.type === 'select_all') {
                    const answers = Array.isArray(currentAnswer) ? currentAnswer as number[] : []
                    return answers.length > 0 ? 1.05 : 1
                  }
                  if (currentQ.type === 'drag_drop') {
                    return Object.keys(draggedItems).length > 0 ? 1.05 : 1
                  }
                  if (currentQ.type === 'matching') {
                    return Object.keys(draggedItems).length > 0 ? 1.05 : 1
                  }
                  return currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== -1 ? 1.05 : 1
                })() }}
                whileTap={{ scale: (() => {
                  const currentAnswer = selectedAnswers[currentQuestion]
                  if (currentQ.type === 'select_all') {
                    const answers = Array.isArray(currentAnswer) ? currentAnswer as number[] : []
                    return answers.length > 0 ? 0.95 : 1
                  }
                  if (currentQ.type === 'drag_drop') {
                    return Object.keys(draggedItems).length > 0 ? 0.95 : 1
                  }
                  if (currentQ.type === 'matching') {
                    return Object.keys(draggedItems).length > 0 ? 0.95 : 1
                  }
                  return currentAnswer !== null && currentAnswer !== undefined && currentAnswer !== -1 ? 0.95 : 1
                })() }}
              >
                {currentQ.type === 'drag_drop' && showDragFeedback && Object.values(dragFeedback).some(f => f === 'incorrect')
                  ? 'Try Again'
                  : isLastQuestion ? 'Complete Assessment' : 'Submit Answer'}
              </motion.button>
            </div>
          )}
        </motion.div>

        {/* Progress indicator */}
        <div className="flex justify-center space-x-2 mt-8">
          {QUIZ_QUESTIONS.map((_, index) => (
            <div
              key={index}
              className={`w-3 h-3 rounded-full ${
                index < currentQuestion
                  ? 'bg-arcade-green'
                  : index === currentQuestion
                    ? 'bg-arcade-cyan'
                    : 'bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
