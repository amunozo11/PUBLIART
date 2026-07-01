import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as GastosService from './gastos.service';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await GastosService.getGastos(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gasto = await GastosService.createGasto(req.body, req.user!.id);
    res.status(201).json({ success: true, gasto });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const gasto = await GastosService.updateGasto(req.params.id, req.body);
    res.json({ success: true, gasto });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await GastosService.deleteGasto(req.params.id);
    res.json({ success: true, message: 'Gasto eliminado exitosamente' });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
