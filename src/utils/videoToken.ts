import config from '../config/config';

// Token cache interface
interface CachedToken {
  token: string;
  signature: string;
  expiresAt: number;
  fetchedAt: number;
}

// In-memory token cache
let tokenCache: CachedToken | null = null;

const isTokenValid = (cachedToken: CachedToken | null): cachedToken is CachedToken => {
  if (!cachedToken) return false;
  
  const now = Date.now();
  const expiryTime = cachedToken.expiresAt;
  
  // Add 5 minute buffer before expiry to be safe (5 * 60 * 1000 = 300000)
  const bufferTime = 300000;
  const effectiveExpiryTime = expiryTime - bufferTime;
  
  const isValid = now < effectiveExpiryTime;
  
  if (!isValid) {
    console.log('🔄 Token expired or will expire soon:', {
      now: new Date(now).toISOString(),
      expiresAt: new Date(expiryTime).toISOString(),
      effectiveExpiry: new Date(effectiveExpiryTime).toISOString(),
      remainingMinutes: Math.round((effectiveExpiryTime - now) / 60000)
    });
  }
  
  return isValid;
};

export const getVideoToken = async (): Promise<{ token: string; signature: string; expiresAt: number }> => {
  try {
    // Check if we have a valid cached token
    if (tokenCache && isTokenValid(tokenCache)) {
      // TypeScript now knows tokenCache is not null due to the guard above
      const cachedToken = tokenCache as CachedToken;
      const remainingTime = Math.round((cachedToken.expiresAt - Date.now()) / 60000);
      console.log(`🎯 Using cached token (valid for ${remainingTime} more minutes)`);
      return {
        token: cachedToken.token,
        signature: cachedToken.signature,
        expiresAt: cachedToken.expiresAt
      };
    }

    console.log('🔄 Fetching new token from server...');
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

    // Cache the new token
    tokenCache = {
      token,
      signature,
      expiresAt,
      fetchedAt: Date.now()
    };

    const validForMinutes = Math.round((expiresAt - Date.now()) / 60000);
    console.log(`✅ Token fetched successfully and cached (valid for ${validForMinutes} minutes)`);
    
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
        // Add token expiry specific handling
        if (error.message.includes('token') && error.message.includes('expired')) {
          // Clear cache on token expiry to force fresh token
          clearTokenCache();
          throw new Error('Session expired. Please try again.');
        }
        throw new Error(`Failed to get authorization: ${error.message}`);
      }
    } else {
      throw new Error('Failed to get authorization: Unknown error occurred');
    }
  }
};

// Add retry mechanism for failed token requests
export const getVideoTokenWithRetry = async (maxRetries: number = 3, retryDelay: number = 1000): Promise<{ token: string; signature: string; expiresAt: number }> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await getVideoToken();
    } catch (error) {
      lastError = error as Error;
      console.warn(`Token fetch attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        // Exponential backoff
        const delay = retryDelay * Math.pow(2, attempt - 1);
        console.log(`Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error('Failed to get token after retries');
};

// Optional: Function to clear the token cache manually
export const clearTokenCache = () => {
  console.log('🗑️ Clearing token cache');
  tokenCache = null;
};

// Optional: Function to check if we have a cached token
export const hasCachedToken = (): boolean => {
  return tokenCache !== null && isTokenValid(tokenCache);
};
