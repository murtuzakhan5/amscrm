import { Server } from 'socket.io';
import { verifyAccessToken } from './jwt.js';
import { setSocketInstance } from '../services/notificationService.js';
import { env } from './env.js';

export const setupSocketIO = (httpServer) => {
  const io = new Server(httpServer, {
    cors: {
      origin: env.clientUrl,
      credentials: true,
    },
  });

  // Authenticate socket connections
  io.use((socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie;
      let token = socket.handshake.auth?.token;

      if (!token && cookieHeader) {
        const match = cookieHeader.match(/accessToken=([^;]+)/);
        if (match) token = match[1];
      }

      if (token) {
        const decoded = verifyAccessToken(token);
        if (decoded) {
          socket.user = decoded;
          return next();
        }
      }
      return next(); // allow anonymous socket or handle in connection
    } catch (err) {
      next();
    }
  });

  io.on('connection', (socket) => {
    if (socket.user && socket.user.id) {
      const room = `user:${socket.user.id}`;
      socket.join(room);
    }

    socket.on('join_user_room', (userId) => {
      if (userId) {
        socket.join(`user:${userId}`);
      }
    });

    socket.on('disconnect', () => {});
  });

  setSocketInstance(io);
  return io;
};
