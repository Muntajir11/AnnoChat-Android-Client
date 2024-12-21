import { Server } from 'socket.io';

let waitingUsers = []; 

const socketSetup = (server) => {
    const io = new Server(server, {
        cors: {
		origin: ["http://localhost:3000"],
		methods: ["GET", "POST"],
	},
    });

    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);

        socket.on('join chat', () => {
            waitingUsers.push(socket);

            if (waitingUsers.length >= 2) {
                const user1 = waitingUsers.pop();
                const user2 = waitingUsers.pop();

                user1.emit('match', 'You are matched with another user!');
                user2.emit('match', 'You are matched with another user!');

                user1.emit('start chat', 'Chat started with user 2');
                user2.emit('start chat', 'Chat started with user 1');
            }
        });

        socket.on('chat message', (msg) => {
            console.log('Message received: ' + msg);
            socket.broadcast.emit('chat message', msg); 
        });

        socket.on('disconnect', () => {
            console.log('User disconnected: ' + socket.id);
            waitingUsers = waitingUsers.filter((user) => user !== socket);
        });
    });
};

export default socketSetup;
