import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

export const roles = (...allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'No autenticado' });
      return;
    }
    if (!allowedRoles.includes(req.user.rol)) {
      res.status(403).json({ message: `Acceso denegado. Rol requerido: ${allowedRoles.join(' o ')}` });
      return;
    }
    next();
  };
};
