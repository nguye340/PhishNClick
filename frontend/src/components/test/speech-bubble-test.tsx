"use client"

import React from 'react';
import { SpeechBubble } from '@/components/ui';

const SpeechBubbleTest = () => {
  return (
    <div className="min-h-screen relative">
      <SpeechBubble text="This is a test speech bubble to verify visibility!" />
    </div>
  );
};

export default SpeechBubbleTest;
