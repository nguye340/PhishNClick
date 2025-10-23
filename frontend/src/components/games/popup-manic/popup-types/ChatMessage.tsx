import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Popup, PopupComponentProps } from './types';

interface ChatMessageProps extends PopupComponentProps {
  // All required props are already in PopupComponentProps
}

const ChatMessage: React.FC<ChatMessageProps> = ({ 
  popup, 
  onInteraction, 
  position, 
  onPositionChange,
  isActive,
  setActive
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStartPosition, setDragStartPosition] = useState({ x: 0, y: 0 });
  
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
  
  // Handle mouse move for dragging
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && onPositionChange) {
      const newPosition = {
        x: e.clientX - dragStartPosition.x,
        y: e.clientY - dragStartPosition.y
      };
      onPositionChange(newPosition);
    }
  };
  
  // Handle mouse up to stop dragging
  const handleMouseUp = () => {
    setIsDragging(false);
  };
  
  // Handle dismiss button click
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    // Use normal close action so it can be evaluated for correctness
    onInteraction('close:safe');
  };
  
  // Handle button click
  const handleButtonClick = (e: React.MouseEvent, isSafe: boolean) => {
    e.stopPropagation();
    onInteraction(isSafe ? 'click:safe' : 'click:unsafe');
  };

  // Generate a fake conversation based on the popup message
  const generateChatMessages = () => {
    const messageParts = popup.message.split('. ');
    const result = [];
    
    // Add agent greeting
    result.push({
      sender: 'agent',
      text: `Hello! I'm ${popup.brand_elements?.impersonated_brand_name || 'Support'}.`,
      time: '2 min ago'
    });
    
    // Add first part of message as agent message
    if (messageParts.length > 0) {
      result.push({
        sender: 'agent',
        text: messageParts[0] + (messageParts.length > 1 ? '.' : ''),
        time: '1 min ago'
      });
    }
    
    // Add remaining parts as separate messages
    for (let i = 1; i < Math.min(messageParts.length, 3); i++) {
      result.push({
        sender: 'agent',
        text: messageParts[i] + '.',
        time: 'Just now'
      });
    }
    
    return result;
  };
  
  const chatMessages = generateChatMessages();
  const agentName = popup.brand_elements?.impersonated_brand_name || 'Support Agent';
  const agentAvatarUrl = popup.brand_elements?.logo_url || '/img/support-avatar.png';

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
        className={`bg-gray-900 text-white rounded-md shadow-lg overflow-hidden w-96 border-2 ${isActive ? 'border-arcade-magenta' : 'border-gray-700'}`}
        onClick={() => setActive()}
      >
        {/* Chat header */}
        <div className="flex items-center justify-between p-3 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center">
            <div className="relative h-8 w-8 rounded-full overflow-hidden mr-2 bg-gray-700">
              <img 
                src={agentAvatarUrl}
                alt="Agent Avatar"
                width={32}
                height={32}
                className="object-cover"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = '/img/support-avatar.png';
                }}
              />
            </div>
            <div>
              <div className="text-base font-mono font-bold">{agentName}</div>
              <div className="text-sm text-green-400 font-mono">Online</div>
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-white focus:outline-none text-xl font-bold w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-all duration-200"
            onClick={handleDismiss}
            aria-label="Close chat"
          >
            ×
          </button>
        </div>
        
        {/* Chat messages */}
        <div className="p-3 h-56 overflow-y-auto bg-gray-900 flex flex-col space-y-3">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex ${message.sender === 'agent' ? 'justify-start' : 'justify-end'}`}>
              {message.sender === 'agent' && (
                <div className="relative h-6 w-6 rounded-full overflow-hidden mr-2 flex-shrink-0 bg-gray-700">
                  <Image 
                    src={agentAvatarUrl}
                    alt="Agent Avatar"
                    width={24}
                    height={24}
                    className="object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/img/support-avatar.png';
                    }}
                  />
                </div>
              )}
              <div>
                <div className={`rounded-lg p-2 max-w-[240px] text-base font-mono ${
                  message.sender === 'agent' ? 'bg-gray-800' : 'bg-arcade-cyan'
                }`}>
                  {message.text}
                </div>
                <div className="text-sm text-gray-500 mt-1 font-mono">{message.time}</div>
              </div>
            </div>
          ))}
        </div>
        
        {/* Chat input */}
        <div className="p-3 border-t border-gray-700 bg-gray-800">
          <div className="flex">
            <input 
              type="text" 
              className="flex-grow bg-gray-700 text-white rounded-l-md px-3 py-2 text-base font-mono focus:outline-none"
              placeholder="Type a message..."
              disabled
              onClick={(e) => e.stopPropagation()}
            />
            {popup.buttons?.map((button: any, index: number) => (
              <button
                key={index}
                className={`px-3 py-2 text-xs font-mono ${
                  index === 0 ? 'rounded-r-md' : ''
                } ${
                  button.is_safe 
                    ? 'bg-arcade-cyan hover:bg-arcade-cyan/80' 
                    : 'bg-arcade-magenta hover:bg-arcade-magenta/80'
                }`}
                onClick={(e) => handleButtonClick(e, button.is_safe)}
              >
                {button.text || 'Send'}
              </button>
            ))}
            {!popup.buttons?.length && (
              <button
                className="bg-arcade-magenta hover:bg-arcade-magenta/80 px-3 py-2 rounded-r-md text-xs font-mono"
                onClick={(e) => handleButtonClick(e, false)}
              >
                Send
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatMessage;
