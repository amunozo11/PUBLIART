import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Response } from 'express';
import { Factura } from '../facturas/factura.model';
import { TrabajoProduccion } from '../produccion/trabajo.model';
import { Cliente } from '../clientes/cliente.model';
import { Cotizacion } from '../cotizaciones/cotizacion.model';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate);

// ── Ventas por día ────────────────────────────────────────────────────────────
router.get('/ventas', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta, clienteId } = req.query as Record<string, string>;
    const match: Record<string, unknown> = { estado: { $ne: 'cancelada' } };
    if (desde || hasta) {
      match.createdAt = {};
      if (desde) (match.createdAt as Record<string, Date>).$gte = new Date(desde);
      if (hasta) (match.createdAt as Record<string, Date>).$lte = new Date(hasta);
    }
    if (clienteId) match.cliente = new mongoose.Types.ObjectId(clienteId);

    const ventas = await Factura.aggregate([
      { $match: match },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
    res.json({ success: true, ventas });
  } catch { res.status(500).json({ success: false }); }
});

// ── Producción por máquina ────────────────────────────────────────────────────
router.get('/produccion', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await TrabajoProduccion.aggregate([
      { $group: { _id: '$maquina', count: { $sum: 1 }, valor: { $sum: '$valor' } } },
      { $sort: { count: -1 } },
    ]);
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false }); }
});

// ── Ranking de clientes con total facturado + trabajos pendientes ─────────────
router.get('/clientes-trabajos', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta } = req.query as Record<string, string>;

    const matchFactura: Record<string, unknown> = { estado: { $ne: 'cancelada' } };
    if (desde || hasta) {
      matchFactura.createdAt = {};
      if (desde) (matchFactura.createdAt as Record<string, Date>).$gte = new Date(desde);
      if (hasta) (matchFactura.createdAt as Record<string, Date>).$lte = new Date(hasta);
    }

    // Facturación por cliente
    const facturacion = await Factura.aggregate([
      { $match: matchFactura },
      { $group: { _id: '$cliente', totalFacturado: { $sum: '$total' }, numFacturas: { $sum: 1 } } },
      { $sort: { totalFacturado: -1 } },
      { $limit: 30 },
      { $lookup: { from: 'clientes', localField: '_id', foreignField: '_id', as: 'clienteData' } },
      { $unwind: { path: '$clienteData', preserveNullAndEmptyArrays: true } },
    ]);

    // Trabajos activos por cliente (pendiente, diseño, produccion, corte)
    const trabajosActivos = await TrabajoProduccion.aggregate([
      { $match: { estado: { $in: ['pendiente', 'diseño', 'produccion', 'corte'] } } },
      { $group: { _id: '$cliente', trabajosPendientes: { $sum: 1 }, valorPendiente: { $sum: '$valor' } } },
    ]);

    const pendientesMap: Record<string, { trabajosPendientes: number; valorPendiente: number }> = {};
    trabajosActivos.forEach((t) => {
      pendientesMap[t._id.toString()] = {
        trabajosPendientes: t.trabajosPendientes,
        valorPendiente: t.valorPendiente,
      };
    });

    // Clientes con trabajos pero sin facturas (en el período)
    const idsConFactura = new Set(facturacion.map((f) => f._id?.toString()));
    const soloConTrabajos = await TrabajoProduccion.aggregate([
      { $match: { estado: { $in: ['pendiente', 'diseño', 'produccion', 'corte'] } } },
      { $group: { _id: '$cliente', trabajosPendientes: { $sum: 1 }, valorPendiente: { $sum: '$valor' } } },
      { $lookup: { from: 'clientes', localField: '_id', foreignField: '_id', as: 'clienteData' } },
      { $unwind: { path: '$clienteData', preserveNullAndEmptyArrays: true } },
    ]);

    const resultados = [
      ...facturacion.map((f) => {
        const id = f._id?.toString();
        const pend = pendientesMap[id] || { trabajosPendientes: 0, valorPendiente: 0 };
        return {
          _id: f._id,
          nombre: f.clienteData?.nombre || 'Sin nombre',
          empresa: f.clienteData?.empresa,
          estado: f.clienteData?.estado,
          ciudad: f.clienteData?.ciudad,
          totalFacturado: f.totalFacturado,
          numFacturas: f.numFacturas,
          trabajosPendientes: pend.trabajosPendientes,
          valorPendiente: pend.valorPendiente,
        };
      }),
      ...soloConTrabajos
        .filter((t) => !idsConFactura.has(t._id?.toString()))
        .map((t) => ({
          _id: t._id,
          nombre: t.clienteData?.nombre || 'Sin nombre',
          empresa: t.clienteData?.empresa,
          estado: t.clienteData?.estado,
          ciudad: t.clienteData?.ciudad,
          totalFacturado: 0,
          numFacturas: 0,
          trabajosPendientes: t.trabajosPendientes,
          valorPendiente: t.valorPendiente,
        })),
    ];

    // Ordenar por totalFacturado desc, luego por trabajosPendientes desc
    resultados.sort((a, b) => (b.totalFacturado - a.totalFacturado) || (b.trabajosPendientes - a.trabajosPendientes));

    res.json({ success: true, data: resultados });
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
});

// ── KPIs resumen del período ──────────────────────────────────────────────────
router.get('/resumen', async (req: AuthRequest, res: Response) => {
  try {
    const { desde, hasta } = req.query as Record<string, string>;

    const ahora = new Date();
    const inicioMes = new Date(ahora.getFullYear(), ahora.getMonth(), 1);
    const fechaDesde = desde ? new Date(desde) : inicioMes;
    const fechaHasta = hasta ? new Date(hasta) : ahora;

    const matchBase = {
      createdAt: { $gte: fechaDesde, $lte: fechaHasta },
    };

    const [ingresos, trabajosTerminados, clientesNuevos, cotizacionesPeriodo] = await Promise.all([
      Factura.aggregate([
        { $match: { ...matchBase, estado: { $ne: 'cancelada' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      TrabajoProduccion.countDocuments({
        ...matchBase,
        estado: { $in: ['terminado', 'entregado'] },
      }),
      Cliente.countDocuments({ createdAt: { $gte: fechaDesde, $lte: fechaHasta } }),
      Cotizacion.countDocuments({ createdAt: { $gte: fechaDesde, $lte: fechaHasta } }),
    ]);

    const totalIngresos = ingresos[0]?.total || 0;
    const numFacturas = ingresos[0]?.count || 0;

    res.json({
      success: true,
      resumen: {
        totalIngresos,
        numFacturas,
        promedioPorFactura: numFacturas > 0 ? Math.round(totalIngresos / numFacturas) : 0,
        trabajosTerminados,
        clientesNuevos,
        cotizacionesPeriodo,
      },
    });
  } catch (e) { console.error(e); res.status(500).json({ success: false }); }
});

// ── Reporte clientes (legado) ─────────────────────────────────────────────────
router.get('/clientes', async (_req: AuthRequest, res: Response) => {
  try {
    const data = await Factura.aggregate([
      { $match: { estado: { $ne: 'cancelada' } } },
      { $group: { _id: '$cliente', total: { $sum: '$total' }, count: { $sum: 1 } } },
      { $sort: { total: -1 } },
      { $limit: 20 },
      { $lookup: { from: 'clientes', localField: '_id', foreignField: '_id', as: 'cliente' } },
      { $unwind: '$cliente' },
    ]);
    res.json({ success: true, data });
  } catch { res.status(500).json({ success: false }); }
});

export default router;
