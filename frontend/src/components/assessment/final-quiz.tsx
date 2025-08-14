"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useRouter } from 'next/navigation'
import { resetGameProgression } from '../../utils/game-progression'

interface QuizQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: number
  explanation: string
  category: 'phishing' | 'malware' | 'social_engineering' | 'security_practices'
}

const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    id: 1,
    question: "What is the most reliable way to verify if an email is legitimate?",
    options: [
      "Check if it has professional formatting",
      "Look for spelling and grammar errors",
      "Verify the sender through a separate communication channel",
      "Check if it contains company logos"
    ],
    correctAnswer: 2,
    explanation: "The most reliable way is to verify through a separate, trusted communication channel like calling the organization directly.",
    category: 'phishing'
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
    category: 'phishing'
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
    category: 'malware'
  },
  {
    id: 4,
    question: "Which popup behavior is most suspicious?",
    options: [
      "Asking for software updates",
      "Claiming your computer is infected and demanding immediate action",
      "Showing website cookies notice",
      "Displaying advertisement content"
    ],
    correctAnswer: 1,
    explanation: "Popups claiming infection and demanding immediate action are classic scareware tactics designed to panic users.",
    category: 'malware'
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
    category: 'social_engineering'
  },
  {
    id: 6,
    question: "Which is the strongest password practice?",
    options: [
      "Using the same complex password everywhere",
      "Using unique, complex passwords with a password manager",
      "Using simple passwords that are easy to remember",
      "Changing passwords every week"
    ],
    correctAnswer: 1,
    explanation: "Using unique, complex passwords with a password manager provides the best security while maintaining usability.",
    category: 'security_practices'
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
    category: 'social_engineering'
  },
  {
    id: 8,
    question: "Which URL is most likely to be legitimate for Amazon?",
    options: [
      "amazon-security.com",
      "amazon.com",
      "amazon-login.net",
      "secure-amazon.org"
    ],
    correctAnswer: 1,
    explanation: "The official Amazon domain is amazon.com. Other variations are likely phishing attempts.",
    category: 'phishing'
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
    category: 'malware'
  },
  {
    id: 10,
    question: "Which of these is a sign of a secure website?",
    options: [
      "HTTP protocol in the URL",
      "HTTPS protocol and valid SSL certificate",
      "Colorful design",
      "Many pop-up advertisements"
    ],
    correctAnswer: 1,
    explanation: "HTTPS protocol with a valid SSL certificate indicates the website encrypts data transmission.",
    category: 'security_practices'
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
    category: 'security_practices'
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
    category: 'phishing'
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
    category: 'security_practices'
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
    category: 'malware'
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
    category: 'social_engineering'
  }
]

export function FinalQuiz() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [userAnswers, setUserAnswers] = useState<number[]>([])
  const [showExplanation, setShowExplanation] = useState(false)
  const [quizCompleted, setQuizCompleted] = useState(false)
  const [score, setScore] = useState(0)
  const [timeStarted] = useState(Date.now())
  const [questionStartTime, setQuestionStartTime] = useState(Date.now())

  const currentQ = QUIZ_QUESTIONS[currentQuestion]
  const isLastQuestion = currentQuestion === QUIZ_QUESTIONS.length - 1

  useEffect(() => {
    setQuestionStartTime(Date.now())
  }, [currentQuestion])

  const handleAnswerSelect = (answerIndex: number) => {
    if (showExplanation) return
    setSelectedAnswer(answerIndex)
  }

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return

    const isCorrect = selectedAnswer === currentQ.correctAnswer
    const newAnswers = [...userAnswers, selectedAnswer]
    setUserAnswers(newAnswers)

    if (isCorrect) {
      setScore(score + 1)
    }

    setShowExplanation(true)

    // Auto-advance after showing explanation
    setTimeout(() => {
      if (isLastQuestion) {
        setQuizCompleted(true)
      } else {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer(null)
        setShowExplanation(false)
      }
    }, 3000)
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
      <div className="bg-gray-800 border-2 border-arcade-cyan rounded-lg p-8 max-w-4xl w-full">
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
          className="mb-8"
        >
          <h2 className="text-2xl font-terminal text-white mb-6 leading-relaxed">
            {currentQ.question}
          </h2>

          {/* Options */}
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
                    : selectedAnswer === index
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
              <motion.button
                onClick={handleSubmitAnswer}
                disabled={selectedAnswer === null}
                whileHover={{ scale: selectedAnswer !== null ? 1.05 : 1 }}
                whileTap={{ scale: selectedAnswer !== null ? 0.95 : 1 }}
                className={`font-arcade text-xl py-4 px-8 rounded-lg transition-all ${
                  selectedAnswer !== null
                    ? 'bg-arcade-green text-black hover:bg-green-400 cursor-pointer'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                {isLastQuestion ? 'Complete Assessment' : 'Submit Answer'}
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
