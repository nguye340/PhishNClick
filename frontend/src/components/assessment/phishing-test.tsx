"use client"

import React, { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useRouter } from "next/navigation"
import { RiveMainCharacter } from "../../components/rive"
import { GameDialogue } from "@/components/ui"

interface Option {
  id: string;
  text: string;
}

interface Question {
  id: string;
  question: string;
  options: Option[];
  correctAnswer: string;
  explanation: string;
}

interface PhishingTestProps {
  questions?: Question[];
}

const questions: Question[] = [
  {
    id: "1",
    question: "Which of these is a sign of a phishing email?",
    options: [
      { id: "A", text: "Comes from a known colleague" },
      { id: "B", text: "Creates a sense of urgency" },
      { id: "C", text: "Contains your correct name" },
      { id: "D", text: "Has the company logo" }
    ],
    correctAnswer: "B",
    explanation: " Phishing emails often create a sense of urgency to prompt the recipient into taking action without thinking."
  },
  {
    id: "2",
    question: " What should you do if you receive a suspicious email?",
    options: [
      { id: "A", text: "Forward it to all colleagues" },
      { id: "B", text: "Click links to check them" },
      { id: "C", text: "Report to IT security" },
      { id: "D", text: "Reply asking for verification" }
    ],
    correctAnswer: "C",
    explanation: " Reporting suspicious emails to IT security helps prevent potential attacks and ensures the email is handled properly."
  },
  {
    id: "3",
    question: "Which URL is most likely to be legitimate?",
    options: [
      { id: "A", text: "paypal-secure.net" },
      { id: "B", text: "paypal.com" },
      { id: "C", text: "paypal.security-check.com" },
      { id: "D", text: "secure-paypal-login.com" }
    ],
    correctAnswer: "B",
    explanation: " Legitimate URLs typically do not contain extra words or characters. Paypal's official URL is paypal.com."
  }
]

export function PhishingTest({ questions: providedQuestions }: PhishingTestProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [dialogueText, setDialogueText] = useState("")
  const [waitingForUserClick, setWaitingForUserClick] = useState(false)
  const [nextAction, setNextAction] = useState<string>("")

  const questionsToUse = providedQuestions || questions;

  // Set initial dialogue when component mounts
  useEffect(() => {
    setDialogueText("  Welcome to PhishNClick! I'll help you learn how to spot phishing attempts. Look at each email carefully and decide if it's legitimate or a phishing attempt.")
  }, [])

  // Function to update dialogue text based on current state
  const updateDialogueText = (correct: boolean | null, questionIndex: number, showingResult: boolean) => {
    if (showingResult) {
      return `  Great job! You scored ${score} out of ${questionsToUse.length}. You're becoming a phishing detection expert!`
    } else if (correct === null) {
      if (questionIndex === 0) {
        return "  Welcome to PhishNClick! I'll help you learn how to spot phishing attempts. Look at each email carefully and decide if it's legitimate or a phishing attempt."
      } else {
        return ` Let's move on to the next question. Remember to check for suspicious links, poor grammar, and urgent requests.`
      }
    } else if (correct) {
      return ` That's correct! ${questionsToUse[questionIndex].explanation}`
    } else {
      return ` Not quite. ${questionsToUse[questionIndex].explanation} Let's be more careful next time.`
    }
  };

  // Handle when dialogue is completed (user clicked after reading)
  const handleDialogueComplete = () => {
    console.log("Dialogue completed, action:", nextAction);
    
    if (nextAction === "NEXT_QUESTION") {
      if (currentQuestion < questionsToUse.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
        setDialogueText(updateDialogueText(null, currentQuestion + 1, false));
      } else {
        setShowResult(true);
        setDialogueText(updateDialogueText(null, currentQuestion, true));
      }
      setNextAction("");
      setWaitingForUserClick(false);
    }
  };

  // Handle when user selects an answer
  const handleAnswer = (answerId: string) => {
    if (selectedAnswer || waitingForUserClick) return; // Prevent multiple selections
    
    setSelectedAnswer(answerId);
    
    const isAnswerCorrect = answerId === questionsToUse[currentQuestion].correctAnswer;
    if (isAnswerCorrect) {
      setScore(score + 1);
    }

    // Update dialogue with feedback
    setDialogueText(updateDialogueText(isAnswerCorrect, currentQuestion, false));
    setWaitingForUserClick(true);
    setNextAction("NEXT_QUESTION");
  };

  // Add a continue button that appears after selecting an answer
  const handleContinue = () => {
    if (nextAction === "NEXT_QUESTION") {
      if (currentQuestion < questionsToUse.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
        setDialogueText(updateDialogueText(null, currentQuestion + 1, false));
      } else {
        setShowResult(true);
        setDialogueText(updateDialogueText(null, currentQuestion, true));
      }
      setNextAction("");
      setWaitingForUserClick(false);
    } else {
      router.push("/")
    }
  };

  if (showResult) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="min-h-screen flex flex-col items-center justify-center px-4 relative"
      >
        <div className="flex flex-col items-center justify-center w-full gap-10">
          <div className="max-w-lg w-full text-center">
            <div className="bg-arcade-bg/80 backdrop-blur-sm p-8 rounded-lg border-2 border-arcade-magenta neon-border">
              <h2 className="font-arcade text-3xl mb-4 text-arcade-magenta">
                GAME OVER!
              </h2>
              
              <p className="text-2xl mb-6 text-arcade-yellow">
                FINAL SCORE: {score}/{questionsToUse.length}
              </p>

              <p className="text-gray-300 mb-8">
                GOOD JOB! KEEP TRAINING TO LEVEL UP!
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="font-arcade text-lg px-8 py-4 bg-arcade-magenta text-black rounded-lg hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                onClick={() => router.push("/")}
              >
                CONTINUE TO MAIN MENU
              </motion.button>
            </div>
          </div>
          
          <div className="w-full max-w-[800px]">
            <GameDialogue 
              text={dialogueText}
              typingSpeed={40}
              onComplete={handleDialogueComplete}
            />
          </div>
        </div>
      </motion.div>
    )
  }

  return (
    <section className="phishing-test min-h-screen flex flex-col items-center justify-center px-4 relative">
      <div className="flex flex-col items-center justify-center w-full gap-10">
        <div className="max-w-xl w-full z-50 relative">
          <div className="bg-arcade-bg/80 backdrop-blur-sm p-6 rounded-lg border-2 border-arcade-cyan neon-border">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <span className="font-arcade text-arcade-cyan">CATPHISHY</span>
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
                    LEVEL 1-{currentQuestion + 1}: {questionsToUse[currentQuestion].question}
                  </h3>

                  <div className="grid gap-4">
                    {questionsToUse[currentQuestion].options.map((option: Option) => (
                      <motion.button
                        key={option.id}
                        className={`w-full text-left p-4 rounded-lg border-2 transition-colors hover:cursor-arcade
                          ${selectedAnswer === option.id
                            ? selectedAnswer === questionsToUse[currentQuestion].correctAnswer
                              ? "border-arcade-green bg-arcade-green/20 text-arcade-green"
                              : "border-arcade-red bg-arcade-red/20 text-arcade-red"
                            : "border-arcade-cyan hover:border-arcade-cyan/80"
                          }`}
                        onClick={() => handleAnswer(option.id)}
                        whileHover={!selectedAnswer ? { scale: 1.02 } : {}}
                        whileTap={!selectedAnswer ? { scale: 0.98 } : {}}
                        disabled={!!selectedAnswer || waitingForUserClick}
                      >
                        {option.id}. {option.text}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <div className="space-x-2">
                      {Array.from({ length: 3 }, (_, i) => (
                        <div
                          key={i}
                          className={`inline-block w-3 h-3 rounded-full
                            ${i === currentQuestion ? "bg-purple-500" : "bg-gray-600"}`}
                        />
                      ))}
                    </div>
                    
                    {/* Next button positioned between dots and question counter */}
                    {selectedAnswer && (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-arcade text-xs px-3 py-1 bg-arcade-magenta text-black rounded-md hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                        onClick={handleContinue}
                      >
                        NEXT →
                      </motion.button>
                    )}
                  </div>
                  <div className="font-arcade text-sm text-purple-500">
                    QUESTION {currentQuestion + 1}/3
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
        
        <div className="w-full max-w-[800px]">
          <GameDialogue 
            text={dialogueText}
            typingSpeed={40}
            onComplete={handleDialogueComplete}
          />
        </div>
      </div>
      
      <RiveMainCharacter 
        position="right"
        isAbsolute={true}
        className="right-0" // Position at the right edge
      />
    </section>
  );
}

export default PhishingTest;
