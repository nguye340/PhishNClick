"use client"

import React, { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"

const questions = [
  {
    id: 1,
    question: "Which of these is a sign of a phishing email?",
    options: [
      { id: "A", text: "Comes from a known colleague" },
      { id: "B", text: "Urgent request for personal information" },
      { id: "C", text: "Contains your correct name" },
      { id: "D", text: "Has the company logo" }
    ],
    correctAnswer: "B"
  },
  {
    id: 2,
    question: "What should you do if you receive a suspicious email?",
    options: [
      { id: "A", text: "Forward it to all colleagues" },
      { id: "B", text: "Click links to investigate" },
      { id: "C", text: "Report to IT security" },
      { id: "D", text: "Reply asking for verification" }
    ],
    correctAnswer: "C"
  },
  {
    id: 3,
    question: "Which URL is most likely to be legitimate?",
    options: [
      { id: "A", text: "paypal-secure.net" },
      { id: "B", text: "paypal.com" },
      { id: "C", text: "paypal.security-check.com" },
      { id: "D", text: "secure-paypal-login.com" }
    ],
    correctAnswer: "B"
  }
]

export function PhishingTest() {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)

  const handleAnswer = (answerId: string) => {
    setSelectedAnswer(answerId)
    
    if (answerId === questions[currentQuestion].correctAnswer) {
      setScore(score + 1)
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion(currentQuestion + 1)
        setSelectedAnswer("")
      } else {
        setShowResult(true)
      }
    }, 1000)
  }

  const handleContinue = () => {
    router.push("/dashboard")
  }

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex items-center justify-center px-4"
      >
        <div className="max-w-lg w-full text-center">
          <div className="bg-arcade-bg/80 backdrop-blur-sm p-8 rounded-lg border-2 border-arcade-magenta neon-border">
            <h2 className="font-arcade text-3xl mb-4 text-arcade-magenta">
              GAME OVER!
            </h2>
            
            <p className="text-2xl mb-6 text-arcade-yellow">
              FINAL SCORE: {score}/{questions.length}
            </p>

            <p className="text-gray-300 mb-8">
              GOOD JOB! KEEP TRAINING TO LEVEL UP!
            </p>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="font-arcade text-lg px-8 py-4 bg-arcade-magenta text-black rounded-lg hover:bg-opacity-90 transition-colors"
              onClick={handleContinue}
            >
              CONTINUE TO MAIN MENU
            </motion.button>
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section className="phishing-test min-h-screen flex items-center justify-center px-4">
      <div className="max-w-2xl w-full">
        <div className="bg-arcade-bg/80 backdrop-blur-sm p-8 rounded-lg border-2 border-arcade-cyan neon-border">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <span className="font-arcade text-arcade-cyan">PHISHY</span>
            </div>
            <div className="font-arcade text-arcade-yellow">
              SCORE: {score}
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="space-y-4">
                <h3 className="font-arcade text-lg text-arcade-green">
                  LEVEL 1-{currentQuestion + 1}: {questions[currentQuestion].question}
                </h3>

                <div className="grid gap-4">
                  {questions[currentQuestion].options.map((option) => (
                    <motion.button
                      key={option.id}
                      className={`w-full text-left p-4 rounded-lg border-2 transition-colors
                        ${selectedAnswer === option.id
                          ? selectedAnswer === questions[currentQuestion].correctAnswer
                            ? "border-arcade-green bg-arcade-green/20 text-arcade-green"
                            : "border-arcade-red bg-arcade-red/20 text-arcade-red"
                          : "border-arcade-cyan hover:border-arcade-cyan/80"
                        }`}
                      onClick={() => !selectedAnswer && handleAnswer(option.id)}
                      whileHover={!selectedAnswer ? { scale: 1.02 } : {}}
                      whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                    >
                      {option.id}. {option.text}
                    </motion.button>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center">
                <div className="space-x-2">
                  {Array.from({ length: 3 }, (_, i) => (
                    <div
                      key={i}
                      className={`inline-block w-3 h-3 rounded-full
                        ${i === currentQuestion ? "bg-arcade-yellow" : "bg-gray-600"}`}
                    />
                  ))}
                </div>
                <div className="font-arcade text-sm text-gray-400">
                  QUESTION {currentQuestion + 1}/3
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  )
}
