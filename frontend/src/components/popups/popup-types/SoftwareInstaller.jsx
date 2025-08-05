'use client';

import { useState } from 'react';

/**
 * Component for displaying software installer style popups
 */
export default function SoftwareInstaller({ popup, onInteraction }) {
  const [currentStep, setCurrentStep] = useState(0);
  const [isInstalling, setIsInstalling] = useState(false);
  const [progress, setProgress] = useState(0);
  
  // Handle button click
  const handleButtonClick = (button) => {
    // If this is an "Install" or "Update" button, show progress
    if (button.text.toLowerCase().includes('install') || 
        button.text.toLowerCase().includes('update') ||
        button.text.toLowerCase().includes('download')) {
      simulateInstallation();
    } else {
      // Otherwise just handle the interaction normally
      onInteraction({
        type: 'button_click',
        buttonText: button.text,
        isSafe: button.is_safe
      });
    }
  };
  
  // Simulate an installation process
  const simulateInstallation = () => {
    setIsInstalling(true);
    
    const interval = setInterval(() => {
      setProgress(prev => {
        const newProgress = prev + 10;
        
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setIsInstalling(false);
            onInteraction({
              type: 'installation_complete',
              isSafe: false // Software installations from popups are typically not safe
            });
          }, 500);
          return 100;
        }
        
        return newProgress;
      });
    }, 300);
  };
  
  // Handle next step in multi-step installer
  const handleNextStep = () => {
    if (currentStep < 2) {
      setCurrentStep(prev => prev + 1);
    } else {
      // On final step, trigger installation
      simulateInstallation();
    }
  };
  
  // Handle cancel
  const handleCancel = () => {
    onInteraction({
      type: 'cancel',
      action: 'FORCE_CLOSE_OS_LEVEL'
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header with software name */}
        <div className="bg-gray-100 p-4 border-b flex items-center justify-between">
          <div className="flex items-center">
            {popup.brand_elements?.logo_url && (
              <img 
                src={popup.brand_elements.logo_url} 
                alt={popup.brand_elements.impersonated_brand_name || "Software"} 
                className="w-8 h-8 mr-2"
              />
            )}
            <h3 className="text-lg font-medium">
              {popup.brand_elements?.impersonated_brand_name || popup.title}
            </h3>
          </div>
          <button 
            onClick={handleCancel}
            className="text-gray-400 hover:text-gray-500"
          >
            <span className="sr-only">Close</span>
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        </div>
        
        {/* Installer body */}
        <div className="p-6">
          {isInstalling ? (
            <div className="text-center">
              <h4 className="text-lg font-medium mb-4">Installing...</h4>
              <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                <div 
                  className="bg-blue-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500">{progress}% complete</p>
            </div>
          ) : (
            <>
              {currentStep === 0 && (
                <div>
                  <h4 className="text-lg font-medium mb-2">{popup.title}</h4>
                  <p className="mb-4 text-gray-600">{popup.message}</p>
                  
                  <div className="flex justify-between mt-6">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 1 && (
                <div>
                  <h4 className="text-lg font-medium mb-2">License Agreement</h4>
                  <div className="border border-gray-200 rounded p-3 h-40 overflow-y-auto mb-4 text-sm text-gray-600">
                    <p>By installing this software, you agree to the terms and conditions...</p>
                    <p className="mt-2">Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam in dui mauris.</p>
                    <p className="mt-2">Vivamus suscipit tortor eget felis porttitor volutpat. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices.</p>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <input id="agree" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" />
                    <label htmlFor="agree" className="ml-2 text-sm text-gray-700">
                      I agree to the license terms
                    </label>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleNextStep}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
              
              {currentStep === 2 && (
                <div>
                  <h4 className="text-lg font-medium mb-2">Installation Options</h4>
                  
                  <div className="mb-4">
                    <div className="flex items-center mb-2">
                      <input id="typical" type="radio" name="install-type" className="h-4 w-4 text-blue-600 border-gray-300" defaultChecked />
                      <label htmlFor="typical" className="ml-2 text-sm text-gray-700">
                        Typical Installation
                      </label>
                    </div>
                    <div className="flex items-center">
                      <input id="custom" type="radio" name="install-type" className="h-4 w-4 text-blue-600 border-gray-300" />
                      <label htmlFor="custom" className="ml-2 text-sm text-gray-700">
                        Custom Installation
                      </label>
                    </div>
                  </div>
                  
                  <div className="flex items-center mb-4">
                    <input id="desktop" type="checkbox" className="h-4 w-4 text-blue-600 border-gray-300 rounded" defaultChecked />
                    <label htmlFor="desktop" className="ml-2 text-sm text-gray-700">
                      Create desktop shortcut
                    </label>
                  </div>
                  
                  <div className="flex justify-between">
                    <button
                      onClick={handleCancel}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    {popup.buttons && popup.buttons.length > 0 ? (
                      popup.buttons.map((button, index) => (
                        <button
                          key={index}
                          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                          onClick={() => handleButtonClick(button)}
                        >
                          {button.text}
                        </button>
                      ))
                    ) : (
                      <button
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                        onClick={() => simulateInstallation()}
                      >
                        Install Now
                      </button>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
