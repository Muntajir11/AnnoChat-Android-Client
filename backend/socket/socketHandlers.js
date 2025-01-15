// let queue = [];
// let onlineUsers = 0;

// export const socketHandlers = io => {
  
//   io.on('connection', socket => {

//     onlineUsers++;
//     io.emit('onlineUsers', onlineUsers);
//     console.log(`Total online users: ${onlineUsers}`);

//     queue.push(socket);

//     if (queue.length >= 2) {
//       const user1 = queue.pop();
//       const user2 = queue.pop();
//       const roomId = `${user1.id}-${user2.id}`;
//       user1.join(roomId);
//       user2.join(roomId);

//       user1.roomId = roomId;
//       user2.roomId = roomId;

//       user1.emit('matched', {roomId, partnerId: user2.id});
//       user2.emit('matched', {roomId, partnerId: user1.id});
//     }

//     console.log(`${queue.length} users in queue`);

//     socket.on('chat message', data => {
//       socket.to(data.roomId).emit('chat message', {
//         msg: data.msg,
//         senderId: socket.id,
//       });
//     });

    
    
//     socket.on('disconnect', () => {
//       onlineUsers--;
//       io.emit('onlineUsers', onlineUsers);

//       console.log(`Total online users: ${onlineUsers}`);

//       const index = queue.indexOf(socket);
//       if (index > -1) {
//         queue.splice(index, 1);
//       }

//       const roomId = socket.roomId;
//       if (roomId) {
//         io.to(roomId).emit('user disconnected', socket.id);
//       }
      
      
//       if (queue.length >= 2) {
//         const user1 = queue.pop();
//         const user2 = queue.pop();
//         const newRoomId = `${user1.id}-${user2.id}`;
//         user1.join(newRoomId);
//         user2.join(newRoomId);

//         user1.roomId = newRoomId;
//         user2.roomId = newRoomId;

//         user1.emit('matched', {roomId: newRoomId, partnerId: user2.id});
//         user2.emit('matched', {roomId: newRoomId, partnerId: user1.id});
//       }

//       console.log(`${queue.length} users in queue`);

//     });
    
//   });
// }; 

export const socketHandlers = io => {
  io.on('connection', socket => {
    console.log('A user connected:', socket.id);

    // io.emit('hi', 'Hello to all connected clients!');
    socket.on('hi', data => {
      console.log('Received hi from client:', data);
      
      socket.broadcast.emit('hi', data);
    });

    socket.on('disconnect', () => {
      console.log('A user disconnected:', socket.id);
    });
  });
};
