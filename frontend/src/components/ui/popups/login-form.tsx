import React, { useState } from 'react';

export interface LoginFormProps {
  title: string;
  message: string;
  onSubmit?: (data: Record<string, string>) => void;
  onClose?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ title, message, onSubmit, onClose }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit?.({ username, password });
  };

  return (
    <div className="p-4 bg-white rounded shadow border border-gray-300">
      <div className="font-bold mb-2">{title}</div>
      <div className="mb-4">{message}</div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input className="border rounded px-2 py-1" placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
        <input className="border rounded px-2 py-1" placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
        <div className="flex gap-2 justify-end mt-2">
          <button type="button" className="px-3 py-1 bg-gray-200 rounded" onClick={onClose}>Close</button>
          <button type="submit" className="px-3 py-1 bg-blue-500 text-white rounded">Sign In</button>
        </div>
      </form>
    </div>
  );
};
