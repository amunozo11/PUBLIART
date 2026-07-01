import mongoose from 'mongoose';
import { logger } from './logger';
import { seedAdmin } from '../modules/auth/auth.service';

export const connectDB = async (): Promise<void> => {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/publiart';

  try {
    await mongoose.connect(uri);
    logger.info(`✅ MongoDB conectado: ${mongoose.connection.host}`);

    // Crear administrador por defecto si no existe
    await seedAdmin();

    mongoose.connection.on('error', (err) => {
      logger.error('MongoDB error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('⚠️  MongoDB desconectado, intentando reconectar...');
    });
  } catch (error) {
    logger.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
};
