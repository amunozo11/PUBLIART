import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Response } from 'express';
import { Factura } from '../facturas/factura.model';
import { TrabajoProduccion } from '../produccion/trabajo.model';
import { Cliente } from '../clientes/cliente.model';
import { Cotizacion } from '../cotizaciones/cotizacion.model';

const PRIORIDAD_ORDEN: Record<string, number> = { urgente: 0, alta: 1, media: 2, baja: 3 };

const router = Router();
router.use(authenticate);

router.get('/', async (_req: AuthRequest, res: Response) => {
  try {
    const hoy = new Date();
    const inicioHoy = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);

    const [
      ventasHoy, ventasMes,
      trabajosPendientesCount, trabajosEnProceso, trabajosTerminadosCount,
      clientesTotal, clientesNuevos,
      cotizacionesMes,
      produccionPorMaquina,
      ventasUltimos30,
      porCobrarAgr,
      trabajosPendientesList,
      trabajosTerminadosList,
      cobrosTrabajosHoy,
      cobrosTrabajosMes,
    ] = await Promise.all([
      Factura.aggregate([
        { $match: { createdAt: { $gte: inicioHoy }, estado: { $ne: 'cancelada' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      Factura.aggregate([
        { $match: { createdAt: { $gte: inicioMes }, estado: { $ne: 'cancelada' } } },
        { $group: { _id: null, total: { $sum: '$total' }, count: { $sum: 1 } } },
      ]),
      TrabajoProduccion.countDocuments({ estado: 'pendiente' }),
      TrabajoProduccion.countDocuments({ estado: { $in: ['diseño', 'produccion', 'corte'] } }),
      TrabajoProduccion.countDocuments({ estado: 'terminado' }),
      Cliente.countDocuments(),
      Cliente.countDocuments({ createdAt: { $gte: inicioMes } }),
      Cotizacion.countDocuments({ createdAt: { $gte: inicioMes } }),
      TrabajoProduccion.aggregate([
        { $group: { _id: '$maquina', count: { $sum: 1 }, valor: { $sum: '$valor' } } },
      ]),
      Factura.aggregate([
        {
          $match: {
            createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
            estado: { $ne: 'cancelada' },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
            total: { $sum: '$total' },
            count: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ]),
      // Suma de trabajos no cobrados (activos, no entregados)
      TrabajoProduccion.aggregate([
        { $match: { cobrado: false, estado: { $nin: ['entregado'] } } },
        { $group: { _id: null, total: { $sum: '$valor' } } },
      ]),
      // Lista de pendientes con info de cliente
      TrabajoProduccion.find({ estado: 'pendiente' })
        .populate('cliente', 'nombre empresa telefono')
        .select('archivo descripcion maquina prioridad valor createdAt cliente estado')
        .limit(20),
      // Terminados sin avisar
      TrabajoProduccion.find({ estado: 'terminado', whatsappEnviado: false })
        .populate('cliente', 'nombre telefono')
        .select('archivo descripcion valor createdAt cliente whatsappEnviado')
        .sort({ createdAt: 1 })
        .limit(20),
      // Cobros de Trabajos (Hoy)
      TrabajoProduccion.aggregate([
        { $match: { cobrado: true, fechaCobro: { $gte: inicioHoy } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$valorCobrado', '$valor'] } }, count: { $sum: 1 } } },
      ]),
      // Cobros de Trabajos (Mes)
      TrabajoProduccion.aggregate([
        { $match: { cobrado: true, fechaCobro: { $gte: inicioMes } } },
        { $group: { _id: null, total: { $sum: { $ifNull: ['$valorCobrado', '$valor'] } }, count: { $sum: 1 } } },
      ]),
    ]);

    // Ordenar pendientes por prioridad
    const pendientesOrdenados = [...trabajosPendientesList].sort((a, b) => {
      const pa = PRIORIDAD_ORDEN[a.prioridad as string] ?? 2;
      const pb = PRIORIDAD_ORDEN[b.prioridad as string] ?? 2;
      return pa - pb;
    });

    const fHoy = ventasHoy[0] || { total: 0, count: 0 };
    const tHoy = cobrosTrabajosHoy[0] || { total: 0, count: 0 };
    const fMes = ventasMes[0] || { total: 0, count: 0 };
    const tMes = cobrosTrabajosMes[0] || { total: 0, count: 0 };

    res.json({
      success: true,
      kpis: {
        ventasHoy: { total: fHoy.total + tHoy.total, count: fHoy.count + tHoy.count },
        ventasMes: { total: fMes.total + tMes.total, count: fMes.count + tMes.count },
        trabajosPendientes: trabajosPendientesCount,
        trabajosEnProceso,
        trabajosTerminados: trabajosTerminadosCount,
        clientesTotal,
        clientesNuevos,
        cotizacionesMes,
        porCobrar: porCobrarAgr[0]?.total || 0,
        trabajosSinAvisar: trabajosTerminadosList.length,
      },
      produccionPorMaquina,
      ventasUltimos30,
      trabajosPendientes: pendientesOrdenados,
      trabajosTerminados: trabajosTerminadosList,
    });
  } catch (e) {
    res.status(500).json({ success: false, message: 'Error obteniendo dashboard' });
  }
});

export default router;
