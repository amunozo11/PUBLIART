import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as ClientesService from './clientes.service';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Cliente } from './cliente.model';

// ── Configuración multer para fotos de clientes ───────────────────────────────
const uploadDir = path.join(process.cwd(), 'uploads', 'clientes');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (req, _file, cb) => cb(null, `cliente_${req.params.id}_${Date.now()}.jpg`),
});
export const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });

export const getClientes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await ClientesService.getClientes(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getClienteById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cliente = await ClientesService.getClienteById(req.params.id);
    res.json({ success: true, cliente });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getHistorialCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const historial = await ClientesService.getHistorialCliente(req.params.id);
    res.json({ success: true, historial });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getResumenCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const resumen = await ClientesService.getResumenCliente(req.params.id);
    res.json({ success: true, ...resumen });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const createCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cliente = await ClientesService.createCliente(req.body, req.user!.id);
    res.status(201).json({ success: true, cliente });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const updateCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cliente = await ClientesService.updateCliente(req.params.id, req.body);
    res.json({ success: true, cliente });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const deleteCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ClientesService.deleteCliente(req.params.id);
    res.json({ success: true, message: 'Cliente eliminado' });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const createTrabajoParaCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trabajo = await ClientesService.createTrabajoManual(req.params.id, req.body, req.user!.id);
    res.status(201).json({ success: true, trabajo });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/** Subir o reemplazar la foto del cliente */
export const uploadFoto = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: 'No se recibió ninguna imagen' });
      return;
    }
    const rutaRelativa = `/uploads/clientes/${req.file.filename}`;
    const cliente = await Cliente.findByIdAndUpdate(
      req.params.id,
      { foto: rutaRelativa },
      { new: true }
    );
    if (!cliente) {
      res.status(404).json({ success: false, message: 'Cliente no encontrado' });
      return;
    }
    res.json({ success: true, foto: rutaRelativa, cliente });
  } catch (error: unknown) {
    const err = error as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
