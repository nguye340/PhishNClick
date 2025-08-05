'use client';

import { useEffect, useState } from 'react';
// Import the functions directly from the module
import { fetchRandomPopup, getMockPopup } from '@/components/games/popup-manic/popup-manic-game';

export default function PopupTestPage() {
  const [popup, setPopup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadRandomPopup = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // First try to fetch from the API
      try {
        const randomPopup = await fetchRandomPopup();
        setPopup(randomPopup);
      } catch (apiError) {
        console.warn('API fetch failed, using mock data:', apiError);
        // If API fails, use mock data
        const mockPopup = getMockPopup('benign');
        setPopup(mockPopup);
      }
    } catch (err) {
      console.error('Error loading popup:', err);
      setError('Failed to load popup. Check console for details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRandomPopup();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Loading popup...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-red-500 text-xl mb-4">Error: {error}</div>
        <button
          onClick={loadRandomPopup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">Popup Test Page</h1>
      
      <div className="mb-6">
        <button
          onClick={loadRandomPopup}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Load Another Popup
        </button>
      </div>

      {popup && (
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold mb-4">Popup Data</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Basic Info</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-sm">
                {JSON.stringify({
                  id: popup.id,
                  title: popup.title,
                  ui_type: popup.ui_type,
                  category: popup.category,
                  is_malicious: popup.is_malicious,
                  correct_action: popup.correct_action,
                }, null, 2)}
              </pre>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Message</h3>
              <div className="bg-gray-100 p-4 rounded whitespace-pre-wrap">
                {popup.message}
              </div>
            </div>
            <div className="md:col-span-2">
              <h3 className="font-medium text-gray-700">Full Data</h3>
              <pre className="bg-gray-100 p-2 rounded overflow-auto text-xs max-h-96">
                {JSON.stringify(popup, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
