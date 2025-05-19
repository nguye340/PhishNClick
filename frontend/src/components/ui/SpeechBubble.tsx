"use client"

import React, { useState, useEffect, useRef } from 'react';

export interface SpeechBubbleProps {
  text: string;
  position?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
  typingSpeed?: number;
  onTypingStatusChange?: (isTyping: boolean) => void;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  position = 'right',
  className = '',
  style = {},
  typingSpeed = 30,
  onTypingStatusChange
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);
  const fullTextRef = useRef(text);
  const charIndexRef = useRef(0);

  // Reset animation when text changes
  useEffect(() => {
    // Prevent duplicate animations by checking if the text has actually changed
    if (fullTextRef.current !== " " + text) {
      // Add a space at the beginning of the text to prevent first letter cutoff
      fullTextRef.current = " " + text;
      charIndexRef.current = 0;
      setDisplayedText('');
      setIsTyping(true);
      
      // Notify parent component that typing has started
      if (onTypingStatusChange) {
        onTypingStatusChange(true);
      }
    }
  }, [text, onTypingStatusChange]);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) {
      // Notify parent component that typing has stopped
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
      return;
    }
    
    const interval = setInterval(() => {
      if (charIndexRef.current < fullTextRef.current.length) {
        setDisplayedText(prev => prev + fullTextRef.current.charAt(charIndexRef.current));
        charIndexRef.current += 1;
      } else {
        setIsTyping(false);
        clearInterval(interval);
        
        // Notify parent component that typing has stopped
        if (onTypingStatusChange) {
          onTypingStatusChange(false);
        }
      }
    }, typingSpeed);
    
    return () => clearInterval(interval);
  }, [isTyping, typingSpeed, onTypingStatusChange]);

  // Handle click to complete text immediately
  const handleClick = () => {
    if (isTyping) {
      // If still typing, show all text immediately
      setDisplayedText(fullTextRef.current);
      setIsTyping(false);
      
      // Notify parent component that typing has stopped
      if (onTypingStatusChange) {
        onTypingStatusChange(false);
      }
    }
  };

  return (
    <div 
      className={`speech-bubble fixed left-8 top-32 bg-yellow-300 text-black p-5 rounded-lg shadow-2xl border-4 border-arcade-cyan ${className}`} 
      style={{ 
        zIndex: 9999, 
        maxWidth: '300px',
        minWidth: '250px',
        animation: 'pulse 2s infinite',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.7)',
        ...style 
      }}
      onClick={handleClick}
    >
      <p className="text-xl font-bold text-black">
        {displayedText}
        {isTyping && <span className="animate-pulse ml-1 text-arcade-cyan">▌</span>}
      </p>
      <div 
        className={`speech-bubble-arrow absolute -right-4 top-1/2 w-8 h-8 bg-yellow-300 border-r-4 border-b-4 border-arcade-cyan transform rotate-45`}
      ></div>
      <style jsx global>{`
        @keyframes pulse {
          0% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 255, 0.7); }
          50% { transform: scale(1.05); box-shadow: 0 0 30px rgba(0, 255, 255, 0.9); }
          100% { transform: scale(1); box-shadow: 0 0 20px rgba(0, 255, 255, 0.7); }
        }
      `}</style>
    </div>
  );
};

export default SpeechBubble;
