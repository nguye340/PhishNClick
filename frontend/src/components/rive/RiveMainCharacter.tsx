"use client"

import React, { useEffect, useRef } from 'react';
import { useRive } from "@rive-app/react-canvas";

// Define the props interface
export interface RiveMainCharacterProps {
  width?: number;
  height?: number;
  className?: string;
  position?: 'left' | 'right';
  isAbsolute?: boolean;
  flipHorizontal?: boolean;
}

// Create the component with explicit type annotation
const RiveMainCharacter: React.FC<RiveMainCharacterProps> = ({
  width = 400,
  height = 400,
  className = "",
  position = 'right',
  isAbsolute = false,
  flipHorizontal = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { rive, RiveComponent } = useRive({
    src: "/rivAnim/capBig_4K.riv",
    autoplay: true,
    stateMachines: "StateMachine_Idle_Blink"
  });

  useEffect(() => {
    if (rive) {
      console.log("Rive instance loaded:", rive);
      console.log("Available state machines:", rive.stateMachineNames);
    }
  }, [rive]);
  
  return (
    <div 
      ref={containerRef}
      className={`fixed ${className}`}
      style={{
        position: 'fixed',
        bottom: '-500px', // Push extremely far down
        right: position === 'right' ? '-100px' : 'auto',
        left: position === 'left' ? '-100px' : 'auto',
        zIndex: 5,
        width: '650px',
        height: '1100px',
        overflow: 'visible'
      }}
    >
      <div 
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'visible'
        }}
      >
        {RiveComponent && (
          <RiveComponent 
            style={{ 
              position: 'absolute',
              width: '1300px', 
              height: '1300px',
              right: -150,
              bottom: '-1200px', // Push the artboard down much further
              transform: 'scale(4.4)',
              transformOrigin: 'bottom right',
              cursor: 'pointer'
            }} 
          />
        )}
      </div>
    </div>
  );
};

// Export both the component and its props interface
export default RiveMainCharacter;
