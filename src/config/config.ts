const EMULATOR_HOST = '10.0.2.2';

export const config = __DEV__
  ? {
      serverHttp: `http://${EMULATOR_HOST}:5000`,
      serverWs: `ws://${EMULATOR_HOST}:5000`,
      turnUrl: '',
      turnUser: '',
      turnPass: '',
      iceTransportPolicy: 'all' as 'all' | 'relay',
    }
  : {
      serverHttp: 'https://api.annochat.me',
      serverWs: 'wss://api.annochat.me',
      turnUrl: '',
      turnUser: '',
      turnPass: '',
      iceTransportPolicy: 'all' as 'all' | 'relay',
    };

export function iceServers() {
  const servers: { urls: string; username?: string; credential?: string }[] = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ];
  if (config.turnUrl) {
    servers.push({
      urls: config.turnUrl,
      username: config.turnUser,
      credential: config.turnPass,
    });
  }
  return servers;
}

export default config;
