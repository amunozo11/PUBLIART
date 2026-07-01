import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { createServer } from 'http';
import { Server as SocketServer } from 'socket.io';

import { connectDB } from './config/database';
import { logger } from './config/logger';
import { errorHandler } from './middleware/error.middleware';
import { auditMiddleware } from './middleware/audit.middleware';

// Routes
import authRoutes from './modules/auth/auth.routes';
import usuariosRoutes from './modules/usuarios/usuarios.routes';
import clientesRoutes from './modules/clientes/clientes.routes';
import cotizacionesRoutes from './modules/cotizaciones/cotizaciones.routes';
import facturasRoutes from './modules/facturas/facturas.routes';
import produccionRoutes from './modules/produccion/produccion.routes';
import reportesRoutes from './modules/reportes/reportes.routes';
import dashboardRoutes from './modules/dashboard/dashboard.routes';
import configuracionRoutes from './modules/configuracion/configuracion.routes';
import auditoriaRoutes from './modules/auditoria/auditoria.routes';
import notificacionesRoutes from './modules/notificaciones/notificaciones.routes';

import { startFolderWatcher } from './modules/produccion/watcher/folder.watcher';

const app = express();
const httpServer = createServer(app);

// Socket.io
export const io = new SocketServer(httpServer, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(helmet({ crossOriginEmbedderPolicy: false }));
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(morgan('combined', { stream: { write: (msg) => logger.http(msg.trim()) } }));
app.use(auditMiddleware);

import gastosRoutes from './modules/gastos/gastos.routes';

// Servir archivos estáticos (fotos de clientes, etc.)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/cotizaciones', cotizacionesRoutes);
app.use('/api/facturas', facturasRoutes);
app.use('/api/produccion', produccionRoutes);
app.use('/api/reportes', reportesRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/notificaciones', notificacionesRoutes);
app.use('/api/gastos', gastosRoutes);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'OK', service: 'PUBLIART API', timestamp: new Date().toISOString() });
});

// Error handler
app.use(errorHandler);

// Socket connection
io.on('connection', (socket) => {
  logger.info(`🔌 Cliente conectado: ${socket.id}`);
  socket.on('join-room', (room: string) => socket.join(room));
  socket.on('disconnect', () => logger.info(`🔌 Cliente desconectado: ${socket.id}`));
});

// Start
const PORT = process.env.PORT || 5000;

const start = async () => {
  try {
    await connectDB();
    httpServer.listen(PORT, () => {
      logger.info(`🚀 PUBLIART API corriendo en puerto ${PORT}`);
      logger.info(`📁 Monitoreando carpeta: ${process.env.PRODUCCION_PATH || 'D:/PRODUCCION'}`);
      startFolderWatcher(io);
    });
  } catch (error) {
    logger.error('Error al iniciar servidor:', error);
    process.exit(1);
  }
};

start();
