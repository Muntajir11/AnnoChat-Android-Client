export interface Message {
    id: string;
    text: string;
    sender: 'user' | 'stranger' | 'system';
    timestamp: Date;
  }