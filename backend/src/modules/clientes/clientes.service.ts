import { Cliente, ICliente } from './cliente.model';
import { createError } from '../../middleware/error.middleware';
import { generarLinkContacto } from '../whatsapp/whatsapp.service';
import mongoose from 'mongoose';

// ── Fuzzy matching helpers ────────────────────────────────────────────────────

/** Normaliza un nombre para comparación: minúsculas, sin tildes, sin caracteres especiales */
const normalizarNombre = (n: string): string =>
  n
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

/** Genera bigrams de un string para comparación Sørensen–Dice */
const bigrams = (s: string): Set<string> => {
  const pairs = new Set<string>();
  for (let i = 0; i < s.length - 1; i++) {
    pairs.add(s[i] + s[i + 1]);
  }
  return pairs;
};

/** Coeficiente de Dice entre dos strings (0 = nada igual, 1 = idénticos) */
const diceCoefficient = (a: string, b: string): number => {
  if (a === b) return 1;
  if (a.length < 2 || b.length < 2) return 0;
  const aB = bigrams(a);
  const bB = bigrams(b);
  let intersection = 0;
  for (const bg of aB) {
    if (bB.has(bg)) intersection++;
  }
  return (2 * intersection) / (aB.size + bB.size);
};

/** Verifica si todos los tokens de `query` están contenidos en `target` */
const todosTokensContenidos = (query: string, target: string): boolean => {
  const tokens = query.split(' ').filter((t) => t.length > 2);
  return tokens.every((t) => target.includes(t));
};

export interface ClienteSimilarResult {
  cliente: ICliente;
  score: number;
  esExacto: boolean;
}

/**
 * Busca el cliente existente más similar al nombre dado usando fuzzy matching.
 * No crea clientes nuevos — devuelve null si no hay match.
 *
 * Criterios (en orden de prioridad):
 *  1. Match exacto (case-insensitive + normalizado) → score 1.0
 *  2. Todos los tokens del nombre están en el nombre del cliente → score 0.9
 *  3. Coeficiente Dice ≥ 0.75 → score = dice value
 */
export const findClienteSimilar = async (
  nombre: string
): Promise<ClienteSimilarResult | null> => {
  if (!nombre || nombre.trim().length < 2) return null;

  const normalQuery = normalizarNombre(nombre);

  // Traer todos los clientes activos (excluye SIN ASIGNAR)
  const clientes = await Cliente.find({
    nombre: { $nin: ['SIN ASIGNAR', 'sin asignar'] },
  }).select('nombre empresa estado');

  let bestMatch: ClienteSimilarResult | null = null;

  for (const cliente of clientes) {
    const normalCliente = normalizarNombre(cliente.nombre);

    // 1. Match exacto
    if (normalQuery === normalCliente) {
      return { cliente, score: 1.0, esExacto: true };
    }

    // 2. Tokens contenidos
    let score = 0;
    if (todosTokensContenidos(normalQuery, normalCliente) || todosTokensContenidos(normalCliente, normalQuery)) {
      score = 0.9;
    } else {
      // 3. Dice coefficient
      score = diceCoefficient(normalQuery, normalCliente);
    }

    if (score > (bestMatch?.score ?? 0)) {
      bestMatch = { cliente, score, esExacto: false };
    }
  }

  // Solo devolver si supera el umbral mínimo
  return bestMatch && bestMatch.score >= 0.6 ? bestMatch : null;
};

export const findOrCreateCliente = async (
  nombre: string,
  userId?: string
): Promise<ICliente> => {
  const existente = await Cliente.findOne({ nombre: new RegExp(`^${nombre}$`, 'i') });
  if (existente) return existente;

  return Cliente.create({
    nombre,
    estado: 'potencial',
    creadoAutomaticamente: true,
    creadoPor: userId ? new mongoose.Types.ObjectId(userId) : undefined,
  });
};

export const getClientes = async (query: {
  search?: string;
  estado?: string;
  page?: number;
  limit?: number;
}) => {
  const { search, estado, page = 1, limit = 20 } = query;
  const filter: Record<string, unknown> = {};

  if (search) {
    filter.$or = [
      { nombre: { $regex: search, $options: 'i' } },
      { empresa: { $regex: search, $options: 'i' } },
      { correo: { $regex: search, $options: 'i' } },
      { telefono: { $regex: search, $options: 'i' } },
    ];
  }
  if (estado) filter.estado = estado;

  const total = await Cliente.countDocuments(filter);
  const clientes = await Cliente.find(filter)
    .populate('creadoPor', 'nombre')
    .sort({ createdAt: -1 })
    .skip((Number(page) - 1) * Number(limit))
    .limit(Number(limit));

  return { clientes, total, page, totalPages: Math.ceil(total / Number(limit)) };
};

export const getClienteById = async (id: string) => {
  const cliente = await Cliente.findById(id).populate('creadoPor', 'nombre');
  if (!cliente) throw createError('Cliente no encontrado', 404);
  return cliente;
};

export const createCliente = async (data: Partial<ICliente>, userId: string) => {
  return Cliente.create({ ...data, creadoPor: userId });
};

export const updateCliente = async (id: string, data: Partial<ICliente>) => {
  const cliente = await Cliente.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!cliente) throw createError('Cliente no encontrado', 404);
  return cliente;
};

export const deleteCliente = async (id: string) => {
  const cliente = await Cliente.findByIdAndDelete(id);
  if (!cliente) throw createError('Cliente no encontrado', 404);
  return cliente;
};

export const getHistorialCliente = async (clienteId: string) => {
  const { Cotizacion } = await import('../cotizaciones/cotizacion.model');
  const { Factura } = await import('../facturas/factura.model');
  const { TrabajoProduccion } = await import('../produccion/trabajo.model');

  const [cotizaciones, facturas, trabajos] = await Promise.all([
    Cotizacion.find({ cliente: clienteId }).sort({ createdAt: -1 }).limit(20),
    Factura.find({ cliente: clienteId }).sort({ createdAt: -1 }).limit(20),
    TrabajoProduccion.find({ cliente: clienteId }).sort({ createdAt: -1 }).limit(20),
  ]);

  return { cotizaciones, facturas, trabajos };
};

export const getResumenCliente = async (clienteId: string) => {
  const { Cotizacion } = await import('../cotizaciones/cotizacion.model');
  const { Factura } = await import('../facturas/factura.model');
  const { TrabajoProduccion } = await import('../produccion/trabajo.model');

  const cliente = await Cliente.findById(clienteId);
  if (!cliente) throw createError('Cliente no encontrado', 404);

  const [cotizaciones, facturas, trabajos] = await Promise.all([
    Cotizacion.find({ cliente: clienteId }).sort({ createdAt: -1 }),
    Factura.find({ cliente: clienteId }).sort({ createdAt: -1}),
    TrabajoProduccion.find({ cliente: clienteId })
      .populate('responsable', 'nombre')
      .sort({ createdAt: -1 }),
  ]);

  const facturasActivas = facturas.filter((f) => f.estado !== 'cancelada');
  const totalFacturado = facturasActivas.reduce((sum, f) => sum + (f.total || 0), 0);

  // Calcular deuda: suma de saldos pendientes en facturas no canceladas
  const deudaTotal = facturasActivas.reduce((sum, f) => {
    const saldo = (f.saldoPendiente !== undefined ? f.saldoPendiente : (f.total || 0) - (f.totalPagado || 0));
    return sum + Math.max(0, saldo);
  }, 0);

  const trabajosActivos = trabajos.filter((t) =>
    ['pendiente', 'diseño', 'produccion', 'corte'].includes(t.estado)
  );
  const trabajosTerminados = trabajos.filter((t) =>
    ['terminado', 'entregado'].includes(t.estado)
  );

  // Trabajos terminados pendientes de entrega (terminado pero no entregado ni con WA enviado)
  const trabajosPendientesAviso = trabajos.filter((t) => t.estado === 'terminado' && !t.whatsappEnviado);

  // Estadísticas por tipo
  const statsPorTipo: Record<string, number> = {};
  trabajos.forEach((t) => {
    statsPorTipo[t.tipo] = (statsPorTipo[t.tipo] || 0) + 1;
  });

  // Link de WhatsApp si el cliente tiene teléfono
  const whatsappContacto = cliente.telefono
    ? generarLinkContacto(cliente.nombre, cliente.telefono)
    : null;

  return {
    cliente,
    stats: {
      totalFacturado,
      deudaTotal,
      numFacturas: facturasActivas.length,
      numCotizaciones: cotizaciones.length,
      trabajosActivos: trabajosActivos.length,
      trabajosTerminados: trabajosTerminados.length,
      trabajosPendientesAviso: trabajosPendientesAviso.length,
      statsPorTipo,
    },
    trabajosActivos,
    trabajosTodos: trabajos,
    ultimasCotizaciones: cotizaciones.slice(0, 5),
    ultimasFacturas: facturas.slice(0, 5),
    ultimosTrabajos: trabajos.filter((t) => ['terminado', 'entregado'].includes(t.estado)).slice(0, 10),
    whatsappContacto,
  };
};

/**
 * Crea un trabajo manual desde el perfil del cliente.
 */
export const createTrabajoManual = async (
  clienteId: string,
  data: Record<string, unknown>,
  userId: string
) => {
  const { TrabajoProduccion } = await import('../produccion/trabajo.model');

  const cliente = await Cliente.findById(clienteId);
  if (!cliente) throw createError('Cliente no encontrado', 404);

  // Calcular metrosCuadrados si hay medidas
  const medidas = data.medidas as { alto?: number; ancho?: number; unidad?: string } | undefined;
  if (medidas?.alto && medidas?.ancho) {
    const factorM = medidas.unidad === 'cm' ? 0.01 : 1;
    const alto = (medidas.alto as number) * factorM;
    const ancho = (medidas.ancho as number) * factorM;
    (medidas as Record<string, unknown>).metrosCuadrados = parseFloat((alto * ancho).toFixed(4));
  }

  const nombreArchivo = (data.descripcion as string) || `Trabajo ${new Date().toLocaleDateString('es-CO')}`;

  const trabajo = await TrabajoProduccion.create({
    ...data,
    medidas,
    cliente: clienteId,
    creadoPor: userId,
    creadoAutomaticamente: false,
    sinCliente: false,
    archivo: {
      nombre: nombreArchivo,
      nombreOriginal: nombreArchivo,
      extension: 'manual',
      carpetaOrigen: 'Manual',
    },
    descripcion: data.descripcion,
    historialEstados: [{ estado: 'pendiente', fecha: new Date(), usuario: userId }],
  });

  return trabajo;
};
