import { io } from 'socket.io-client';

const SERVER_URL = 'https://anonymous-chat-server-cauu.onrender.com'; 
const TOTAL_USERS = 2000;
const CONNECTION_DELAY = 1000; 

const fakeUsers = [];

for (let i = 0; i < TOTAL_USERS; i++) {
  setTimeout(() => {
    const socket = io(SERVER_URL);

    socket.on('connect', () => {
      console.log(`User ${i + 1} connected: ${socket.id}`);
    });

    socket.on('onlineUsers', (count) => {
      console.log(`User ${i + 1} sees online users: ${count}`);
    });

    socket.on('matched', ({ roomId, partnerId }) => {
      console.log(`User ${i + 1} matched with ${partnerId} in room ${roomId}`);
      socket.emit('chat message', {
        roomId,
        msg: `Hello from user ${i + 1}`,
      });
    });

    socket.on('disconnect', () => {
      console.log(`User ${i + 1} disconnected`);
    });

    fakeUsers.push(socket);
  }, i * CONNECTION_DELAY); 
}
