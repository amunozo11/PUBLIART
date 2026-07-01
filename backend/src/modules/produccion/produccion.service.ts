import { TrabajoProduccion } from './trabajo.model';
import { findOrCreateCliente } from '../clientes/clientes.service';
import { createError } from '../../middleware/error.middleware';
import { generarMensajeTerminado, generarMensajeEntregado } from '../whatsapp/whatsapp.service';
import { Cliente } from '../clientes/cliente.model';
import mongoose from 'mongoose';

export const getTrabajoById = async (id: string) => {
  const trabajo = await TrabajoProduccion.findById(id)
    .populate('cliente', 'nombre empresa telefono correo ciudad')
    .populate('responsable', 'nombre avatar')
    .populate('creadoPor', 'nombre')
    .populate('historialEstados.usuario', 'nombre');
  if (!trabajo) throw createError('Trabajo no encontrado', 404);
  return trabajo;
};

export const getTrabajos = async (query: Record<string, string>) => {
  const { estado, maquina, responsable, cobrado, sinCliente, page = '1', limit = '50' } = query;
  const filter: Record<string, unknown> = {};
  if (estado) filter.estado = estado;
  if (maquina) filter.maquina = maquina;
  if (responsable) filter.responsable = new mongoose.Types.ObjectId(responsable);
  if (cobrado !== undefined) filter.cobrado = cobrado === 'true';
  if (sinCliente === 'true') filter.sinCliente = true;

  const total = await TrabajoProduccion.countDocuments(filter);
  const trabajos = await TrabajoProduccion.find(filter)
    .populate('cliente', 'nombre empresa telefono')
    .populate('responsable', 'nombre avatar')
    .populate('creadoPor', 'nombre')
    .sort({ createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  const sinAsignar = await TrabajoProduccion.countDocuments({ sinCliente: true });

  return { trabajos, total, sinAsignar };
};

/**
 * getKanban — Solo muestra trabajos ACTIVOS (sin entregado por defecto).
 * Con mostrarArchivados=true incluye entregados.
 */
export const getKanban = async (mostrarArchivados = false) => {
  const estadosActivos = ['pendiente', 'diseño', 'produccion', 'corte', 'terminado'];
  const estadosFiltro = mostrarArchivados
    ? [...estadosActivos, 'entregado']
    : estadosActivos;

  const trabajos = await TrabajoProduccion.find({ estado: { $in: estadosFiltro } })
    .populate('cliente', 'nombre empresa telefono')
    .populate('responsable', 'nombre avatar')
    .sort({ prioridad: -1, updatedAt: -1 })
    .limit(200);

  const columnas = mostrarArchivados
    ? [...estadosActivos, 'entregado']
    : estadosActivos;

  const kanban: Record<string, typeof trabajos> = {};
  columnas.forEach((e) => { kanban[e] = []; });
  trabajos.forEach((t) => { kanban[t.estado]?.push(t); });
  return kanban;
};

export const cambiarEstado = async (
  id: string,
  nuevoEstado: string,
  userId: string,
  observacion?: string
) => {
  const trabajo = await TrabajoProduccion.findById(id).populate('cliente', 'nombre empresa telefono');
  if (!trabajo) throw createError('Trabajo no encontrado', 404);

  const prevEstado = trabajo.estado;
  trabajo.estado = nuevoEstado as typeof trabajo.estado;
  trabajo.historialEstados.push({
    estado: nuevoEstado,
    usuario: new mongoose.Types.ObjectId(userId),
    fecha: new Date(),
    observacion,
  } as never);

  if (nuevoEstado === 'produccion' && !trabajo.tiempoInicio) {
    trabajo.tiempoInicio = new Date();
  }
  if (nuevoEstado === 'terminado' || nuevoEstado === 'entregado') {
    trabajo.tiempoFin = new Date();
  }

  await trabajo.save();

  // Generar payload de WhatsApp si el cliente tiene teléfono
  let whatsapp = null;
  const clienteDoc = trabajo.cliente as { nombre?: string; telefono?: string } | null;
  const telefono = clienteDoc?.telefono;
  const nombre = clienteDoc?.nombre || 'Cliente';
  const archivo = trabajo.descripcion || trabajo.archivo?.nombre || 'tu trabajo';

  if (telefono) {
    if (nuevoEstado === 'terminado') {
      whatsapp = generarMensajeTerminado(nombre, archivo, telefono);
    } else if (nuevoEstado === 'entregado') {
      whatsapp = generarMensajeEntregado(nombre, archivo, telefono);
    }
  }

  return { trabajo, prevEstado, whatsapp };
};

export const toggleCobrado = async (id: string, cobrado: boolean, valorCobrado?: number, notaCobro?: string) => {
  const updateData: any = { cobrado, valorCobrado, notaCobro };
  if (cobrado) {
    updateData.fechaCobro = new Date();
  } else {
    updateData.$unset = { fechaCobro: 1 };
  }

  const trabajo = await TrabajoProduccion.findByIdAndUpdate(
    id,
    updateData,
    { new: true }
  ).populate('cliente', 'nombre empresa').populate('responsable', 'nombre');
  if (!trabajo) throw createError('Trabajo no encontrado', 404);
  return trabajo;
};

export const marcarWhatsappEnviado = async (id: string) => {
  const trabajo = await TrabajoProduccion.findByIdAndUpdate(
    id,
    { whatsappEnviado: true },
    { new: true }
  );
  if (!trabajo) throw createError('Trabajo no encontrado', 404);
  return trabajo;
};

export const asignarCliente = async (
  trabajoId: string,
  clienteId: string | null,
  clienteNombre: string | null,
  userId: string
) => {
  let resolvedClienteId = clienteId;

  if (!resolvedClienteId && clienteNombre) {
    const cliente = await findOrCreateCliente(clienteNombre, userId);
    resolvedClienteId = cliente._id.toString();
  }

  if (!resolvedClienteId) throw createError('Se requiere clienteId o clienteNombre', 400);

  // Verificar que el cliente existe
  const cliente = await Cliente.findById(resolvedClienteId);
  if (!cliente) throw createError('Cliente no encontrado', 404);

  const trabajo = await TrabajoProduccion.findByIdAndUpdate(
    trabajoId,
    { cliente: resolvedClienteId, sinCliente: false },
    { new: true }
  )
    .populate('cliente', 'nombre empresa telefono')
    .populate('responsable', 'nombre');

  if (!trabajo) throw createError('Trabajo no encontrado', 404);
  return trabajo;
};

export const createTrabajo = async (data: Record<string, unknown>, userId: string) => {
  let clienteId = data.cliente as string;
  if (data.clienteNombre && !clienteId) {
    const c = await findOrCreateCliente(data.clienteNombre as string, userId);
    clienteId = c._id.toString();
  }

  // Calcular metrosCuadrados automáticamente si hay medidas
  const medidas = data.medidas as { alto?: number; ancho?: number; unidad?: string } | undefined;
  if (medidas?.alto && medidas?.ancho) {
    const factorM = medidas.unidad === 'cm' ? 0.01 : 1;
    const alto = (medidas.alto as number) * factorM;
    const ancho = (medidas.ancho as number) * factorM;
    (medidas as Record<string, unknown>).metrosCuadrados = parseFloat((alto * ancho).toFixed(4));
  }

  return TrabajoProduccion.create({
    ...data,
    medidas,
    cliente: clienteId,
    creadoPor: userId,
    sinCliente: !clienteId,
  });
};

export const updateTrabajo = async (id: string, data: Record<string, unknown>) => {
  const t = await TrabajoProduccion.findByIdAndUpdate(id, data, { new: true });
  if (!t) throw createError('Trabajo no encontrado', 404);
  return t;
};

export const deleteTrabajo = async (id: string) => {
  const t = await TrabajoProduccion.findByIdAndDelete(id);
  if (!t) throw createError('Trabajo no encontrado', 404);
  return t;
};
