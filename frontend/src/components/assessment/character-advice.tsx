"use client"

import React, { useState, useEffect } from 'react';
import { SpeechBubble } from '@/components/ui';
import RiveMainCharacter from '@/components/rive/RiveMainCharacter';

interface CharacterAdviceProps {
  currentAdvice?: string;
}

const defaultAdvice = "Hello and welcome to PhishNClick! I'll help you learn how to spot phishing attempts.";

const CharacterAdvice: React.FC<CharacterAdviceProps> = ({ 
  currentAdvice = defaultAdvice
}) => {
  const [advice, setAdvice] = useState(currentAdvice);
  const [isTyping, setIsTyping] = useState(false);
  
  useEffect(() => {
    setAdvice(currentAdvice);
  }, [currentAdvice]);

  // Handle dialogue typing status
  const handleTypingStatusChange = (typingStatus: boolean) => {
    setIsTyping(typingStatus);
  };

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Speech bubble positioned on the left side - allow pointer events */}
      <div className="pointer-events-auto">
        <SpeechBubble 
          text={advice} 
          onTypingStatusChange={handleTypingStatusChange}
        />
      </div>
      
      {/* Character positioned on the right side - allow pointer events */}
      <div className="pointer-events-auto">
        <RiveMainCharacter 
          isTalking={isTyping}
        />
      </div>
    </div>
  );
};

export default CharacterAdvice;
