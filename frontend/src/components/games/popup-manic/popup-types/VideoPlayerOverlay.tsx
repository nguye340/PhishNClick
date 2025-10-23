import React, { useState } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import type { Popup, PopupComponentProps } from './types';

interface VideoPlayerOverlayProps extends PopupComponentProps {
  // All required props are already in PopupComponentProps
}

const VideoPlayerOverlay: React.FC<VideoPlayerOverlayProps> = ({ 
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
    onInteraction('close:safe');
  };
  
  // Handle button click
  const handleButtonClick = (e: React.MouseEvent, isSafe: boolean) => {
    e.stopPropagation();
    onInteraction(isSafe ? 'click:safe' : 'click:unsafe');
  };

  // Get video info from popup
  const videoTitle = popup.brand_elements?.impersonated_brand_name || popup.title || 'Video Player';
  const videoThumbnail = popup.brand_elements?.logo_url || '/img/video-thumbnail.png';

  return (
    <motion.div
      className="absolute"
      style={{
        left: position.x,
        top: position.y,
        zIndex: isActive ? 200 : 150,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <div 
        className={`bg-black/80 backdrop-blur-sm text-white rounded-md shadow-lg overflow-hidden w-96 border-2 ${isActive ? 'border-arcade-magenta' : 'border-gray-700'}`}
        onClick={() => setActive()}
      >
        {/* Video player header */}
        <div className="flex items-center justify-between p-2 bg-black/90">
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
                    target.src = '/img/video-icon.png';
                  }}
                />
              </div>
            )}
            <div className="text-sm font-mono truncate">
              {videoTitle}
            </div>
          </div>
          <button 
            className="text-gray-400 hover:text-white focus:outline-none"
            onClick={handleDismiss}
          >
            ×
          </button>
        </div>
        
        {/* Video content area */}
        <div className="relative">
          {/* Video thumbnail/placeholder */}
          <div className="relative h-48 w-full bg-gray-900">
            <img 
              src="https://i.imgur.com/JyCLRZX.jpg"
              alt="Video Thumbnail"
              className="w-full h-full object-cover opacity-80"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.onerror = null;
                target.src = '/img/video-thumbnail.png';
              }}
            />
            
            {/* Play button overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="h-16 w-16 rounded-full bg-black/50 flex items-center justify-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            
            {/* Message overlay */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="bg-black/70 p-4 rounded-md max-w-[80%] text-center">
                <p className="text-sm font-mono mb-3">{popup.message}</p>
                
                {/* Action buttons */}
                <div className="flex justify-center space-x-2">
                  {popup.buttons?.map((button: any, index: number) => (
                    <button
                      key={index}
                      className={`px-3 py-1 rounded text-xs font-mono ${
                        button.is_safe 
                          ? 'bg-arcade-cyan hover:bg-arcade-cyan/80' 
                          : 'bg-arcade-magenta hover:bg-arcade-magenta/80'
                      }`}
                      onClick={(e) => handleButtonClick(e, button.is_safe)}
                    >
                      {button.text}
                    </button>
                  ))}
                  {!popup.buttons?.length && (
                    <>
                      <button
                        className="px-3 py-1 rounded text-xs font-mono bg-arcade-magenta hover:bg-arcade-magenta/80"
                        onClick={(e) => handleButtonClick(e, false)}
                      >
                        Update Now
                      </button>
                      <button
                        className="px-3 py-1 rounded text-xs font-mono bg-gray-700 hover:bg-gray-600"
                        onClick={handleDismiss}
                      >
                        Dismiss
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          
          {/* Video controls */}
          <div className="bg-black/90 p-2 flex items-center">
            <button className="text-white mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
            <div className="flex-grow bg-gray-700 h-1 rounded-full overflow-hidden">
              <div className="bg-arcade-cyan h-full" style={{ width: '30%' }}></div>
            </div>
            <div className="text-xs text-gray-400 ml-3 font-mono">1:23 / 4:56</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default VideoPlayerOverlay;
