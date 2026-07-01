import { Factura } from './factura.model';
import { findOrCreateCliente } from '../clientes/clientes.service';
import { createError } from '../../middleware/error.middleware';
import mongoose from 'mongoose';

export const getFacturas = async (query: Record<string, string>) => {
  const { estado, clienteId, page = '1', limit = '20' } = query;
  const filter: Record<string, unknown> = {};
  if (estado) filter.estado = estado;
  if (clienteId) filter.cliente = new mongoose.Types.ObjectId(clienteId);

  const total = await Factura.countDocuments(filter);
  const facturas = await Factura.find(filter)
    .populate('cliente', 'nombre empresa telefono')
    .populate('creadoPor', 'nombre')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  return { facturas, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

export const getFacturaById = async (id: string) => {
  const f = await Factura.findById(id).populate('cliente').populate('creadoPor', 'nombre');
  if (!f) throw createError('Factura no encontrada', 404);
  return f;
};

export const createFactura = async (data: Record<string, unknown>, userId: string) => {
  let clienteId = data.cliente as string;
  if (data.clienteNombre && !clienteId) {
    const c = await findOrCreateCliente(data.clienteNombre as string, userId);
    clienteId = c._id.toString();
  }

  const items = (data.items as Array<Record<string, number>>) || [];
  const subtotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const descuento = (data.descuento as number) || 0;
  const impuesto = (data.impuesto as number) || 19;
  const base = subtotal - descuento;
  const total = base + base * (impuesto / 100);

  return Factura.create({ ...data, cliente: clienteId, subtotal, total: Math.round(total), creadoPor: userId });
};

export const registrarPago = async (id: string, pago: Record<string, unknown>, userId: string) => {
  const factura = await Factura.findById(id);
  if (!factura) throw createError('Factura no encontrada', 404);
  if (factura.estado === 'cancelada') throw createError('Factura cancelada', 400);

  factura.pagos.push({
    ...pago,
    usuario: new mongoose.Types.ObjectId(userId),
  } as never);

  await factura.save();
  return factura;
};

export const updateEstado = async (id: string, estado: string) => {
  const f = await Factura.findByIdAndUpdate(id, { estado }, { new: true });
  if (!f) throw createError('Factura no encontrada', 404);
  return f;
};
