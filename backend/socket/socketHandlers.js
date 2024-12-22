let queue = [];

export const socketHandlers = (io) => {
    io.on('connection', (socket) => {
        console.log('A user connected: ' + socket.id);

        queue.push(socket);

        if (queue.length >= 2) {
            const user1 = queue.pop();
            const user2 = queue.pop();
            const roomId = `${user1.id}-${user2.id}`;
            user1.join(roomId);
            user2.join(roomId);

            user1.roomId = roomId;
            user2.roomId = roomId;

            user1.emit('matched', { roomId, partnerId: user2.id });
            user2.emit('matched', { roomId, partnerId: user1.id });

            console.log(`Room ${roomId} created with users: ${user1.id} and ${user2.id}`);
        }

        socket.on('chat message', (msg, roomId) => {
            console.log('Message from user ' + socket.id + ': ' + msg);
            io.to(roomId).emit('chat message', { msg, senderId: socket.id });
        });

        socket.on('disconnect', () => {
            console.log('User disconnected: ' + socket.id);

            const index = queue.indexOf(socket);
            if (index > -1) {
                queue.splice(index, 1);
            }

            const roomId = socket.roomId; 
            if (roomId) {
                io.to(roomId).emit('user disconnected', socket.id);
                console.log(`User ${socket.id} has left room ${roomId}`);
            }

            if (queue.length >= 2) {
                const user1 = queue.pop();
                const user2 = queue.pop();
                const newRoomId = `${user1.id}-${user2.id}`;
                user1.join(newRoomId);
                user2.join(newRoomId);

                user1.roomId = newRoomId;
                user2.roomId = newRoomId;

                user1.emit('matched', { roomId: newRoomId, partnerId: user2.id });
                user2.emit('matched', { roomId: newRoomId, partnerId: user1.id });
            }
        });
    });
};
