"use client"

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface FloatingSpeechBubbleProps {
  text: string;
}

const FloatingSpeechBubble: React.FC<FloatingSpeechBubbleProps> = ({ text }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const bubbleContent = (
    <div 
      style={{
        position: 'fixed',
        top: '80px',
        left: '20px',
        backgroundColor: '#FFFF00',
        color: '#000000',
        padding: '15px',
        borderRadius: '10px',
        boxShadow: '0 0 20px rgba(0, 255, 255, 0.8)',
        border: '4px solid #00FFFF',
        zIndex: 10000,
        maxWidth: '300px',
        minWidth: '250px',
        animation: 'floatBubble 2s infinite',
      }}
    >
      <p style={{ fontSize: '18px', fontWeight: 'bold' }}>{text}</p>
      <div 
        style={{
          position: 'absolute',
          right: '-15px',
          top: '50%',
          width: '30px',
          height: '30px',
          backgroundColor: '#FFFF00',
          border: '0 solid #00FFFF',
          borderRightWidth: '4px',
          borderBottomWidth: '4px',
          transform: 'rotate(45deg)',
        }}
      ></div>
      <style jsx global>{`
        @keyframes floatBubble {
          0% { transform: translateY(0); }
          50% { transform: translateY(-10px); }
          100% { transform: translateY(0); }
        }
      `}</style>
    </div>
  );

  // Use createPortal to render at the document body level
  return mounted ? createPortal(bubbleContent, document.body) : null;
};

export default FloatingSpeechBubble;
