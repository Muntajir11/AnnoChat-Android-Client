import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import { socketHandlers } from './socket/socketHandlers.js';
import cors from 'cors';
import { Redis } from 'ioredis';  
import { createAdapter } from "@socket.io/redis-streams-adapter";

const PORT = process.env.PORT || 5000;
const app = express();

app.use(cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    methods: ["GET", "POST"]
}));

const server = http.createServer(app);

const redisClient = new Redis({
    host: 'localhost',
    port: 6379,
    db: 0,
});

redisClient.ping()
    .then(response => console.log('Redis connected:', response)) // Should log 'PONG'
    .catch(err => console.error('Error connecting to Redis:', err));


const io = new Server(server, {
    cors: {
        origin: ["http://localhost:3000", "http://localhost:3001"]
    },

    adapter: createAdapter(redisClient),
});


socketHandlers(io);

server.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
