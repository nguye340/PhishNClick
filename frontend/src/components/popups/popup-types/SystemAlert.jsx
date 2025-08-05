'use client';

import { useState } from 'react';

/**
 * Component for displaying system alert style popups
 */
export default function SystemAlert({ popup, onInteraction }) {
  const [isHovered, setIsHovered] = useState(false);
  
  // Handle button click
  const handleButtonClick = (button) => {
    onInteraction({
      type: 'button_click',
      buttonText: button.text,
      isSafe: button.is_safe
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div 
        className="bg-white rounded-md shadow-lg max-w-md w-full p-4 border-2 border-gray-300"
        style={{ maxWidth: '450px' }}
      >
        <div className="flex items-center mb-4">
          {popup.brand_elements?.logo_url && (
            <img 
              src={popup.brand_elements.logo_url} 
              alt={popup.brand_elements.impersonated_brand_name || "System"} 
              className="w-8 h-8 mr-2"
            />
          )}
          <h3 className="text-lg font-bold">{popup.title}</h3>
        </div>
        
        <div className="my-4">
          <p>{popup.message}</p>
        </div>
        
        <div className="flex justify-end space-x-2 mt-4">
          {popup.buttons && popup.buttons.map((button, index) => (
            <button
              key={index}
              className={`px-4 py-2 rounded ${
                isHovered ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'
              }`}
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onClick={() => handleButtonClick(button)}
            >
              {button.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
