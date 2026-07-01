import jwt from 'jsonwebtoken';
import { Usuario, IUsuario } from './auth.model';
import { createError } from '../../middleware/error.middleware';
import { Auditoria } from '../auditoria/auditoria.model';

const generateTokens = (user: IUsuario) => {
  const payload = { id: user._id.toString() };
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any });
  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET as string, { expiresIn: (process.env.JWT_REFRESH_EXPIRES_IN || '7d') as any });
  return { accessToken, refreshToken };
};

export const login = async (email: string, password: string, ip: string, userAgent: string) => {
  const user = await Usuario.findOne({ email }).select('+password');
  if (!user || !user.activo) throw createError('Credenciales inválidas', 401);

  const isMatch = await user.comparePassword(password);
  if (!isMatch) throw createError('Credenciales inválidas', 401);

  user.ultimoAcceso = new Date();
  await user.save();

  await Auditoria.create({
    usuario: user._id,
    accion: 'LOGIN',
    modulo: 'AUTH',
    ip,
    userAgent,
  });

  const tokens = generateTokens(user);
  return { tokens, user };
};

export const refreshToken = async (token: string) => {
  try {
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { id: string };
    const user = await Usuario.findById(decoded.id);
    if (!user || !user.activo) throw createError('Token inválido', 401);
    return generateTokens(user);
  } catch {
    throw createError('Refresh token inválido', 401);
  }
};

export const getMe = async (userId: string) => {
  return Usuario.findById(userId).select('-password');
};

export const seedAdmin = async () => {
  try {
    const adminExists = await Usuario.findOne({ email: 'admin@publiart.co' });
    if (!adminExists) {
      await Usuario.create({
        nombre: 'Administrador',
        email: 'admin@publiart.co',
        password: 'publiart2024',
        rol: 'admin',
      });
      console.log('✅ Admin creado: admin@publiart.co / publiart2024');
    }
  } catch (err: unknown) {
    // Si ya existe (duplicate key u otro error), simplemente ignorar
    const e = err as { code?: number };
    if (e?.code !== 11000) {
      console.warn('⚠️  seedAdmin advertencia:', err);
    }
  }
};
