import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Usuario } from '../modules/auth/auth.model';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    nombre: string;
    email: string;
    rol: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
      res.status(401).json({ message: 'Token no proporcionado' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    const user = await Usuario.findById(decoded.id).select('-password');

    if (!user || !user.activo) {
      res.status(401).json({ message: 'Usuario no autorizado o inactivo' });
      return;
    }

    req.user = { id: user._id.toString(), nombre: user.nombre, email: user.email, rol: user.rol };
    next();
  } catch {
    res.status(401).json({ message: 'Token inválido o expirado' });
  }
};
