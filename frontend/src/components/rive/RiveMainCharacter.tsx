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
  isTalking?: boolean;
}

// Create the component with explicit type annotation
const RiveMainCharacter: React.FC<RiveMainCharacterProps> = ({
  width = 400,
  height = 400,
  className = "",
  position = 'right',
  isAbsolute = false,
  flipHorizontal = false,
  isTalking = false
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const { rive, RiveComponent } = useRive({
    src: "/rivAnim/capBig_4K2.riv",
    autoplay: true,
    stateMachines: "StateMachine_Idle_Blink"
  });

  useEffect(() => {
    if (rive) {
      console.log("Rive instance loaded:", rive);
      console.log("Available state machines:", rive.stateMachineNames);
      
      // Set up inputs if they exist
      const inputs = rive.stateMachineInputs("StateMachine_Idle_Blink");
      if (inputs) {
        const talkingInput = inputs.find(input => input.name === "isTalking");
        if (talkingInput) {
          console.log("Found isTalking input");
        }
      }
    }
  }, [rive]);
  
  // Update the isTalking input whenever the prop changes
  useEffect(() => {
    if (rive) {
      try {
        const inputs = rive.stateMachineInputs("StateMachine_Idle_Blink");
        if (inputs) {
          const talkingInput = inputs.find(input => input.name === "isTalking");
          if (talkingInput) {
            console.log(`Updating isTalking state machine input to ${isTalking} (current value: ${talkingInput.value})`);
            talkingInput.value = isTalking;
          }
        }
      } catch (error) {
        console.error("Error setting isTalking input:", error);
      }
    }
  }, [rive, isTalking]);
  
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
              right: -450,//-150 with 4K
              bottom: '-1300px', //-1200 with 4K/ Push the artboard down much further
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
