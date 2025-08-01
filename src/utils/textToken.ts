import config from '../config/config';

// Token cache interface
interface CachedTextToken {
  token: string;
  fetchedAt: number;
  expiresAt: number; // For future use if text tokens have expiry
}

// In-memory token cache
let textTokenCache: CachedTextToken | null = null;
let tokenFetchPromise: Promise<string | null> | null = null; // Prevent race conditions

const SOCKET_TOKEN_URL = "https://annochat.social/api/get-socket-token";

const isTextTokenValid = (cachedToken: CachedTextToken | null): cachedToken is CachedTextToken => {
  if (!cachedToken) return false;
  
  const now = Date.now();
  // For text tokens, let's cache for 10 minutes (600000ms) to avoid frequent requests
  const cacheValidityTime = 10 * 60 * 1000; // 10 minutes
  const tokenAge = now - cachedToken.fetchedAt;
  
  const isValid = tokenAge < cacheValidityTime;
  
  if (!isValid) {
    console.log('🔄 Text token expired or will expire soon:', {
      now: new Date(now).toISOString(),
      fetchedAt: new Date(cachedToken.fetchedAt).toISOString(),
      ageMinutes: Math.round(tokenAge / 60000),
      maxCacheMinutes: Math.round(cacheValidityTime / 60000)
    });
  }
  
  return isValid;
};

export const getTextToken = async (): Promise<string | null> => {
  try {
    // Check if we have a valid cached token
    if (textTokenCache && isTextTokenValid(textTokenCache)) {
      const remainingTime = Math.round((textTokenCache.fetchedAt + 10 * 60 * 1000 - Date.now()) / 60000);
      console.log(`🎯 Using cached text token (valid for ${remainingTime} more minutes)`);
      return textTokenCache.token;
    }

    // If a fetch is already in progress, wait for it
    if (tokenFetchPromise) {
      console.log('🔄 Text token fetch already in progress, waiting...');
      return await tokenFetchPromise;
    }

    console.log('🔄 Fetching new text token...');
    
    // Create the fetch promise to prevent race conditions
    tokenFetchPromise = (async () => {
      try {
        const res = await fetch(SOCKET_TOKEN_URL);
        const data = await res.json();
        
        if (data.token) {
          // Cache the new token
          textTokenCache = {
            token: data.token,
            fetchedAt: Date.now(),
            expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes from now
          };
          
          console.log('✅ Text token fetched and cached successfully');
          return data.token;
        } else {
          console.error('❌ No token in response');
          return null;
        }
      } finally {
        // Clear the promise when done
        tokenFetchPromise = null;
      }
    })();

    return await tokenFetchPromise;
  } catch (error) {
    tokenFetchPromise = null; // Clear on error
    console.error('❌ Failed to fetch text token:', error);
    return null;
  }
};

export const getTextTokenWithRetry = async (maxRetries: number = 3): Promise<string | null> => {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`🔄 Text token attempt ${attempt}/${maxRetries}`);
      const token = await getTextToken();
      if (token) {
        return token;
      }
      throw new Error('No token received');
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      console.warn(`⚠️ Text token attempt ${attempt} failed:`, error);
      
      if (attempt < maxRetries) {
        const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000); // Exponential backoff, max 5s
        console.log(`⏳ Retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  console.error(`❌ All ${maxRetries} text token attempts failed. Last error:`, lastError);
  throw lastError || new Error('Failed to get text token after retries');
};

export const hasCachedTextToken = (): boolean => {
  return textTokenCache !== null && isTextTokenValid(textTokenCache);
};

export const clearTextTokenCache = (): void => {
  console.log('🧹 Clearing text token cache');
  textTokenCache = null;
};

export const getTextTokenCacheInfo = () => {
  if (!textTokenCache) {
    return { cached: false };
  }
  
  const now = Date.now();
  const ageMinutes = Math.round((now - textTokenCache.fetchedAt) / 60000);
  const remainingMinutes = Math.round((textTokenCache.fetchedAt + 10 * 60 * 1000 - now) / 60000);
  
  return {
    cached: true,
    valid: isTextTokenValid(textTokenCache),
    fetchedAt: new Date(textTokenCache.fetchedAt).toISOString(),
    ageMinutes,
    remainingMinutes
  };
};
