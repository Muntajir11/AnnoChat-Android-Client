import config from '../config/config';

export const getVideoToken = async (): Promise<{ token: string; signature: string; expiresAt: number }> => {
  try {
    const apiUrl = `${config.webClientUrl}/api/video-token`;


    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'User-Agent': 'AnonymousChat-Android/1.0',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch (parseError) {
        console.error('❌ Failed to parse error response:', parseError);
        errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
      }
      
      if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Try again in ${errorData.retryAfter || 60} seconds.`);
      } else if (response.status === 404) {
        throw new Error('Video token API endpoint not found. Please check if the server is running.');
      } else if (response.status >= 500) {
        throw new Error(`Server error (${response.status}). Please try again later.`);
      } else {
        throw new Error(errorData.message || `HTTP ${response.status}: Failed to get authorization`);
      }
    }

    const data = await response.json();
    console.log('📦 Response data:', data);
    
    const { token, signature, expiresAt } = data;

    if (!token || !signature || !expiresAt) {
      console.error('❌ Invalid token response structure:', data);
      throw new Error('Invalid token response from server');
    }

    console.log('✅ Token fetched successfully');
    return { token, signature, expiresAt };
  } catch (error) {
    console.error('❌ Error getting video token:', error);
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Failed to get authorization: Request timeout (10s). Please check your internet connection.');
      } else if (error.message.includes('Network request failed')) {
        throw new Error('Failed to get authorization: Network error. Please check your internet connection and try again.');
      } else if (error.message.includes('Failed to fetch')) {
        throw new Error('Failed to get authorization: Cannot reach annochat.social. Please check your internet connection.');
      } else {
        throw new Error(`Failed to get authorization: ${error.message}`);
      }
    } else {
      throw new Error('Failed to get authorization: Unknown error occurred');
    }
  }
};
