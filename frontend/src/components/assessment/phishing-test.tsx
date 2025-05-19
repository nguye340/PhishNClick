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

interface EmailIndicator {
  id: string;
  text: string;
  description: string;
  isCorrect: boolean;
}

interface PhishingEmail {
  id: string;
  from: string;
  cc?: string;
  to: string;
  subject: string;
  body: string;
  correctAction: "spam" | "report" | "clean";
  indicators: EmailIndicator[];
  phishingType?: string;
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

const phishingEmails: PhishingEmail[] = [
  {
    id: "1",
    from: "info@sheirdancollege.ca",
    cc: "full-time-students",
    to: "hijack@sheridancollege.ca",
    subject: "ACTION REQUIRED: Password Expiry",
    body: `Hi Student,

Our records indicate that your Sheridan College email password is set to expire in the next 24 hours. To ensure uninterrupted access to your student portal, email, and online resources, you must update your password immediately.

Please click the secure link below to update your password:

🔗 Update Password Now

Failure to update your password may result in account suspension and loss of access to course materials. If you have already updated your password, please ignore this message.

For security reasons, do not share your password with anyone. If you need further assistance, contact the IT Help Desk at it-support@sheirdancollege.ca.

Best regards,
Sheridan College IT Services
info@sheirdancollege.ca`,
    correctAction: "report",
    indicators: [
      { 
        id: "1", 
        text: "Misspelled Domain Name", 
        description: "The sender's email domain is misspelled as 'sheirdancollege.ca' instead of 'sheridancollege.ca'", 
        isCorrect: true 
      },
      { 
        id: "2", 
        text: "Urgency", 
        description: "The email creates a false sense of urgency to pressure you into taking immediate action", 
        isCorrect: true 
      },
      { 
        id: "3", 
        text: "Phishing Link", 
        description: "The email contains a suspicious link labeled generically as 'Update Password Now'", 
        isCorrect: true 
      },
      { 
        id: "4", 
        text: "Mismatch Between Email Addresses", 
        description: "The sender address and the contact email at the bottom don't match the official domain", 
        isCorrect: true 
      },
      { 
        id: "5", 
        text: "Poor Grammar", 
        description: "The email contains grammatical errors or awkward phrasing", 
        isCorrect: false 
      },
      { 
        id: "6", 
        text: "Generic Greeting", 
        description: "The email uses a generic greeting instead of your name", 
        isCorrect: true 
      },
      { 
        id: "7", 
        text: "Request for Personal Information", 
        description: "The email directly asks for personal information like passwords or credit card details", 
        isCorrect: false 
      }
    ],
    phishingType: "Credential Harvesting",
    explanation: "This is a credential harvesting phishing attempt. The attackers are trying to trick you into clicking a malicious link to steal your password."
  },
  {
    id: "2",
    from: "coursefeedbacksurvey@sheridancollege.ca",
    to: "hijack@sheridancollege.ca",
    subject: "Please Complete the Sheridan Course Feedback Survey Winter 2025",
    body: `Jack, your voice matters
Hello Jack, 

Now is your opportunity to evaluate your courses. Your feedback is important, and sharing a fair and honest assessment of your learning experience has never been easier. Online evaluations are currently available for the following courses:

Course                           Instructor           Evaluation End
CULT1234 - Creative Leadership   Kary Petty           March 30, 2025
INFO1234 - ISS Grad Project      Taylor Swish         March 30, 2025
SYST1234 - Wireless Security     Chris Evans          March 30, 2025


Evaluate My Courses >>
Questions?	
Contact us at 
coursefeedbacksurvey@sheridancollege.ca. 	 
 
Your course evaluations will close on March 30, 2025, so complete your course evaluations soon. Your voice matters!

Best,
Integrated Planning & Analysis`,
    correctAction: "clean",
    indicators: [
      { 
        id: "1", 
        text: "Misspelled Domain Name", 
        description: "The sender's email domain is misspelled", 
        isCorrect: false 
      },
      { 
        id: "2", 
        text: "Urgency", 
        description: "The email creates a false sense of urgency", 
        isCorrect: false 
      },
      { 
        id: "3", 
        text: "Phishing Link", 
        description: "The email contains a suspicious link", 
        isCorrect: false 
      },
      { 
        id: "4", 
        text: "Personalized Content", 
        description: "The email contains specific, accurate information about your courses", 
        isCorrect: true 
      },
      { 
        id: "5", 
        text: "Legitimate Purpose", 
        description: "The email serves a legitimate educational purpose", 
        isCorrect: true 
      },
      { 
        id: "6", 
        text: "Consistent Contact Information", 
        description: "The contact email matches the sender's address", 
        isCorrect: true 
      }
    ],
    explanation: "This is a legitimate email from Sheridan College requesting course feedback. It contains personalized information, comes from a legitimate domain, and serves an educational purpose."
  }
];

export function PhishingTest({ questions: providedQuestions }: PhishingTestProps) {
  const router = useRouter()
  const [currentQuestion, setCurrentQuestion] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<string>("")
  const [score, setScore] = useState(0)
  const [showResult, setShowResult] = useState(false)
  const [dialogueText, setDialogueText] = useState("")
  const [waitingForUserClick, setWaitingForUserClick] = useState(false)
  const [nextAction, setNextAction] = useState<string>("")
  const [isDialogueTyping, setIsDialogueTyping] = useState(false)
  
  // New state variables for email questions
  const [currentPhase, setCurrentPhase] = useState<"quiz" | "email" | "analysis">("quiz")
  const [currentEmailIndex, setCurrentEmailIndex] = useState(0)
  const [selectedEmailAction, setSelectedEmailAction] = useState<"spam" | "report" | "clean" | "">("")
  const [selectedIndicators, setSelectedIndicators] = useState<string[]>([])
  const [indicatorFeedback, setIndicatorFeedback] = useState<{id: string, correct: boolean, message: string} | null>(null)
  const [showIndicatorExplanation, setShowIndicatorExplanation] = useState(false)

  const questionsToUse = providedQuestions || questions;
  const totalQuestions = questionsToUse.length + phishingEmails.length;

  // Set initial dialogue when component mounts
  useEffect(() => {
    setDialogueText("  Welcome to PhishNClick! I'll help you learn how to spot phishing attempts. Look at each email carefully and decide if it's legitimate or a phishing attempt.")
  }, [])

  // Function to update dialogue text based on current state
  const updateDialogueText = (correct: boolean | null, questionIndex: number, showingResult: boolean) => {
    if (showingResult) {
      const passThreshold = totalQuestions / 2; // 50% threshold
      if (score >= passThreshold) {
        return `  Great job! You scored ${score} out of ${totalQuestions}. You're becoming a phishing detection expert!`;
      } else {
        return `  You scored ${score} out of ${totalQuestions}. You need more practice with identifying phishing attempts, but don't worry - we're here to help you improve!`;
      }
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

  // New function to handle email phase dialogue
  const getEmailDialogueText = () => {
    if (selectedEmailAction === "") {
      return " Now let's analyze a real email. Is this email spam, should it be reported as phishing, or is it clean? Look for indicators like misspelled domains, urgent language, or suspicious links.";
    } else if (selectedEmailAction === phishingEmails[currentEmailIndex].correctAction) {
      return ` Correct! This email ${selectedEmailAction === "clean" ? "is legitimate" : "is a phishing attempt"}. Now let's identify the specific indicators that led to this conclusion.`;
    } else {
      return ` Not quite. This email should be marked as "${phishingEmails[currentEmailIndex].correctAction}". Let's identify the specific indicators that would help us recognize this.`;
    }
  };

  // New function to handle analysis phase dialogue
  const getAnalysisDialogueText = () => {
    if (!showIndicatorExplanation) {
      return " Select all the indicators that apply to this email. Look carefully at the sender, content, and any suspicious elements.";
    } else if (indicatorFeedback?.correct) {
      return `Great job! You correctly identified the indicators. ${phishingEmails[currentEmailIndex].explanation}`;
    } else {
      return ` Let's review the correct indicators. ${phishingEmails[currentEmailIndex].explanation}`;
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
        setCurrentPhase("email");
        setDialogueText(getEmailDialogueText());
      }
      setNextAction("");
      setWaitingForUserClick(false);
    } else if (nextAction === "NEXT_EMAIL") {
      if (currentEmailIndex < phishingEmails.length - 1) {
        setCurrentEmailIndex(prev => prev + 1);
        setSelectedEmailAction("");
        setSelectedIndicators([]);
        setShowIndicatorExplanation(false);
        setDialogueText(getEmailDialogueText());
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

  // Handle dialogue typing status
  const handleDialogueTypingStatus = (isTyping: boolean) => {
    setIsDialogueTyping(isTyping);
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

  // Handle email action selection
  const handleEmailAction = (action: "spam" | "report" | "clean") => {
    if (selectedEmailAction || waitingForUserClick) return; // Prevent multiple selections
    
    setSelectedEmailAction(action);
    
    const isActionCorrect = action === phishingEmails[currentEmailIndex].correctAction;
    if (isActionCorrect) {
      setScore(score + 1);
    }

    // Update dialogue with feedback
    setDialogueText(getEmailDialogueText());
    setWaitingForUserClick(true);
  };

  // Handle indicator selection submission
  const handleIndicatorSubmission = () => {
    const correctIndicators = phishingEmails[currentEmailIndex].indicators
      .filter(indicator => indicator.isCorrect)
      .map(indicator => indicator.id);
    
    const userSelectedCorrectly = correctIndicators.every(id => selectedIndicators.includes(id)) && 
      selectedIndicators.every(id => phishingEmails[currentEmailIndex].indicators.find(i => i.id === id)?.isCorrect);
    
    if (userSelectedCorrectly) {
      setScore(score + 1);
    }
    
    setIndicatorFeedback({
      id: phishingEmails[currentEmailIndex].id,
      correct: userSelectedCorrectly,
      message: userSelectedCorrectly 
        ? "Correct! You identified all the right indicators." 
        : "Not quite. You missed some indicators or selected incorrect ones."
    });
    
    setShowIndicatorExplanation(true);
    setDialogueText(getAnalysisDialogueText());
    setWaitingForUserClick(true);
    setNextAction("NEXT_EMAIL");
  };

  // Add a continue button that appears after selecting an answer
  const handleContinue = () => {
    if (nextAction === "NEXT_QUESTION") {
      if (currentQuestion < questionsToUse.length - 1) {
        setCurrentQuestion(prev => prev + 1);
        setSelectedAnswer("");
        setDialogueText(updateDialogueText(null, currentQuestion + 1, false));
      } else {
        setCurrentPhase("email");
        setDialogueText(getEmailDialogueText());
      }
      setNextAction("");
      setWaitingForUserClick(false);
    } else if (nextAction === "NEXT_EMAIL") {
      if (currentEmailIndex < phishingEmails.length - 1) {
        setCurrentEmailIndex(prev => prev + 1);
        setSelectedEmailAction("");
        setSelectedIndicators([]);
        setShowIndicatorExplanation(false);
        setDialogueText(getEmailDialogueText());
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
      <section className="phishing-test min-h-screen flex flex-col items-center justify-center px-4 relative">
        <div className="flex flex-col items-center justify-center w-full gap-10">
          <div className="max-w-xl w-full z-50 relative">
            <div className="bg-arcade-bg/80 backdrop-blur-sm p-6 rounded-lg border-2 border-arcade-cyan neon-border">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-2">
                  <span className="font-arcade text-arcade-cyan">CATPHISHY</span>
                </div>
              </div>

              <h2 className="font-arcade text-3xl text-arcade-green mb-4">
                QUIZ COMPLETE
              </h2>
              
              <p className="text-2xl mb-6 text-arcade-yellow">
                FINAL SCORE: {score}/{totalQuestions}
              </p>

              <p className="text-gray-300 mb-8">
                {score >= totalQuestions / 2 
                  ? "Great job! You're well on your way to becoming a phishing detection expert." 
                  : "You need more practice with identifying phishing attempts. Don't worry, with more training you'll improve!"}
              </p>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="font-arcade text-lg px-8 py-4 bg-arcade-magenta text-black rounded-lg hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                onClick={handleContinue}
              >
                RETURN HOME
              </motion.button>
            </div>
          </div>
          
          <div className="w-full max-w-[800px]">
            <GameDialogue 
              text={dialogueText}
              typingSpeed={40}
              onComplete={handleDialogueComplete}
              onTypingStatusChange={handleDialogueTypingStatus}
            />
          </div>
        </div>
        
        <RiveMainCharacter 
          position="right"
          isAbsolute={true}
          className="right-0"
          isTalking={isDialogueTyping}
        />
      </section>
    )
  }

  if (currentPhase === "email") {
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
                  QUESTION {questionsToUse.length + currentEmailIndex + 1}/{totalQuestions}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={currentEmailIndex}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="font-arcade text-lg text-arcade-green">
                      EMAIL ANALYSIS - QUESTION {questionsToUse.length + currentEmailIndex + 1}
                    </h3>

                    <div className="email-container bg-white text-black p-4 rounded-lg overflow-y-auto max-h-[400px]">
                      <p className="text-sm font-bold">From: {phishingEmails[currentEmailIndex].from}</p>
                      {phishingEmails[currentEmailIndex].cc && (
                        <p className="text-sm">CC: {phishingEmails[currentEmailIndex].cc}</p>
                      )}
                      <p className="text-sm">To: {phishingEmails[currentEmailIndex].to}</p>
                      <p className="text-sm font-bold">Subject: {phishingEmails[currentEmailIndex].subject}</p>
                      <div className="border-t border-gray-300 my-2"></div>
                      <div className="email-body whitespace-pre-line text-sm">
                        {phishingEmails[currentEmailIndex].body}
                      </div>
                    </div>

                    <div className="mt-4 flex justify-center items-center space-x-4">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`font-arcade text-md px-6 py-3 rounded-lg transition-colors hover:cursor-arcade
                          ${selectedEmailAction === "spam" 
                            ? selectedEmailAction === phishingEmails[currentEmailIndex].correctAction
                              ? "bg-arcade-green text-black"
                              : "bg-arcade-red text-black"
                            : "bg-arcade-magenta text-black hover:bg-opacity-90"
                          }`}
                        onClick={() => handleEmailAction("spam")}
                        disabled={!!selectedEmailAction}
                      >
                        SPAM
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`font-arcade text-md px-6 py-3 rounded-lg transition-colors hover:cursor-arcade
                          ${selectedEmailAction === "report" 
                            ? selectedEmailAction === phishingEmails[currentEmailIndex].correctAction
                              ? "bg-arcade-green text-black"
                              : "bg-arcade-red text-black"
                            : "bg-arcade-magenta text-black hover:bg-opacity-90"
                          }`}
                        onClick={() => handleEmailAction("report")}
                        disabled={!!selectedEmailAction}
                      >
                        REPORT
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className={`font-arcade text-md px-6 py-3 rounded-lg transition-colors hover:cursor-arcade
                          ${selectedEmailAction === "clean" 
                            ? selectedEmailAction === phishingEmails[currentEmailIndex].correctAction
                              ? "bg-arcade-green text-black"
                              : "bg-arcade-red text-black"
                            : "bg-arcade-magenta text-black hover:bg-opacity-90"
                          }`}
                        onClick={() => handleEmailAction("clean")}
                        disabled={!!selectedEmailAction}
                      >
                        CLEAN
                      </motion.button>
                    </div>
                  </div>

                  {selectedEmailAction && (
                    <div className="flex justify-center mt-4">
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-arcade text-sm px-4 py-2 bg-arcade-cyan text-black rounded-md hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                        onClick={() => setCurrentPhase("analysis")}
                      >
                        ANALYZE INDICATORS →
                      </motion.button>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
          
          <div className="w-full max-w-[800px]">
            <GameDialogue 
              text={dialogueText}
              typingSpeed={40}
              onComplete={handleDialogueComplete}
              onTypingStatusChange={handleDialogueTypingStatus}
            />
          </div>
        </div>
        
        <RiveMainCharacter 
          position="right"
          isAbsolute={true}
          className="right-0"
          isTalking={isDialogueTyping}
        />
      </section>
    )
  }

  if (currentPhase === "analysis") {
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
                  QUESTION {questionsToUse.length + currentEmailIndex + 1}/{totalQuestions}
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={`analysis-${currentEmailIndex}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                  <div className="space-y-4">
                    <h3 className="font-arcade text-lg text-arcade-green">
                      IDENTIFY PHISHING INDICATORS - QUESTION {questionsToUse.length + currentEmailIndex + 1}
                    </h3>

                    <div className="email-container bg-white text-black p-4 rounded-lg overflow-y-auto max-h-[200px] mb-4">
                      <p className="text-sm font-bold">From: {phishingEmails[currentEmailIndex].from}</p>
                      {phishingEmails[currentEmailIndex].cc && (
                        <p className="text-sm">CC: {phishingEmails[currentEmailIndex].cc}</p>
                      )}
                      <p className="text-sm">To: {phishingEmails[currentEmailIndex].to}</p>
                      <p className="text-sm font-bold">Subject: {phishingEmails[currentEmailIndex].subject}</p>
                    </div>

                    <div className="indicators-container grid grid-cols-1 gap-2">
                      {phishingEmails[currentEmailIndex].indicators.map((indicator: EmailIndicator) => (
                        <motion.button
                          key={indicator.id}
                          className={`w-full text-left p-3 rounded-lg border-2 transition-colors hover:cursor-arcade text-sm
                            ${showIndicatorExplanation
                              ? indicator.isCorrect
                                ? "border-arcade-green bg-arcade-green/20 text-arcade-green"
                                : selectedIndicators.includes(indicator.id)
                                  ? "border-arcade-red bg-arcade-red/20 text-arcade-red"
                                  : "border-gray-600 bg-gray-800/20 text-gray-400"
                              : selectedIndicators.includes(indicator.id)
                                ? "border-arcade-cyan bg-arcade-cyan/20 text-arcade-cyan"
                                : "border-gray-600 hover:border-arcade-cyan/80"
                            }`}
                          onClick={() => {
                            if (!showIndicatorExplanation) {
                              if (selectedIndicators.includes(indicator.id)) {
                                setSelectedIndicators(selectedIndicators.filter(id => id !== indicator.id));
                              } else {
                                setSelectedIndicators([...selectedIndicators, indicator.id]);
                              }
                            }
                          }}
                          whileHover={!showIndicatorExplanation ? { scale: 1.02 } : {}}
                          whileTap={!showIndicatorExplanation ? { scale: 0.98 } : {}}
                          disabled={showIndicatorExplanation}
                        >
                          {indicator.text}
                          {showIndicatorExplanation && (
                            <p className="text-xs mt-1 opacity-80">
                              {indicator.description}
                            </p>
                          )}
                        </motion.button>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center mt-4">
                    {!showIndicatorExplanation ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="font-arcade text-md px-6 py-3 bg-arcade-magenta text-black rounded-lg hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                        onClick={handleIndicatorSubmission}
                      >
                        SUBMIT ANALYSIS
                      </motion.button>
                    ) : (
                      <motion.button
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="font-arcade text-sm px-4 py-2 bg-arcade-cyan text-black rounded-md hover:bg-opacity-90 transition-colors hover:cursor-arcade"
                        onClick={handleContinue}
                      >
                        CONTINUE →
                      </motion.button>
                    )}
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
              onTypingStatusChange={handleDialogueTypingStatus}
            />
          </div>
        </div>
        
        <RiveMainCharacter 
          position="right"
          isAbsolute={true}
          className="right-0"
          isTalking={isDialogueTyping}
        />
      </section>
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
                QUESTION {currentQuestion + 1}/{totalQuestions}
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
                    QUESTION {currentQuestion + 1}/{totalQuestions}
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
            onTypingStatusChange={handleDialogueTypingStatus}
          />
        </div>
      </div>
      
      <RiveMainCharacter 
        position="right"
        isAbsolute={true}
        className="right-0"
        isTalking={isDialogueTyping}
      />
    </section>
  )
}

export default PhishingTest;
