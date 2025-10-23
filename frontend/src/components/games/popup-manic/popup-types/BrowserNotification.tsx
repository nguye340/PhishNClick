import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Popup, PopupComponentProps } from './types';

interface BrowserNotificationProps extends PopupComponentProps {
  // All required props are already in PopupComponentProps
}

const BrowserNotification: React.FC<BrowserNotificationProps> = ({ 
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
  
  // Handle click on notification
  const handleNotificationClick = () => {
    setActive();
  };
  
  // Handle dismiss button click
  const handleDismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    onInteraction('close:safe');
  };
  
  // Handle button click
  const handleButtonClick = (e: React.MouseEvent, isSafe: boolean) => {
    e.stopPropagation();
    onInteraction(isSafe ? 'click:safe' : 'click:unsafe');
  };

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isActive ? 200 : 150,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`bg-gray-800 text-white rounded-md shadow-lg overflow-hidden w-80 border-2 ${isActive ? 'border-arcade-magenta' : 'border-gray-700'}`}
        onClick={() => setActive()}
      >
        {/* Header with icon and dismiss button */}
        <div className="flex items-center justify-between p-2 bg-gray-900">
          <div className="flex items-center">
            {popup.brand_elements?.logo_url && (
              <div className="mr-2 h-6 w-6 relative">
                <img 
                  src={popup.brand_elements.logo_url} 
                  alt="Logo"
                  width={24}
                  height={24}
                  className="object-contain"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = '/img/file-icon.png';
                  }}
                />
              </div>
            )}
            <div className="text-sm font-mono truncate">
              {popup.brand_elements?.impersonated_brand_name || popup.title || 'Notification'}
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
        
        {/* Content */}
        <div className="p-3">
          <p className="text-sm mb-3 font-mono">{popup.message}</p>
          
          {/* Buttons */}
          <div className="flex justify-end space-x-2">
            {popup.buttons?.map((button, index) => (
              <button
                key={index}
                className={`px-3 py-1 rounded text-xs font-mono ${
                  button.is_safe 
                    ? 'bg-arcade-cyan hover:bg-arcade-cyan/80 text-black font-medium' 
                    : 'bg-arcade-magenta hover:bg-arcade-magenta/80 text-white'
                }`}
                onClick={(e) => handleButtonClick(e, button.is_safe)}
              >
                {button.text}
              </button>
            ))}
            <button
              className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600"
              onClick={handleDismiss}
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default BrowserNotification;
