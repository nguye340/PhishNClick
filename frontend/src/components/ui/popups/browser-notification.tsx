import React from 'react';

export interface BrowserNotificationProps {
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  onClose?: () => void;
}

export const BrowserNotification: React.FC<BrowserNotificationProps> = ({ title, message, buttonText = 'Allow', onButtonClick, onClose }) => {
  return (
    <div className="p-4 bg-white rounded shadow border border-gray-300">
      <div className="font-bold mb-2">{title}</div>
      <div className="mb-4">{message}</div>
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Close</button>
        <button className="px-3 py-1 bg-blue-500 text-white rounded" onClick={onButtonClick}>{buttonText}</button>
      </div>
    </div>
  );
};
