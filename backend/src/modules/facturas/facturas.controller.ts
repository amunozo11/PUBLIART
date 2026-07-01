import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import * as FacturasService from './facturas.service';

export const getAll = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const r = await FacturasService.getFacturas(req.query as Record<string, string>); res.json({ success: true, ...r }); }
  catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};
export const getById = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const f = await FacturasService.getFacturaById(req.params.id); res.json({ success: true, factura: f }); }
  catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};
export const create = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const f = await FacturasService.createFactura(req.body, req.user!.id); res.status(201).json({ success: true, factura: f }); }
  catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};
export const registrarPago = async (req: AuthRequest, res: Response): Promise<void> => {
  try { const f = await FacturasService.registrarPago(req.params.id, req.body, req.user!.id); res.json({ success: true, factura: f }); }
  catch (e: unknown) { const err = e as {statusCode?:number;message?:string}; res.status(err.statusCode||500).json({ success: false, message: err.message }); }
};

import { generarPDFCotizacion } from '../cotizaciones/pdf.generator';
export const generarPDF = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const fac = await FacturasService.getFacturaById(req.params.id);
    const clienteDoc = fac.cliente as any;

    const datos = {
      numero: fac.numero,
      fecha: (fac as any).createdAt as Date,
      validezDias: 0,
      cliente: {
        nombre: clienteDoc?.nombre || 'Cliente',
        nit: clienteDoc?.nit,
        telefono: clienteDoc?.telefono,
        direccion: clienteDoc?.direccion,
        ciudad: clienteDoc?.ciudad || 'Valledupar',
        correo: clienteDoc?.correo,
      },
      items: fac.items,
      subtotal: fac.subtotal,
      descuento: fac.descuento || 0,
      impuesto: fac.impuesto || 0,
      total: fac.total,
      observaciones: fac.observaciones,
    };

    const pdfBuffer = await generarPDFCotizacion(datos, 'FACTURA');
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Factura_${fac.numero}.pdf`);
    res.setHeader('Content-Length', pdfBuffer.length);
    res.end(pdfBuffer);
  } catch (e: unknown) {
    const err = e as { statusCode?: number; message?: string; stack?: string };
    console.error('ERROR AL GENERAR PDF FACTURA:', err);
    res.status(err.statusCode || 500).json({ success: false, message: err.message, stack: err.stack });
  }
};
