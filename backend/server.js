import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { socketHandlers } from './socket/socketHandlers.js';
import cors from 'cors';

const app = express();
app.use(cors());
const server = http.createServer(app); 
const io = new Server(server, {
    cors: {
        origin: "http://localhost:3000", 
        methods: ["GET", "POST"]
    }
});

const PORT = process.env.PORT || 5000;

socketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
