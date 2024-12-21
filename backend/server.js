import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", // Replace with your frontend's URL
        methods: ["GET", "POST"]
    }
});

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 5000;


// app.get('/', (req, res) => {
//     res.sendFile(join(__dirname, 'index.html'));
// });

io.on('connection', (socket) => {
    console.log('A user connected'); 

    socket.on('chat message', (msg) => {
        console.log('message: ' + msg);
        
        io.emit('chat message', msg);
    });

    socket.on('disconnect', () => {
        console.log('A user disconnected'); 
    });
});

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
