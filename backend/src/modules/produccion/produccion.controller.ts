import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as ProduccionService from './produccion.service';
import { calcularValorPorTipo } from './parser/formula.engine';
import { TrabajoProduccion } from './trabajo.model';
import { exec } from 'child_process';
import path from 'path';
import { io } from '../../server';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = await ProduccionService.getTrabajos(req.query as Record<string, string>);
    res.json({ success: true, ...r });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trabajo = await ProduccionService.getTrabajoById(req.params.id);
    res.json({ success: true, trabajo });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const getKanban = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const mostrarArchivados = req.query.mostrarArchivados === 'true';
    const kanban = await ProduccionService.getKanban(mostrarArchivados);
    res.json({ success: true, kanban });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const t = await ProduccionService.createTrabajo(req.body, req.user!.id);
    io.emit('nuevo-trabajo', { trabajo: t });
    res.status(201).json({ success: true, trabajo: t });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const cambiarEstado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { estado, observacion } = req.body;
    const { trabajo, prevEstado, whatsapp } = await ProduccionService.cambiarEstado(
      req.params.id,
      estado,
      req.user!.id,
      observacion
    );
    io.emit('estado-trabajo', { trabajoId: req.params.id, prevEstado, nuevoEstado: estado, whatsapp });
    res.json({ success: true, trabajo, whatsapp });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const toggleCobrado = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { cobrado, valorCobrado, notaCobro } = req.body;
    const trabajo = await ProduccionService.toggleCobrado(req.params.id, cobrado, valorCobrado, notaCobro);
    res.json({ success: true, trabajo });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const marcarWhatsapp = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trabajo = await ProduccionService.marcarWhatsappEnviado(req.params.id);
    res.json({ success: true, trabajo });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const asignarCliente = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { clienteId, clienteNombre } = req.body;
    const trabajo = await ProduccionService.asignarCliente(
      req.params.id,
      clienteId || null,
      clienteNombre || null,
      req.user!.id
    );
    io.emit('trabajo-actualizado', { trabajo });
    res.json({ success: true, trabajo });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const t = await ProduccionService.updateTrabajo(req.params.id, req.body);
    res.json({ success: true, trabajo: t });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

export const remove = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    await ProduccionService.deleteTrabajo(req.params.id);
    res.json({ success: true, message: 'Trabajo eliminado' });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Calcula el valor de un trabajo en tiempo real dado tipo + medidas (en cm).
 * GET /produccion/calcular-valor?tipo=vinilo&alto=100&ancho=200
 */
export const calcularValor = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { tipo = 'vinilo', alto = '0', ancho = '0', cantidad = '1', precio = '0' } = req.query as Record<string, string>;
    const result = calcularValorPorTipo(tipo, {
      alto: parseFloat(alto) || 0,
      ancho: parseFloat(ancho) || 0,
      precio: parseFloat(precio) || 0,
      cantidad: parseInt(cantidad) || 1,
    });
    res.json({ success: true, ...result });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};

/**
 * Abre la ubicación del archivo del trabajo en el Explorador de Windows.
 * POST /produccion/:id/abrir-explorador
 * Solo funciona en Windows (donde corre el servidor).
 */
export const abrirEnExplorador = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const trabajo = await TrabajoProduccion.findById(req.params.id).select('archivo');
    if (!trabajo) {
      res.status(404).json({ success: false, message: 'Trabajo no encontrado' });
      return;
    }

    const ruta = trabajo.archivo?.ruta;
    if (!ruta) {
      res.status(400).json({ success: false, message: 'Este trabajo no tiene ruta de archivo' });
      return;
    }

    // Normalizar ruta a backslashes para Windows
    const rutaWindows = path.normalize(ruta);

    // Abrir explorer seleccionando el archivo
    exec(`explorer /select,"${rutaWindows}"`, (err) => {
      if (err) {
        // El error de explorer a veces es falso positivo en Windows, ignorar
        console.warn('Explorer exec warning (puede ser normal):', err.message);
      }
    });

    res.json({ success: true, message: 'Abriendo explorador...', ruta: rutaWindows });
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string };
    res.status(err.statusCode || 500).json({ success: false, message: err.message });
  }
};
