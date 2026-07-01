import { Request, Response } from 'express';
import * as AuthService from './auth.service';
import { AuthRequest } from '../../middleware/auth.middleware';

export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const ip = req.ip || req.socket.remoteAddress || '';
    const userAgent = req.headers['user-agent'] || '';
    const { tokens, user } = await AuthService.login(email, password, ip, userAgent);
    res.json({ success: true, ...tokens, user });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;
    const tokens = await AuthService.refreshToken(refreshToken);
    res.json({ success: true, ...tokens });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 401).json({ success: false, message: err.message });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await AuthService.getMe(req.user!.id);
    res.json({ success: true, user });
  } catch (error: unknown) {
    const err = error as { message?: string };
    res.status(500).json({ success: false, message: err.message });
  }
};

export const logout = async (req: AuthRequest, res: Response): Promise<void> => {
  res.json({ success: true, message: 'Sesión cerrada' });
};
