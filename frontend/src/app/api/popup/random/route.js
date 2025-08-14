import { NextResponse } from 'next/server';

// This is the URL of your backend server
const backendUrl = process.env.BACKEND_URL || process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export async function GET(request) {
  try {
    // Get query parameters from the request
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');
    
    // Build the URL for the backend API
    let apiUrl = `${backendUrl}/api/popup/random`;
    if (type) {
      apiUrl += `?type=${type}`;
    }
    
    console.log('Forwarding request to:', apiUrl);
    
    // Forward the request to the backend API
    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        // Add any other headers you need to forward
      },
      // Don't include credentials for now as per requirements
      // credentials: 'include',
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      throw new Error(`Backend API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    
    // Return the response from the backend
    return NextResponse.json({
      success: true,
      data: data.data || data // Handle both { data: ... } and direct response formats
    });
    
  } catch (error) {
    console.error('Error in /api/popup/random:', error);
    
    // Return a mock response for development if the backend is not available
    if (process.env.NODE_ENV === 'development') {
      console.warn('Using mock popup data due to error');
      return NextResponse.json({
        success: true,
        data: {
          id: 'mock-popup-1',
          title: 'Mock Popup',
          message: 'This is a mock popup used when the backend is not available.',
          ui_type: 'system_alert',
          category: 'benign_notification',
          is_malicious: false,
          correct_action: 'CLOSE_LEGITIMATE_NATIVE',
          style: {
            theme: 'windows',
            headerColor: '#0078D7',
            bodyColor: '#ffffff',
            borderColor: '#cccccc',
            borderWidth: 1,
            borderRadius: 3,
            fontFamily: 'Segoe UI, sans-serif',
            fontSize: '14px',
            boxShadow: '0 4px 8px rgba(0, 0, 0, 0.2)'
          }
        }
      });
    }
    
    // In production, return the actual error
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Failed to fetch random popup' 
      },
      { status: 500 }
    );
  }
}

// Enable CORS for the API route
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: corsHeaders,
  });
}
