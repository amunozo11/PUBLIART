import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { Auditoria } from '../modules/auditoria/auditoria.model';

// Rutas que se auditan automáticamente
const AUDIT_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const AUDIT_PATHS = ['/api/clientes', '/api/cotizaciones', '/api/facturas', '/api/produccion', '/api/usuarios'];

export const auditMiddleware = (req: AuthRequest, res: Response, next: NextFunction): void => {
  const shouldAudit = AUDIT_METHODS.includes(req.method) &&
    AUDIT_PATHS.some((p) => req.path.startsWith(p));

  if (!shouldAudit) return next();

  const originalSend = res.json.bind(res);
  const startTime = Date.now();

  res.json = (body: unknown) => {
    if (req.user && res.statusCode < 400) {
      const accion = req.method === 'POST' ? 'CREAR' :
        req.method === 'PUT' || req.method === 'PATCH' ? 'EDITAR' : 'ELIMINAR';

      Auditoria.create({
        usuario: req.user.id,
        accion,
        modulo: req.path.split('/')[2]?.toUpperCase() || 'SISTEMA',
        ip: req.ip || req.socket.remoteAddress,
        userAgent: req.headers['user-agent'],
        datos: req.body,
        duracionMs: Date.now() - startTime,
      }).catch(() => {});
    }
    return originalSend(body);
  };

  next();
};
