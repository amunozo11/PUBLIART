import { Cotizacion } from './cotizacion.model';
import { Factura } from '../facturas/factura.model';
import { findOrCreateCliente } from '../clientes/clientes.service';
import { createError } from '../../middleware/error.middleware';
import mongoose from 'mongoose';

export const getCotizaciones = async (query: Record<string, string>) => {
  const { search, estado, clienteId, page = '1', limit = '20' } = query;
  const filter: Record<string, unknown> = {};
  if (estado) filter.estado = estado;
  if (clienteId) filter.cliente = new mongoose.Types.ObjectId(clienteId);

  const total = await Cotizacion.countDocuments(filter);
  const cotizaciones = await Cotizacion.find(filter)
    .populate('cliente', 'nombre empresa telefono')
    .populate('creadoPor', 'nombre')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  return { cotizaciones, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

export const getCotizacionById = async (id: string) => {
  const cot = await Cotizacion.findById(id)
    .populate('cliente')
    .populate('creadoPor', 'nombre');
  if (!cot) throw createError('Cotización no encontrada', 404);
  return cot;
};

export const createCotizacion = async (data: Record<string, unknown>, userId: string) => {
  // Auto-crear cliente si se pasa nombre en vez de ID
  let clienteId = data.cliente as string;
  if (data.clienteNombre && !clienteId) {
    const c = await findOrCreateCliente(data.clienteNombre as string, userId);
    clienteId = c._id.toString();
  }

  // Calcular totales
  const items = (data.items as Array<Record<string, number>>) || [];
  const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const descuento = (data.descuento as number) || 0;
  const impuesto = (data.impuesto as number) || 19;
  const base = subtotal - descuento;
  const total = base + base * (impuesto / 100);

  return Cotizacion.create({
    ...data,
    cliente: clienteId,
    subtotal,
    total: Math.round(total),
    creadoPor: userId,
  });
};

export const updateCotizacion = async (id: string, data: Record<string, unknown>) => {
  if (data.items) {
    const items = data.items as Array<Record<string, number>>;
    data.subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
    const descuento = (data.descuento as number) || 0;
    const impuesto = (data.impuesto as number) || 19;
    const base = (data.subtotal as number) - descuento;
    data.total = Math.round(base + base * (impuesto / 100));
  }
  const cot = await Cotizacion.findByIdAndUpdate(id, data, { new: true });
  if (!cot) throw createError('Cotización no encontrada', 404);

  if (cot.convertidaAFactura && cot.facturaRef) {
    const factura = await Factura.findById(cot.facturaRef);
    if (factura) {
      factura.items = cot.items;
      factura.subtotal = cot.subtotal;
      factura.descuento = cot.descuento;
      factura.impuesto = cot.impuesto;
      factura.total = cot.total;
      // El pre-save hook de Factura recalculará el saldoPendiente y estado
      await factura.save();
    }
  }

  return cot;
};

export const convertirAFactura = async (cotizacionId: string, userId: string) => {
  const cot = await Cotizacion.findById(cotizacionId).populate('cliente');
  if (!cot) throw createError('Cotización no encontrada', 404);
  if (cot.convertidaAFactura) throw createError('Ya fue convertida a factura', 400);

  const factura = await Factura.create({
    cliente: cot.cliente,
    cotizacionRef: cot._id,
    items: cot.items,
    subtotal: cot.subtotal,
    descuento: cot.descuento,
    impuesto: cot.impuesto,
    total: cot.total,
    creadoPor: userId,
  });

  await Cotizacion.findByIdAndUpdate(cotizacionId, {
    convertidaAFactura: true,
    facturaRef: factura._id,
    estado: 'convertida',
  });

  return factura;
};

export const duplicarCotizacion = async (id: string, userId: string) => {
  const original = await Cotizacion.findById(id);
  if (!original) throw createError('Cotización no encontrada', 404);
  const { _id, numero, createdAt, updatedAt, convertidaAFactura, facturaRef, ...rest } = original.toObject() as any;
  return Cotizacion.create({ ...rest, creadoPor: userId, estado: 'borrador' });
};
