'use client';

import { useState } from 'react';

/**
 * Component for displaying login form style popups
 */
export default function LoginForm({ popup, onInteraction }) {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  
  // Handle input change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    onInteraction({
      type: 'form_submit',
      data: formData,
      // In a real game, you'd determine if this is the correct action based on popup.correct_action
      isSafe: false // Login forms in phishing scenarios are typically not safe
    });
  };
  
  // Handle button click (e.g., "Cancel" or "Close")
  const handleButtonClick = (button) => {
    onInteraction({
      type: 'button_click',
      buttonText: button.text,
      isSafe: button.is_safe
    });
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header with brand */}
        <div className="bg-blue-600 p-4 text-white flex items-center">
          {popup.brand_elements?.logo_url && (
            <img 
              src={popup.brand_elements.logo_url} 
              alt={popup.brand_elements.impersonated_brand_name || "Login"} 
              className="w-8 h-8 mr-2"
            />
          )}
          <h3 className="text-lg font-medium">
            {popup.brand_elements?.impersonated_brand_name 
              ? `${popup.brand_elements.impersonated_brand_name} Login` 
              : popup.title}
          </h3>
        </div>
        
        {/* Form body */}
        <div className="p-6">
          <p className="mb-4 text-gray-600">{popup.message}</p>
          
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email or Username
              </label>
              <input
                type="text"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="mb-6">
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="flex items-center justify-between">
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Sign In
              </button>
            </div>
          </form>
          
          {/* Additional buttons */}
          <div className="mt-4 flex justify-end space-x-2">
            {popup.buttons && popup.buttons.map((button, index) => (
              <button
                key={index}
                className="text-sm text-gray-500 hover:text-gray-700"
                onClick={() => handleButtonClick(button)}
              >
                {button.text}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
