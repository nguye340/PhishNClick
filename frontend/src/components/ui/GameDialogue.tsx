"use client"

import React, { useState, useEffect, useRef } from 'react';

interface GameDialogueProps {
  text: string;
  typingSpeed?: number;
  className?: string;
  style?: React.CSSProperties;
  onComplete?: () => void;
}

const GameDialogue: React.FC<GameDialogueProps> = ({
  text,
  typingSpeed = 30, // ms per character
  className = '',
  style = {},
  onComplete
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const fullTextRef = useRef(text);
  const charIndexRef = useRef(0);

  // Reset animation when text changes
  useEffect(() => {
    console.log("Text changed to:", text);
    fullTextRef.current = text;
    charIndexRef.current = 0;
    setDisplayedText('');
    setIsTyping(true);
    setIsCompleted(false);
  }, [text]);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;
    
    const interval = setInterval(() => {
      if (charIndexRef.current < fullTextRef.current.length) {
        setDisplayedText(prev => prev + fullTextRef.current.charAt(charIndexRef.current));
        charIndexRef.current += 1;
      } else {
        setIsTyping(false);
        clearInterval(interval);
      }
    }, typingSpeed);
    
    return () => clearInterval(interval);
  }, [isTyping, typingSpeed]);

  // Handle click to complete text immediately or proceed
  const handleClick = () => {
    if (isTyping) {
      // If still typing, show all text immediately
      setDisplayedText(fullTextRef.current);
      setIsTyping(false);
    } else if (!isCompleted) {
      // If typing is done but not yet marked as completed
      console.log("Dialogue clicked after typing finished");
      setIsCompleted(true);
      // Call the onComplete callback if provided
      if (onComplete) {
        console.log("Calling onComplete callback");
        onComplete();
      }
    }
  };

  return (
    <div 
      className={`game-dialogue w-full bg-black/90 text-white p-6 rounded-lg shadow-2xl border-4 border-purple-500 cursor-pointer hover:cursor-arcade ${className}`} 
      style={{ 
        minHeight: '120px',
        boxShadow: '0 0 20px rgba(128, 0, 255, 0.5)',
        ...style 
      }}
      onClick={handleClick}
    >
      <p className="text-xl font-medium">
        {displayedText}
        {isTyping && <span className="animate-pulse ml-1 text-purple-500">▌</span>}
      </p>
      
      {isTyping && (
        <div className="absolute bottom-3 right-4 text-sm text-purple-500 opacity-70">
          <span className="text-xs">Click to skip</span>
        </div>
      )}
    </div>
  );
};

export default GameDialogue;
