'use client';

import React, { useState, useRef } from 'react';
import { BrowserNotification, ChatMessage, PhoneCallUI, VideoPlayerOverlay } from './popup-types';
// Import Popup type from the types file
import type { Popup } from './popup-types';

interface ModernPopupIntegrationProps {
  popup: Popup;
  onInteraction: (action: string) => void;
  position: { x: number; y: number };
  onPositionChange?: (newPosition: { x: number; y: number }) => void;
  onDragStart?: () => void;
  onDragEnd?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  isActive?: boolean;
  onClick?: () => void;
  style?: React.CSSProperties;
}

/**
 * Draggable popup component with window controls
 */
export default function ModernPopupIntegration({ 
  popup, 
  onInteraction,
  position,
  onPositionChange,
  onDragStart,
  onDragEnd,
  onMinimize,
  isMinimized = false,
  isActive = false,
  onClick,
  style = {}
}: ModernPopupIntegrationProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const windowRef = useRef<HTMLDivElement>(null);
  
  // Handle click on the popup
  const handleClick = () => {
    if (onClick) onClick();
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).classList.contains('drag-handle')) {
      setIsDragging(true);
      if (onDragStart) onDragStart(); // Notify parent that dragging started
      const rect = windowRef.current?.getBoundingClientRect();
      if (rect) {
        setDragOffset({
          x: e.clientX - rect.left,
          y: e.clientY - rect.top
        });
      }
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging && onPositionChange) {
      const popupWidth = windowRef.current?.offsetWidth ||  (popup.size?.width ?? 400);
      const popupHeight = windowRef.current?.offsetHeight || (popup.size?.height ?? 300);

      const newX = e.clientX - dragOffset.x;
      const newY = e.clientY - dragOffset.y;
      
      // Keep window within screen bounds with 16px margin
      const horizontalMargin = 16;
      const verticalMargin = 16;
      const maxX = Math.max(horizontalMargin, window.innerWidth - popupWidth - horizontalMargin);
      const maxY = Math.max(verticalMargin, window.innerHeight - popupHeight - verticalMargin);

      onPositionChange({
        x: Math.max(horizontalMargin, Math.min(newX, maxX)),
        y: Math.max(verticalMargin, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    if (isDragging && onDragEnd) {
      onDragEnd(); // Notify parent that dragging ended
    }
    setIsDragging(false);
  };

  React.useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragOffset]);
  
  // Debug logging
  console.log(`[ModernPopupIntegration] Rendering popup ${popup?.id} (${popup?.ui_type}):`, {
    isMinimized,
    position,
    isActive,
    hasPositionChange: !!onPositionChange,
    popupKeys: popup ? Object.keys(popup) : 'NO_POPUP'
  });

  // Early return after all hooks are declared
  if (!popup) {
    console.warn('[ModernPopupIntegration] No popup provided');
    return null;
  }
  
  if (isMinimized) {
    console.log(`[ModernPopupIntegration] Popup ${popup.id} is minimized`);
    return null;
  }
  
  // Render different popup UI types based on popup.ui_type
  console.log(`[ModernPopupIntegration] Rendering UI type: ${popup.ui_type}`);
  
  // Add default size if missing
  const popupWithDefaults = {
    ...popup,
    size: popup.size || { width: 400, height: 300 }
  };

  const popupWidth = popupWithDefaults.size.width;
  const popupHeight = popupWithDefaults.size.height;
  
  switch (popup.ui_type) {
    case 'browser_notification':
      console.log('[ModernPopupIntegration] Rendering BrowserNotification');
      return (
        <BrowserNotification
          popup={popupWithDefaults}
          onInteraction={(action) => onInteraction(action)}
          position={position}
          onPositionChange={onPositionChange}
          isActive={isActive}
          setActive={handleClick}
        />
      );
      
    case 'chat_message':
      return (
        <ChatMessage
          popup={popup}
          onInteraction={(action) => onInteraction(action)}
          position={position}
          onPositionChange={onPositionChange}
          isActive={isActive}
          setActive={handleClick}
        />
      );
      
    case 'phone_call_ui':
      return (
        <PhoneCallUI
          popup={popup}
          onInteraction={(action) => onInteraction(action)}
          position={position}
          onPositionChange={onPositionChange}
          isActive={isActive}
          setActive={handleClick}
        />
      );
      
    case 'video_player_overlay':
      return (
        <VideoPlayerOverlay
          popup={popup}
          onInteraction={(action) => onInteraction(action)}
          position={position}
          onPositionChange={onPositionChange}
          isActive={isActive}
          setActive={handleClick}
        />
      );
      
    // Default system_alert popup
    default:
      return (
        <div 
          ref={windowRef}
          className={`absolute bg-gray-900 border rounded-lg shadow-2xl z-50 backdrop-blur-sm overflow-visible select-none ${isActive ? 'border-arcade-magenta' : 'border-gray-600'}`}
          style={{
            left: position.x,
            top: position.y,
            width: popupWidth,
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.8)',
            cursor: isDragging ? 'grabbing' : 'default',
            zIndex: isActive ? 200 : 150
          }}
          onClick={handleClick}
        >
          {/* Windows-style header bar */}
          <div 
            className="bg-gray-800 border-b border-gray-600 px-3 py-2 flex items-center justify-between cursor-grab active:cursor-grabbing drag-handle"
            onMouseDown={handleMouseDown}
          >
            <div className="flex items-center gap-2">
              {/* Generic system icon based on popup type */}
              {popup.is_malicious ? (
                popup.category === 'security_warning' ? (
                  // Security warning icon
                  <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1l6.5 3v4.5c0 4.5-6.5 6.5-6.5 6.5S1.5 13 1.5 8.5V4L8 1z" fill="#ef4444"/>
                    <path d="M8 5v3M8 10h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                ) : popup.category === 'prize_reward' ? (
                  // Prize/gift icon
                  <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M3 5h10l-1 8H4L3 5zM8 1L6 3h4L8 1z" fill="#fbbf24"/>
                    <path d="M8 1v4" stroke="#92400e" strokeWidth="1"/>
                  </svg>
                ) : (
                  // Generic warning icon
                  <svg className="w-4 h-4 text-orange-400" fill="currentColor" viewBox="0 0 16 16">
                    <path d="M8 1l7 14H1L8 1z" fill="#fb923c"/>
                    <path d="M8 6v3M8 11h.01" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                )
              ) : (
                // Info icon for benign popups
                <svg className="w-4 h-4 text-blue-400" fill="currentColor" viewBox="0 0 16 16">
                  <circle cx="8" cy="8" r="7" fill="#60a5fa"/>
                  <path d="M8 4h.01M8 7v5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              )}
              
              {/* Header title */}
              <span className="text-xs font-bold text-gray-200 tracking-wider uppercase" style={{ fontFamily: 'monospace, "Courier New", Courier' }}>
                {popup.brand_elements?.impersonated_brand_name || 'System Notification'}
              </span>
            </div>
            
            {/* Window controls */}
            <div className="flex items-center gap-1">
              {onMinimize && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMinimize();
                  }}
                  className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-yellow-600 transition-all duration-200 text-sm font-bold"
                  aria-label="Minimize popup"
                >
                  −
                </button>
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onInteraction('close:safe');
                }}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-white hover:bg-red-600 transition-all duration-200 text-sm font-bold"
                aria-label="Close popup"
              >
                ×
              </button>
            </div>
          </div>
          
          {/* Popup content */}
          <div className="p-6" style={{ maxHeight: '60vh', overflow: 'auto' }}>
            <div className="mb-2 flex items-center gap-3">
              {/* Brand icon next to title */}
              {popup.brand_elements?.logo_url ? (
                <img 
                  src={popup.brand_elements.logo_url} 
                  alt="Brand icon" 
                  className="w-6 h-6 object-contain flex-shrink-0"
                  onError={(e) => {
                    // Hide image if it fails to load
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : null}
              
              <h3 className="font-bold text-base text-white" style={{ fontFamily: 'monospace, "Courier New", Courier', imageRendering: 'pixelated' }}>
                {popup.title || 'Security Alert'}
              </h3>
            </div>
          
          <div className="mb-6">
            <p className="text-base text-gray-300 leading-relaxed" style={{ fontFamily: 'monospace, "Courier New", Courier', imageRendering: 'pixelated' }}>
              {popup.message || popup.content || 'This is a security notification.'}
            </p>
          </div>
          </div>
          <div className="px-6 py-4 border-t border-gray-700 bg-gray-800 flex gap-3 justify-end">
            <button
              onClick={() => onInteraction('close')}
              className="px-5 py-2.5 bg-gray-700 text-gray-200 rounded-md text-base font-bold hover:bg-gray-600 active:bg-gray-800 transition-all duration-200"
              style={{ fontFamily: 'monospace, "Courier New", Courier', imageRendering: 'pixelated' }}
            >
              Cancel
            </button>
            <button
              onClick={() => onInteraction('click:unsafe')}
              className="px-5 py-2.5 bg-red-600 text-white rounded-md text-base font-bold hover:bg-red-500 active:bg-red-700 transition-all duration-200 shadow-lg hover:shadow-red-500/25"
              style={{ fontFamily: 'monospace, "Courier New", Courier', imageRendering: 'pixelated' }}
            >
              {popup.buttons?.[0]?.text || 'Continue'}
            </button>
          </div>
        </div>
      );
  }
}
