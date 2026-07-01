import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp, DollarSign, Package, Users, FileText,
  CheckCircle, Clock, Zap, BarChart2, RefreshCcw, AlertTriangle,
  ChevronRight, MessageCircle, Printer
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';
import { Link } from 'react-router-dom';
import api from '../../lib/api';

interface DashData {
  kpis: {
    ventasHoy: { total: number; count: number };
    ventasMes: { total: number; count: number };
    trabajosPendientes: number;
    trabajosEnProceso: number;
    trabajosTerminados: number;
    clientesTotal: number;
    clientesNuevos: number;
    cotizacionesMes: number;
    porCobrar: number;
    trabajosSinAvisar: number;
  };
  produccionPorMaquina: Array<{ _id: string; count: number; valor: number }>;
  ventasUltimos30: Array<{ _id: string; total: number; count: number }>;
  trabajosPendientes: Array<{
    _id: string;
    archivo: { nombre: string };
    descripcion?: string;
    cliente?: { _id: string; nombre: string; empresa?: string; telefono?: string };
    maquina: string;
    estado: string;
    prioridad: string;
    valor: number;
    createdAt: string;
  }>;
  trabajosTerminados: Array<{
    _id: string;
    archivo: { nombre: string };
    descripcion?: string;
    cliente?: { _id: string; nombre: string; telefono?: string };
    valor: number;
    whatsappEnviado: boolean;
    createdAt: string;
  }>;
}

const MAQUINA_LABELS: Record<string, string> = {
  plotterVinilo: 'Vinilo',
  plotterBanner: 'Banner',
  corte: 'Corte',
  laser: 'Láser',
  laminado: 'Laminado',
};

const MAQUINA_COLORS = ['#F5C400', '#3B82F6', '#22C55E', '#8B5CF6', '#EF4444'];

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const cardVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.07, type: 'spring', stiffness: 300, damping: 24 }
  })
};

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  icon: React.ElementType;
  color: string;
  index: number;
}

function StatCard({ label, value, sub, icon: Icon, color, index, href }: StatCardProps & { href?: string }) {
  const content = (
    <motion.div
      custom={index}
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      className={`stat-card group ${href ? 'cursor-pointer hover:border-primary/40 transition-all' : 'cursor-default'}`}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium text-text-muted uppercase tracking-wider mb-2">{label}</p>
          <motion.p
            className="text-2xl font-bold text-text"
            initial={{ scale: 0.8 }}
            animate={{ scale: 1 }}
            transition={{ delay: index * 0.07 + 0.2, type: 'spring' }}
          >
            {value}
          </motion.p>
          {sub && <p className="text-xs text-text-muted mt-1">{sub}</p>}
        </div>
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ml-3"
          style={{ background: `${color}18` }}
        >
          <Icon className="w-5 h-5" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );
  return href ? <Link to={href}>{content}</Link> : content;
}

const CustomTooltip = ({ active, payload, label }: Record<string, unknown>) => {
  if ((active as boolean) && (payload as unknown[])?.length) {
    return (
      <div className="bg-surface-2 border border-border rounded-xl p-3 text-xs shadow-card">
        <p className="text-text-muted mb-1">{label as string}</p>
        <p className="text-primary font-bold">{formatCOP((payload as Array<{value: number}>)[0]?.value)}</p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [data, setData] = useState<DashData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await api.get('/dashboard');
      setData(res.data);
    } catch { /* empty */ }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const kpis = data?.kpis;

  const stats = [
    { label: 'Ingresos del Día',    value: formatCOP(kpis?.ventasHoy.total || 0),    sub: `${kpis?.ventasHoy.count || 0} cobros`,        icon: DollarSign,   color: '#F5C400', href: '/facturas' },
    { label: 'Ingresos del Mes',    value: formatCOP(kpis?.ventasMes.total || 0),    sub: `${kpis?.ventasMes.count || 0} cobros`,        icon: TrendingUp,   color: '#22C55E', href: '/facturas' },
    { label: 'Por Cobrar',          value: formatCOP(kpis?.porCobrar || 0),          sub: 'Trabajos no cobrados',                        icon: AlertTriangle, color: '#EF4444', href: '/produccion' },
    { label: 'En Producción',       value: kpis?.trabajosEnProceso || 0,             sub: 'Activos ahora',                               icon: Zap,          color: '#3B82F6', href: '/produccion' },
    { label: 'Pendientes',          value: kpis?.trabajosPendientes || 0,            sub: 'En cola',                                     icon: Clock,        color: '#F59E0B', href: '/produccion?estado=pendiente' },
    { label: 'Terminados',          value: kpis?.trabajosTerminados || 0,            sub: 'Sin entregar',                                icon: CheckCircle,  color: '#8B5CF6', href: '/produccion?estado=terminado' },
    { label: 'Clientes Nuevos',     value: kpis?.clientesNuevos || 0,               sub: 'Este mes',                                    icon: Users,        color: '#06B6D4', href: '/clientes' },
    { label: 'Total Clientes',      value: kpis?.clientesTotal || 0,                sub: 'En base de datos',                            icon: Package,      color: '#EC4899', href: '/clientes' },
  ];

  const PRIORIDAD_COLOR: Record<string, string> = {
    baja: '#64748B', media: '#3B82F6', alta: '#F59E0B', urgente: '#EF4444',
  };

  const MAQUINA_LABEL: Record<string, string> = {
    plotterVinilo: 'Vinilo', plotterBanner: 'Banner',
    corte: 'Corte', laser: 'Láser', laminado: 'Laminado', instalacion: 'Instalación',
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">
            Panel de Control{' '}
            <span className="text-gradient">PUBLIART</span>
          </h2>
          <p className="page-subtitle">Resumen en tiempo real de tu agencia</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          className="btn-ghost text-sm"
          disabled={refreshing}
        >
          <RefreshCcw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Actualizar
        </button>
      </div>

      {/* KPI Cards */}
      {loading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="stat-card h-24">
              <div className="shimmer-effect w-full h-full rounded-lg" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s, i) => (
            <StatCard key={s.label} {...s} index={i} />
          ))}
        </div>
      )}

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Ventas 30 días */}
        <motion.div
          className="card lg:col-span-2"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, type: 'spring' }}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-sm font-semibold text-text">Ventas — Últimos 30 días</h3>
              <p className="text-xs text-text-muted mt-0.5">Ingresos por facturación</p>
            </div>
            <BarChart2 className="w-4 h-4 text-text-dim" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={data?.ventasUltimos30 || []} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" vertical={false} />
              <XAxis
                dataKey="_id"
                tick={{ fill: '#8A8A8E', fontSize: 11 }}
                tickFormatter={(v) => v.slice(5)}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: '#8A8A8E', fontSize: 11 }}
                tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                width={50}
              />
              <Tooltip content={<CustomTooltip />} />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#F5C400"
                strokeWidth={2.5}
                dot={{ fill: '#F5C400', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#F5C400' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Producción por máquina */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring' }}
        >
          <div className="mb-5">
            <h3 className="text-sm font-semibold text-text">Producción por Máquina</h3>
            <p className="text-xs text-text-muted mt-0.5">Trabajos registrados</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart
              data={(data?.produccionPorMaquina || []).map((d) => ({
                name: MAQUINA_LABELS[d._id] || d._id,
                trabajos: d.count,
                color: MAQUINA_COLORS[0],
              }))}
              margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2E" horizontal={true} vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#8A8A8E', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#8A8A8E', fontSize: 11 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ background: '#1A1A1D', border: '1px solid #2A2A2E', borderRadius: 12, fontSize: 12 }}
                labelStyle={{ color: '#8A8A8E' }}
                itemStyle={{ color: '#F5C400' }}
              />
              <Bar dataKey="trabajos" radius={[6, 6, 0, 0]}>
                {(data?.produccionPorMaquina || []).map((_, i) => (
                  <Cell key={i} fill={MAQUINA_COLORS[i % MAQUINA_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
      {/* Secciones: Pendientes + Terminados sin entregar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Trabajos pendientes */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: 'spring' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <Clock className="w-4 h-4 text-yellow-400" /> Trabajos Pendientes
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Más urgentes primero</p>
            </div>
            <Link to="/produccion?estado=pendiente" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.trabajosPendientes || []).length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20 text-success" />
                <p className="text-sm">¡Sin pendientes!</p>
              </div>
            ) : (data?.trabajosPendientes || []).slice(0, 6).map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.04 }}
              >
                <Link to={`/produccion/${t._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-surface-3 hover:bg-surface-4 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-yellow-500/15 flex items-center justify-center flex-shrink-0">
                    <Printer className="w-3.5 h-3.5 text-yellow-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {t.descripcion || t.archivo?.nombre}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {t.cliente?.nombre || '—'} · {MAQUINA_LABEL[t.maquina] || t.maquina}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-success">{formatCOP(t.valor)}</p>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                      style={{ color: PRIORIDAD_COLOR[t.prioridad], background: PRIORIDAD_COLOR[t.prioridad] + '20' }}>
                      {t.prioridad}
                    </span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-primary transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Terminados sin avisar */}
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, type: 'spring' }}
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-[#25D366]" /> Listos — Avisar al Cliente
              </h3>
              <p className="text-xs text-text-muted mt-0.5">Trabajos terminados sin notificar</p>
            </div>
            <Link to="/produccion?estado=terminado" className="text-xs text-primary hover:underline flex items-center gap-1">
              Ver todos <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {(data?.trabajosTerminados || []).length === 0 ? (
              <div className="text-center py-8 text-text-muted">
                <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-20 text-[#25D366]" />
                <p className="text-sm">¡Todos los clientes avisados!</p>
              </div>
            ) : (data?.trabajosTerminados || []).slice(0, 6).map((t, i) => (
              <motion.div
                key={t._id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.65 + i * 0.04 }}
              >
                <Link to={`/produccion/${t._id}`}
                  className="flex items-center gap-3 p-3 rounded-xl bg-[#25D366]/5 border border-[#25D366]/20 hover:bg-[#25D366]/10 transition-colors group">
                  <div className="w-7 h-7 rounded-lg bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                    <MessageCircle className="w-3.5 h-3.5 text-[#25D366]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text truncate">
                      {t.descripcion || t.archivo?.nombre}
                    </p>
                    <p className="text-xs text-text-muted truncate">
                      {t.cliente?.nombre || 'Sin cliente'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-xs font-bold text-success">{formatCOP(t.valor)}</p>
                    {t.cliente?.telefono && (
                      <span className="text-[9px] text-[#25D366]">WA disponible</span>
                    )}
                  </div>
                  <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-[#25D366] transition-colors flex-shrink-0" />
                </Link>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
