import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart3, Download, Calendar, Users, TrendingUp,
  FileText, Zap, Building2, AlertTriangle, ChevronRight,
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const ESTADO_COLOR: Record<string, string> = {
  potencial: 'bg-slate-500/20 text-slate-400',
  negociacion: 'bg-blue-500/20 text-blue-400',
  activo: 'bg-green-500/20 text-green-400',
  frecuente: 'bg-yellow-500/20 text-yellow-400',
  inactivo: 'bg-red-500/20 text-red-400',
};

const PERIODOS = [
  { label: 'Este mes', value: 'mes' },
  { label: 'Último trimestre', value: 'trimestre' },
  { label: 'Este año', value: 'anio' },
];

function getRangoFechas(periodo: string) {
  const hoy = new Date();
  const hasta = hoy.toISOString();
  let desde: string;
  if (periodo === 'mes') {
    desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString();
  } else if (periodo === 'trimestre') {
    const d = new Date(hoy);
    d.setMonth(d.getMonth() - 3);
    desde = d.toISOString();
  } else {
    desde = new Date(hoy.getFullYear(), 0, 1).toISOString();
  }
  return { desde, hasta };
}

interface ClienteTrabajo {
  _id: string;
  nombre: string;
  empresa?: string;
  estado?: string;
  ciudad?: string;
  totalFacturado: number;
  numFacturas: number;
  trabajosPendientes: number;
  valorPendiente: number;
}

interface Resumen {
  totalIngresos: number;
  numFacturas: number;
  promedioPorFactura: number;
  trabajosTerminados: number;
  clientesNuevos: number;
  cotizacionesPeriodo: number;
}

export default function Reportes() {
  const [ventasData, setVentasData] = useState<Array<{ _id: string; total: number; count: number }>>([]);
  const [produccionData, setProduccionData] = useState<Array<{ _id: string; count: number; valor: number }>>([]);
  const [clientesData, setClientesData] = useState<ClienteTrabajo[]>([]);
  const [resumen, setResumen] = useState<Resumen | null>(null);
  const [loading, setLoading] = useState(true);
  const [periodo, setPeriodo] = useState('mes');

  const fetchData = async (p: string) => {
    setLoading(true);
    const { desde, hasta } = getRangoFechas(p);
    try {
      const [v, prod, ct, res] = await Promise.all([
        api.get('/reportes/ventas', { params: { desde, hasta } }),
        api.get('/reportes/produccion'),
        api.get('/reportes/clientes-trabajos', { params: { desde, hasta } }),
        api.get('/reportes/resumen', { params: { desde, hasta } }),
      ]);
      setVentasData(v.data.ventas || []);
      setProduccionData(prod.data.data || []);
      setClientesData(ct.data.data || []);
      setResumen(res.data.resumen || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(periodo); }, [periodo]);

  const KPICard = ({
    icon: Icon, label, value, sub, color = '#F5C400', delay = 0,
  }: {
    icon: React.ElementType; label: string; value: string; sub?: string; color?: string; delay?: number;
  }) => (
    <motion.div
      className="card flex items-center gap-4"
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
    >
      <div
        className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}20` }}
      >
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div className="min-w-0">
        <p className="text-xs text-text-muted">{label}</p>
        <p className="text-lg font-bold text-text truncate">{value}</p>
        {sub && <p className="text-[10px] text-text-dim">{sub}</p>}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Reportes</h2>
          <p className="page-subtitle">Análisis de ventas, producción y clientes</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Selector de período */}
          <div className="flex bg-surface-3 rounded-lg p-0.5 gap-0.5">
            {PERIODOS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriodo(p.value)}
                className={`text-xs px-3 py-1.5 rounded-md transition-all font-medium ${
                  periodo === p.value
                    ? 'bg-primary text-dark'
                    : 'text-text-muted hover:text-text'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
          <button className="btn-outline text-sm">
            <Download className="w-4 h-4" /> Exportar
          </button>
        </div>
      </div>

      {/* KPIs resumen */}
      {resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <KPICard icon={TrendingUp}    label="Total ingresos"       value={formatCOP(resumen.totalIngresos)}         color="#22C55E" delay={0} />
          <KPICard icon={FileText}       label="Facturas"             value={String(resumen.numFacturas)}               color="#3B82F6" delay={0.05} />
          <KPICard icon={BarChart3}      label="Promedio / factura"   value={formatCOP(resumen.promedioPorFactura)}     color="#8B5CF6" delay={0.1} />
          <KPICard icon={Zap}            label="Trabajos terminados"  value={String(resumen.trabajosTerminados)}        color="#F5C400" delay={0.15} />
          <KPICard icon={Users}          label="Clientes nuevos"      value={String(resumen.clientesNuevos)}            color="#EC4899" delay={0.2} />
          <KPICard icon={Calendar}       label="Cotizaciones"         value={String(resumen.cotizacionesPeriodo)}       color="#06B6D4" delay={0.25} />
        </div>
      )}
      {loading && !resumen && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card h-20 shimmer-effect bg-surface-3" />
          ))}
        </div>
      )}

      {/* Gráficos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-semibold text-text mb-4">Ventas por Día</h3>
          {loading ? (
            <div className="shimmer-effect h-48 rounded bg-surface-3" />
          ) : ventasData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-dim text-sm">Sin datos en este período</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={ventasData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" />
                <XAxis dataKey="_id" tick={{ fill: '#8A8A8E', fontSize: 11 }} tickFormatter={(v) => v.slice(5)} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A8A8E', fontSize: 11 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} axisLine={false} tickLine={false} width={50} />
                <Tooltip
                  contentStyle={{ background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 12, fontSize: 12 }}
                  formatter={(v: number) => [formatCOP(v), 'Ventas']}
                />
                <Line type="monotone" dataKey="total" stroke="#F5C400" strokeWidth={2} dot={{ fill: '#F5C400', r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div className="card" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-text mb-4">Producción por Máquina</h3>
          {loading ? (
            <div className="shimmer-effect h-48 rounded bg-surface-3" />
          ) : produccionData.length === 0 ? (
            <div className="h-48 flex items-center justify-center text-text-dim text-sm">Sin datos de producción</div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={produccionData.map((d) => ({
                name: d._id === 'plotterVinilo' ? 'Vinilo' : d._id === 'plotterBanner' ? 'Banner' : d._id,
                trabajos: d.count,
                valor: d.valor,
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" horizontal vertical={false} />
                <XAxis dataKey="name" tick={{ fill: '#8A8A8E', fontSize: 11 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#8A8A8E', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  contentStyle={{ background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 12, fontSize: 12 }}
                  itemStyle={{ color: '#F5C400' }}
                />
                <Bar dataKey="trabajos" fill="#F5C400" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      {/* Tabla de clientes con ranking + pendientes */}
      <motion.div
        className="card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="text-sm font-semibold text-text">Clientes — Ranking y Trabajos Pendientes</h3>
            <p className="text-xs text-text-muted mt-0.5">Ordenados por total facturado. Clientes con ⚠ tienen trabajos activos.</p>
          </div>
          <Link to="/clientes" className="btn-ghost text-xs">Ver todos</Link>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="shimmer-effect h-12 rounded-lg bg-surface-3" />
            ))}
          </div>
        ) : clientesData.length === 0 ? (
          <div className="text-center py-10 text-text-muted">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Sin actividad en este período</p>
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>Cliente</th>
                  <th>Estado</th>
                  <th className="text-right">Total Facturado</th>
                  <th className="text-right">Facturas</th>
                  <th className="text-center">Trabajos Activos</th>
                  <th className="text-right">Valor Pendiente</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {clientesData.map((c, i) => (
                  <motion.tr
                    key={c._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    <td className="text-text-dim font-mono text-xs w-8">{i + 1}</td>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">
                            {(c.nombre || '?').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium text-sm text-text">{c.nombre}</p>
                          {c.empresa && (
                            <div className="flex items-center gap-1 text-xs text-text-dim">
                              <Building2 className="w-3 h-3" /> {c.empresa}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      {c.estado && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${ESTADO_COLOR[c.estado] || 'bg-slate-500/20 text-slate-400'}`}>
                          {c.estado}
                        </span>
                      )}
                    </td>
                    <td className="text-right font-bold text-sm text-text">
                      {formatCOP(c.totalFacturado)}
                    </td>
                    <td className="text-right text-text-muted text-sm">{c.numFacturas}</td>
                    <td className="text-center">
                      {c.trabajosPendientes > 0 ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400" />
                          <span className="text-yellow-400 font-bold text-sm">{c.trabajosPendientes}</span>
                        </div>
                      ) : (
                        <span className="text-text-dim text-sm">—</span>
                      )}
                    </td>
                    <td className="text-right text-sm">
                      {c.valorPendiente > 0 ? (
                        <span className="text-yellow-400 font-medium">{formatCOP(c.valorPendiente)}</span>
                      ) : (
                        <span className="text-text-dim">—</span>
                      )}
                    </td>
                    <td>
                      <Link
                        to={`/clientes/${c._id}`}
                        className="btn-ghost text-xs py-1 px-2 flex items-center gap-1"
                      >
                        Ver <ChevronRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
