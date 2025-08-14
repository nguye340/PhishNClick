import React from 'react';

export interface SoftwareInstallerProps {
  title: string;
  message: string;
  buttonText?: string;
  onButtonClick?: () => void;
  onClose?: () => void;
}

export const SoftwareInstaller: React.FC<SoftwareInstallerProps> = ({ title, message, buttonText = 'Install Now', onButtonClick, onClose }) => {
  return (
    <div className="p-4 bg-white rounded shadow border border-gray-300">
      <div className="font-bold mb-2">{title}</div>
      <div className="mb-4">{message}</div>
      <div className="flex gap-2 justify-end">
        <button className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Close</button>
        <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={onButtonClick}>{buttonText}</button>
      </div>
    </div>
  );
};
