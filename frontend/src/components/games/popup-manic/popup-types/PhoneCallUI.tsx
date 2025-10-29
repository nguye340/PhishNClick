import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import type { PopupComponentProps } from './types';

interface PhoneCallUIProps extends PopupComponentProps {
  // All required props are already in PopupComponentProps
}

const PhoneCallUI: React.FC<PhoneCallUIProps> = ({ 
  popup, 
  onInteraction, 
  position, 
  onPositionChange,
  isActive,
  setActive
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  const [callDuration, setCallDuration] = useState(0);
  const [isRinging, setIsRinging] = useState(true);
  const ringtoneRef = useRef<HTMLAudioElement>(null);
  
  // Format call duration as MM:SS
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Play ringtone ONCE only when call starts - no looping, no duplication
  useEffect(() => {
    const playRingtone = async () => {
      if (isRinging && ringtoneRef.current) {
        try {
          // CRITICAL: Check if already playing to prevent duplication
          if (!ringtoneRef.current.paused) {
            debugLog('Ringtone already playing, skipping duplicate');
            return;
          }
          
          ringtoneRef.current.loop = false; // Play ONCE only
          ringtoneRef.current.volume = 0.05; // Very low volume (was 0.3)
          ringtoneRef.current.currentTime = 0; // Reset to beginning
          
          await ringtoneRef.current.play();
          debugLog('Ringtone playing ONCE');
        } catch (error) {
          debugLog('Ringtone play failed (likely due to autoplay policy):', error);
        }
      } else if (!isRinging && ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
        debugLog('Ringtone stopped');
      }
    };
    
    playRingtone();
    
    // Cleanup on unmount
    return () => {
      if (ringtoneRef.current) {
        ringtoneRef.current.pause();
        ringtoneRef.current.currentTime = 0;
      }
    };
  }, [isRinging]);
  
  // Increment call duration every second if call is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (!isRinging) {
      interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRinging]);
  
  // Handle mouse down for dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    setDragStartPosition({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    setActive();
  };
  
  // Handle mouse move for dragging with boundary checking
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && onPositionChange) {
      const popupWidth = 300; // Phone popup width (w-72 = 288px)
      const popupHeight = 400; // Phone popup height
      
      // Calculate new position
      let newX = e.clientX - dragStartPosition.x;
      let newY = e.clientY - dragStartPosition.y;
      
      // Boundary checking - keep popup on screen
      const minX = 0;
      const minY = 0;
      const maxX = window.innerWidth - popupWidth;
      const maxY = window.innerHeight - popupHeight;
      
      // Clamp position within bounds
      newX = Math.max(minX, Math.min(maxX, newX));
      newY = Math.max(minY, Math.min(maxY, newY));
      
      onPositionChange({ x: newX, y: newY });
    }
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle answer call
  const handleAnswer = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    setIsRinging(false);
    // Directly handle the interaction without showing security response
    onInteraction(popup.is_malicious ? 'click:unsafe' : 'click:safe');
  };
  
  // Handle decline call
  const handleDecline = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Stop ringtone
    if (ringtoneRef.current) {
      ringtoneRef.current.pause();
      ringtoneRef.current.currentTime = 0;
    }
    // Directly handle the interaction without showing security response
    onInteraction('close:safe');
  };
  
  // Handle end call
  const handleEndCall = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction('close:safe');
  };

  // Get caller info from popup
  const callerName = popup.brand_elements?.impersonated_brand_name || popup.title || 'Unknown Caller';
  const callerNumber = (popup.brand_elements as any)?.contact_info || '+1 (555) 123-4567';
  
  // Generate random background color and initials for caller avatar
  const getCallerInitials = (name: string) => {
    return name.split(' ').map(word => word[0]).join('').toUpperCase().slice(0, 2);
  };
  
  const getRandomAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-green-500', 'bg-yellow-500', 'bg-purple-500',
      'bg-pink-500', 'bg-indigo-500', 'bg-teal-500', 'bg-orange-500', 'bg-cyan-500'
    ];
    const hash = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };
  
  const callerInitials = getCallerInitials(callerName);
  const avatarBgColor = getRandomAvatarColor(callerName);
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';


  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isActive ? 200 : 150,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`bg-gray-900 text-white rounded-lg shadow-lg overflow-hidden w-72 border-2 ${isActive ? 'border-arcade-magenta' : 'border-gray-700'}`}
        onClick={() => setActive()}
      >
        {/* Phone call header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="text-sm font-mono">
            {isRinging ? 'Incoming Call' : 'Call in Progress'}
          </div>
          <button 
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={handleDecline}
          >
            ×
          </button>
        </div>
        
        {/* Caller info */}
        <div className="p-4 flex flex-col items-center">
          <div className={`relative h-20 w-20 rounded-full mb-3 border-2 border-gray-700 flex items-center justify-center ${avatarBgColor}`}>
            <span className="text-white font-bold text-xl">
              {callerInitials}
            </span>
          </div>
          
          <h3 className="text-lg font-bold font-mono mb-1">{callerName}</h3>
          <p className="text-sm text-gray-400 font-mono mb-2">{callerNumber}</p>
          
          {isRinging ? (
            <motion.div 
              className="text-arcade-cyan font-mono text-sm mb-3"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            >
              Ringing...
            </motion.div>
          ) : (
            <div className="text-arcade-cyan font-mono text-sm mb-3">
              {formatDuration(callDuration)}
            </div>
          )}
          
          {/* Call message */}
          {!isRinging && (
            <div className="bg-gray-800 p-3 rounded-md mb-3 w-full">
              <p className="text-sm font-mono">{popup.message}</p>
            </div>
          )}
        </div>
        
        {/* Call actions */}
        <div className="p-3 flex justify-center space-x-4 bg-gray-800">
          {isRinging ? (
            <>
              <button
                className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                onClick={handleDecline}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
              <button
                className="h-12 w-12 rounded-full bg-green-600 hover:bg-green-700 flex items-center justify-center"
                onClick={handleAnswer}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                </svg>
              </button>
            </>
          ) : (
            <button
              className="h-12 w-12 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
              onClick={handleEndCall}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      
      {/* Hidden audio element for ringtone */}
      <audio
        ref={ringtoneRef}
        preload="auto"
        style={{ display: 'none' }}
      >
        <source src="/components/games/popup-manic/sounds/ringtone-018-151768.mp3" type="audio/mpeg" />
        Your browser does not support the audio element.
      </audio>
      
      {/* Security Response Modal - Removed as per requirements */}
    </motion.div>
  );
};

export default PhoneCallUI;
