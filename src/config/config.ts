// Environment-based configuration utility for React Native
const isDevelopment = false; // Force production for direct connection

export const config = {
  isDevelopment,
  environment: 'production',
  
  // Production WebSocket URLs - connecting directly to your server
  websocketUrl: 'wss://muntajir.me',
  presenceUrl: 'wss://muntajir.me/presence', 
  videoUrl: 'wss://muntajir.me/video',
  
  // Web client API URL for token fetching
  webClientUrl: 'https://annochat.social',
};

// ICE servers configuration matching web client
export const ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

console.log('🌍 React Native Environment: Production (Direct Connection)');
console.log('🔗 WebSocket URLs:', {
  main: config.websocketUrl,
  presence: config.presenceUrl,
  video: config.videoUrl
});
console.log('🌐 Web Client URL:', config.webClientUrl);

export default config;
