"use client"

import React from 'react';

export interface SpeechBubbleProps {
  text: string;
  position?: 'left' | 'right';
  className?: string;
  style?: React.CSSProperties;
}

const SpeechBubble: React.FC<SpeechBubbleProps> = ({
  text,
  position = 'right',
  className = '',
  style = {}
}) => {
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
    >
      <p className="text-xl font-bold text-black">{text}</p>
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
