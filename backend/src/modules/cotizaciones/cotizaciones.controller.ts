import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as CotizacionesService from './cotizaciones.service';
import { generarPDFCotizacion } from './pdf.generator';
import { Cliente } from '../clientes/cliente.model';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const result = await CotizacionesService.getCotizaciones(req.query as Record<string, string>);
    res.json({ success: true, ...result });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cot = await CotizacionesService.getCotizacionById(req.params.id);
    res.json({ success: true, cotizacion: cot });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cot = await CotizacionesService.createCotizacion(req.body, req.user!.id);
    res.status(201).json({ success: true, cotizacion: cot });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

export const update = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cot = await CotizacionesService.updateCotizacion(req.params.id, req.body);
    res.json({ success: true, cotizacion: cot });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

export const convertirAFactura = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const factura = await CotizacionesService.convertirAFactura(req.params.id, req.user!.id);
    res.json({ success: true, factura });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

export const duplicar = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cot = await CotizacionesService.duplicarCotizacion(req.params.id, req.user!.id);
    res.json({ success: true, cotizacion: cot });
  } catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

/** Genera y descarga el PDF de la cotización */
export const generarPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const cot = await CotizacionesService.getCotizacionById(req.params.id);
    const clienteDoc = cot.cliente as any; // Ya viene populado por el service

    const datos = {
      numero: cot.numero,
      fecha: (cot as any).createdAt as Date,
      validezDias: cot.validezDias || 15,
      cliente: {
        nombre: clienteDoc?.nombre || 'Cliente',
        nit: clienteDoc?.nit,
        telefono: clienteDoc?.telefono,
        direccion: clienteDoc?.direccion,
        ciudad: clienteDoc?.ciudad || 'Valledupar',
        correo: clienteDoc?.correo,
      },
      items: cot.items.map((item: any) => ({
        descripcion: item.descripcion,
        cantidad: item.cantidad,
        alto: item.alto,
        ancho: item.ancho,
        valorUnitario: item.valorUnitario,
        descuento: item.descuento,
        subtotal: item.subtotal,
      })),
      subtotal: cot.subtotal,
      descuento: cot.descuento,
      impuesto: cot.impuesto,
      total: cot.total,
      observaciones: cot.observaciones,
    };

    const pdfBuffer = await generarPDFCotizacion(datos);
    const fileName = `Cotizacion-${String(cot.numero).padStart(3, '0')}-${clienteDoc?.nombre?.replace(/\s+/g, '_') || 'Cliente'}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; stack?: string };
    console.error('ERROR AL GENERAR PDF:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message, stack: err.stack });
  }
};
