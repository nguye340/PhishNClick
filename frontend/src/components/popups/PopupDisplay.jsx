'use client';

import { useState, useEffect } from 'react';
import SystemAlert from './popup-types/SystemAlert';
import BrowserNotification from './popup-types/BrowserNotification';
import LoginForm from './popup-types/LoginForm';
import SoftwareInstaller from './popup-types/SoftwareInstaller';
import { debugLog, debugError, debugWarn } from '@/lib/debug-utils';


/**
 * Main component for fetching and displaying popups from the backend
 */
export default function PopupDisplay() {
  const [popup, setPopup] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch a random popup from the backend
  const fetchRandomPopup = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Use the same API endpoint as in popup-manic-game.tsx
      const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/popup/random`;
      debugLog('Fetching popup from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      debugLog('Popup data received:', data);
      setPopup(data.data || data); // Handle both {data: popup} and direct popup response formats
    } catch (err) {
      debugError('Failed to fetch popup:', err);
      setError('Failed to load popup. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch a popup when the component mounts
  useEffect(() => {
    fetchRandomPopup();
  }, []);

  // Handle user interaction with the popup
  const handlePopupInteraction = (action) => {
    debugLog('User action:', action);
    // Here you would implement game logic based on the user's action
    // and whether it matches the popup's correct_action
    
    // For now, just fetch a new popup
    fetchRandomPopup();
  };

  // Render different components based on loading/error states
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[300px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
        <button 
          className="mt-3 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
          onClick={fetchRandomPopup}
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!popup) {
    return (
      <div className="text-center p-4">
        <p>No popup available.</p>
        <button 
          className="mt-3 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={fetchRandomPopup}
        >
          Get Popup
        </button>
      </div>
    );
  }

  // Render the appropriate popup component based on ui_type
  const renderPopupByType = () => {
    switch (popup.ui_type) {
      case 'system_alert':
        return <SystemAlert popup={popup} onInteraction={handlePopupInteraction} />;
      case 'browser_notification':
        return <BrowserNotification popup={popup} onInteraction={handlePopupInteraction} />;
      case 'login_form':
        return <LoginForm popup={popup} onInteraction={handlePopupInteraction} />;
      case 'software_installer':
        return <SoftwareInstaller popup={popup} onInteraction={handlePopupInteraction} />;
      default:
        // Fallback for other popup types not yet implemented
        return (
          <div className="border p-4 rounded-md shadow-md">
            <h3 className="text-lg font-bold">{popup.title}</h3>
            <p className="my-2">{popup.message}</p>
            <div className="text-sm text-gray-500">Popup Type: {popup.ui_type}</div>
            <div className="mt-3 flex gap-2">
              {popup.buttons && popup.buttons.map((button, index) => (
                <button
                  key={index}
                  className="px-3 py-1 bg-gray-200 hover:bg-gray-300 rounded"
                  onClick={() => handlePopupInteraction({
                    type: 'button_click',
                    buttonText: button.text,
                    isSafe: button.is_safe
                  })}
                >
                  {button.text}
                </button>
              ))}
            </div>
          </div>
        );
    }
  };

  return (
    <div className="popup-container">
      {renderPopupByType()}
    </div>
  );
}
