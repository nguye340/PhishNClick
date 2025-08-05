'use client';

/**
 * Component for displaying browser notification style popups
 */
export default function BrowserNotification({ popup, onInteraction }) {
  // Handle button click
  const handleButtonClick = (button) => {
    onInteraction({
      type: 'button_click',
      buttonText: button.text,
      isSafe: button.is_safe
    });
  };

  // Handle dismiss
  const handleDismiss = () => {
    onInteraction({
      type: 'dismiss',
      action: 'CLOSE_LEGITIMATE_NATIVE'
    });
  };

  return (
    <div className="fixed top-4 right-4 max-w-sm w-full bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-50">
      <div className="flex items-center justify-between p-4 bg-gray-50 border-b">
        {popup.brand_elements?.logo_url && (
          <img 
            src={popup.brand_elements.logo_url} 
            alt={popup.brand_elements.impersonated_brand_name || "Notification"} 
            className="w-6 h-6 mr-2"
          />
        )}
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {popup.brand_elements?.impersonated_brand_name || "Notification"}
          </h4>
        </div>
        <button 
          onClick={handleDismiss}
          className="text-gray-400 hover:text-gray-500"
        >
          <span className="sr-only">Close</span>
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
      <div className="p-4">
        <h3 className="text-sm font-medium text-gray-900">{popup.title}</h3>
        <p className="mt-1 text-sm text-gray-500">{popup.message}</p>
        
        {popup.buttons && popup.buttons.length > 0 && (
          <div className="mt-3 flex space-x-2">
            {popup.buttons.map((button, index) => (
              <button
                key={index}
                className="inline-flex items-center px-2.5 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none"
                onClick={() => handleButtonClick(button)}
              >
                {button.text}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
