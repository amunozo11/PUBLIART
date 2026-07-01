import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Clock, Package, User, Ruler, DollarSign, MessageCircle,
  CheckCircle2, ChevronDown, Check, X, FileText, Zap, Layers,
  Printer, AlertTriangle, Edit2, ExternalLink, Calendar, Hash,
  TrendingUp, Send, History, Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import WhatsAppModal from '../../components/whatsapp/WhatsAppModal';
import AsignarClienteModal from '../../components/produccion/AsignarClienteModal';

// ─── Constantes ───────────────────────────────────────────────────────────────
const ESTADOS = ['pendiente', 'diseño', 'produccion', 'corte', 'terminado', 'entregado'];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType; desc: string }> = {
  pendiente:  { label: 'Pendiente',   color: '#F59E0B', bg: '#F59E0B18', icon: Clock,         desc: 'Esperando inicio' },
  diseño:     { label: 'Diseño',      color: '#8B5CF6', bg: '#8B5CF618', icon: Zap,           desc: 'En proceso de diseño' },
  produccion: { label: 'Producción',  color: '#3B82F6', bg: '#3B82F618', icon: Printer,       desc: 'Imprimiendo / maquinando' },
  corte:      { label: 'Corte',       color: '#EC4899', bg: '#EC489918', icon: Layers,        desc: 'En proceso de corte' },
  terminado:  { label: 'Terminado',   color: '#22C55E', bg: '#22C55E18', icon: CheckCircle2,  desc: 'Listo para entrega' },
  entregado:  { label: 'Entregado',   color: '#64748B', bg: '#64748B18', icon: Check,         desc: 'Entregado al cliente' },
};

const MAQUINA_LABEL: Record<string, string> = {
  plotterVinilo: '🖨 Plotter Vinilo', plotterBanner: '🖨 Plotter Banner',
  corte: '✂️ Corte', laser: '⚡ Láser', laminado: '📄 Laminado', instalacion: '🔧 Instalación',
};

const PRIORIDAD_CONFIG: Record<string, { color: string; bg: string; label: string }> = {
  baja:    { color: '#64748B', bg: '#64748B20', label: '⬇ Baja' },
  media:   { color: '#3B82F6', bg: '#3B82F620', label: '➡ Media' },
  alta:    { color: '#F59E0B', bg: '#F59E0B20', label: '⬆ Alta' },
  urgente: { color: '#EF4444', bg: '#EF444420', label: '🔥 Urgente' },
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatDateTime = (d: string) =>
  new Date(d).toLocaleString('es-CO', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// ─── Tipos ───────────────────────────────────────────────────────────────────
interface HistorialEstado {
  estado: string;
  fecha: string;
  observacion?: string;
  usuario?: { nombre: string };
}

interface Trabajo {
  _id: string;
  archivo: { nombre: string; extension?: string; carpetaOrigen?: string; ruta?: string };
  descripcion?: string;
  cliente?: { _id: string; nombre: string; empresa?: string; telefono?: string };
  maquina: string;
  tipo: string;
  estado: string;
  valor: number;
  valorCobrado?: number;
  cobrado: boolean;
  notaCobro?: string;
  prioridad: string;
  medidas?: { alto: number; ancho: number; unidad: string; metrosCuadrados?: number };
  sinCliente: boolean;
  whatsappEnviado: boolean;
  observaciones?: string;
  historialEstados: HistorialEstado[];
  tiempoInicio?: string;
  tiempoFin?: string;
  responsable?: { nombre: string; avatar?: string };
  creadoPor?: { nombre: string };
  creadoAutomaticamente: boolean;
  createdAt: string;
  updatedAt: string;
}

interface WaPayload { numero: string; mensaje: string; link: string; }

// ─── Modal de Cobro ───────────────────────────────────────────────────────────
function CobroModal({
  trabajo, onClose, onActualizado,
}: { trabajo: Trabajo; onClose: () => void; onActualizado: () => void }) {
  const [monto, setMonto] = useState(String(trabajo.valorCobrado || trabajo.valor || ''));
  const [nota, setNota] = useState(trabajo.notaCobro || '');
  const [cobrado, setCobrado] = useState(trabajo.cobrado);
  const [saving, setSaving] = useState(false);

  const diferencia = (parseFloat(monto) || 0) - (trabajo.valor || 0);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.patch(`/produccion/${trabajo._id}/cobrado`, {
        cobrado,
        valorCobrado: parseFloat(monto) || 0,
        notaCobro: nota,
      });
      toast.success(cobrado ? '✅ Cobro registrado' : '📋 Marcado como pendiente');
      onActualizado();
      onClose();
    } catch {
      toast.error('Error al actualizar cobro');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        {/* Header */}
        <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-success/10 to-transparent">
          <div className="w-10 h-10 rounded-xl bg-success/20 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-text">Registrar Cobro</h3>
            <p className="text-xs text-text-muted truncate">{trabajo.descripcion || trabajo.archivo.nombre}</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-4">
          {/* Valor original */}
          <div className="bg-surface-3 rounded-xl p-4 flex items-center justify-between">
            <div>
              <p className="text-xs text-text-dim">Valor del trabajo</p>
              <p className="text-lg font-bold text-text mt-0.5">{formatCOP(trabajo.valor)}</p>
            </div>
            <TrendingUp className="w-5 h-5 text-text-dim" />
          </div>

          {/* Monto cobrado */}
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Monto cobrado (COP) *</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">$</span>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                className="input pl-7 w-full text-lg font-bold"
                min={0}
                autoFocus
              />
            </div>
            {monto && (
              <div className="mt-2 flex items-center gap-2">
                <p className="text-sm font-semibold text-success">{formatCOP(parseFloat(monto) || 0)}</p>
                {diferencia !== 0 && (
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${diferencia > 0 ? 'bg-success/15 text-success' : 'bg-red-500/15 text-red-400'}`}>
                    {diferencia > 0 ? '+' : ''}{formatCOP(diferencia)} {diferencia > 0 ? '(adicional)' : '(descuento)'}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Nota de cobro (opcional)</label>
            <input
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej: Pago en efectivo, Transferencia Nequi, Parcial..."
              className="input w-full"
            />
          </div>

          {/* Toggle cobrado */}
          <div className="flex items-center gap-3 bg-surface-3 rounded-xl p-4">
            <div className="flex-1">
              <p className="text-sm font-medium text-text">¿Marcar como cobrado?</p>
              <p className="text-xs text-text-dim mt-0.5">Registra este trabajo como pagado</p>
            </div>
            <button
              onClick={() => setCobrado(!cobrado)}
              className={`relative w-12 h-6 rounded-full transition-all duration-300 ${cobrado ? 'bg-success' : 'bg-surface-4'}`}
            >
              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 ${cobrado ? 'translate-x-6' : 'translate-x-0'}`} />
            </button>
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar Cobro
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal editar observación ─────────────────────────────────────────────────
function EditObsModal({
  trabajo, onClose, onActualizado,
}: { trabajo: Trabajo; onClose: () => void; onActualizado: () => void }) {
  const [obs, setObs] = useState(trabajo.observaciones || '');
  const [valor, setValor] = useState(String(trabajo.valor || ''));
  const [prioridad, setPrioridad] = useState(trabajo.prioridad);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put(`/produccion/${trabajo._id}`, {
        observaciones: obs,
        valor: parseFloat(valor) || 0,
        prioridad,
      });
      toast.success('Trabajo actualizado');
      onActualizado();
      onClose();
      console.error(err);
      toast.error('Error al abrir archivo');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este trabajo? Esta acción no se puede deshacer.')) return;
    try {
      await api.delete(`/produccion/${trabajo._id}`);
      toast.success('Trabajo eliminado');
      onActualizado();
      onClose();
    } catch {
      toast.error('Error al eliminar trabajo');
    }
  };finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <motion.div className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose} />
      <motion.div
        className="relative w-full max-w-md bg-surface-2 rounded-2xl border border-border shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }} transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <Edit2 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-text flex-1">Editar Trabajo</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Valor (COP)</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm font-bold">$</span>
              <input type="number" value={valor} onChange={(e) => setValor(e.target.value)} className="input pl-7 w-full" min={0} />
            </div>
            {valor && <p className="text-xs text-success mt-1">{formatCOP(parseFloat(valor) || 0)}</p>}
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-2">Prioridad</label>
            <div className="flex gap-2">
              {Object.entries(PRIORIDAD_CONFIG).map(([p, cfg]) => (
                <button key={p} onClick={() => setPrioridad(p)}
                  className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all"
                  style={{
                    background: prioridad === p ? cfg.bg : 'transparent',
                    borderColor: prioridad === p ? cfg.color : 'rgba(255,255,255,0.1)',
                    color: prioridad === p ? cfg.color : 'var(--text-muted)',
                  }}>
                  {cfg.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Observaciones</label>
            <textarea value={obs} onChange={(e) => setObs(e.target.value)}
              placeholder="Instrucciones especiales, notas internas..." rows={4} className="input w-full resize-none" />
          </div>
        </div>
        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Guardar
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function TrabajoDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();

  const [trabajo, setTrabajo] = useState<Trabajo | null>(null);
  const [loading, setLoading] = useState(true);
  const [cambiandoEstado, setCambiandoEstado] = useState(false);
  const [estadoOpen, setEstadoOpen] = useState(false);
  const [showCobro, setShowCobro] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showAsignarCliente, setShowAsignarCliente] = useState(false);
  const [waModal, setWaModal] = useState<{
    open: boolean; whatsapp: WaPayload | null; estadoNuevo: string;
  }>({ open: false, whatsapp: null, estadoNuevo: '' });

  const fetchTrabajo = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/produccion/${id}`);
      setTrabajo(res.data.trabajo);
    } catch {
      toast.error('No se pudo cargar el trabajo');
      navigate('/produccion');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrabajo(); }, [id]);

  const cambiarEstado = async (nuevoEstado: string) => {
    if (!trabajo || nuevoEstado === trabajo.estado) return;
    setEstadoOpen(false);
    setCambiandoEstado(true);
    try {
      const res = await api.patch(`/produccion/${trabajo._id}/estado`, { estado: nuevoEstado });
      setTrabajo(res.data.trabajo);
      toast.success(`Estado → ${ESTADO_CONFIG[nuevoEstado]?.label}`);
      if (res.data.whatsapp && (nuevoEstado === 'terminado' || nuevoEstado === 'entregado')) {
        setWaModal({ open: true, whatsapp: res.data.whatsapp, estadoNuevo: nuevoEstado });
      }
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setCambiandoEstado(false);
    }
  };

  if (loading || !trabajo) {
    return (
      <div className="space-y-5 max-w-5xl">
        <div className="shimmer-effect h-10 rounded-xl bg-surface-3 w-48" />
        <div className="shimmer-effect h-40 rounded-2xl bg-surface-3" />
        <div className="grid grid-cols-3 gap-4">
          {[1,2,3].map(i => <div key={i} className="shimmer-effect h-28 rounded-xl bg-surface-3" />)}
        </div>
      </div>
    );
  }

  const cfg = ESTADO_CONFIG[trabajo.estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.icon;
  const prioridadCfg = PRIORIDAD_CONFIG[trabajo.trabajo?.prioridad || trabajo.prioridad] || PRIORIDAD_CONFIG.media;
  const pendienteCobro = trabajo.valor - (trabajo.valorCobrado || 0);

  // Calcular tiempo en producción
  const tiempoProduccion = trabajo.tiempoInicio && trabajo.tiempoFin
    ? Math.round((new Date(trabajo.tiempoFin).getTime() - new Date(trabajo.tiempoInicio).getTime()) / 3600000 * 10) / 10
    : null;

  const whatsappLink = trabajo.cliente?.telefono
    ? (() => {
        const num = trabajo.cliente.telefono.replace(/[\s\-().+]/g, '');
        const prefixed = num.length === 10 ? `57${num}` : num;
        const archivo = trabajo.descripcion || trabajo.archivo.nombre;
        const msg = `Hola ${trabajo.cliente.nombre}, tu trabajo *"${archivo}"* ya está listo para retirar en Publiart. ¡Avísanos cuándo puedes pasar! 🎨`;
        return `https://wa.me/${prefixed}?text=${encodeURIComponent(msg)}`;
      })()
    : null;

  return (
    <div className="space-y-5 max-w-5xl">
      {/* ── Breadcrumb ── */}
      <div className="flex items-center gap-2 text-sm">
        <button onClick={() => navigate('/produccion')} className="flex items-center gap-1.5 text-text-muted hover:text-primary transition-colors">
          <ArrowLeft className="w-4 h-4" /> Producción
        </button>
        <span className="text-text-dim">/</span>
        <span className="text-text font-medium truncate">{trabajo.descripcion || trabajo.archivo.nombre}</span>
      </div>

      {/* ── Header principal ── */}
      <div className="card">
        <div className="flex flex-wrap gap-4 items-start">
          {/* Icono estado */}
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
            <Icon className="w-7 h-7" style={{ color: cfg.color }} />
          </div>

          {/* Info principal */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-0">
                <h2 className="text-xl font-bold text-text truncate">
                  {trabajo.descripcion || trabajo.archivo.nombre}
                </h2>
                {trabajo.descripcion && (
                  <p className="text-sm font-mono text-text-dim mt-0.5 truncate">{trabajo.archivo.nombre}</p>
                )}
                <div className="flex items-center gap-3 mt-2 flex-wrap">
                  {/* Prioridad */}
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full border"
                    style={{ color: PRIORIDAD_CONFIG[trabajo.prioridad]?.color, borderColor: PRIORIDAD_CONFIG[trabajo.prioridad]?.color + '50', background: PRIORIDAD_CONFIG[trabajo.prioridad]?.bg }}>
                    {PRIORIDAD_CONFIG[trabajo.prioridad]?.label || trabajo.prioridad}
                  </span>
                  {/* Máquina */}
                  <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-primary/15 text-primary">
                    {MAQUINA_LABEL[trabajo.maquina] || trabajo.maquina}
                  </span>
                  {/* Auto-detectado */}
                  {trabajo.creadoAutomaticamente && (
                    <span className="text-xs text-text-dim bg-surface-3 px-2.5 py-1 rounded-full">Auto-detectado</span>
                  )}
                </div>
              </div>

              {/* Acciones */}
              <div className="flex items-center gap-2 flex-wrap">
                {me?.rol === 'admin' && (
                  <button onClick={handleDelete} className="btn-ghost text-error hover:bg-error/10 hover:text-error">
                    <Trash2 className="w-4 h-4 mr-2" /> Eliminar
                  </button>
                )}
                {/* Dropdown estado */}
                <div className="relative">
                  <button
                    onClick={() => setEstadoOpen(p => !p)}
                    disabled={cambiandoEstado}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl font-semibold text-sm border transition-all hover:opacity-80"
                    style={{ background: cfg.bg, borderColor: cfg.color + '60', color: cfg.color }}
                  >
                    {cambiandoEstado
                      ? <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      : <Icon className="w-4 h-4" />}
                    {cfg.label}
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                  <AnimatePresence>
                    {estadoOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setEstadoOpen(false)} />
                        <motion.div
                          className="absolute z-40 top-full mt-2 right-0 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden min-w-[200px]"
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        >
                          {ESTADOS.map((e) => {
                            const c = ESTADO_CONFIG[e];
                            const EIcon = c.icon;
                            return (
                              <button key={e} onClick={() => cambiarEstado(e)}
                                className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-surface-3 ${e === trabajo.estado ? 'opacity-50 cursor-default' : ''}`}>
                                <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                                  <EIcon className="w-3.5 h-3.5" style={{ color: c.color }} />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium" style={{ color: e === trabajo.estado ? c.color : 'var(--text)' }}>{c.label}</p>
                                  <p className="text-[10px] text-text-dim">{c.desc}</p>
                                </div>
                                {e === trabajo.estado && <Check className="w-3.5 h-3.5 ml-auto" style={{ color: c.color }} />}
                              </button>
                            );
                          })}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <button onClick={() => setShowEdit(true)} className="btn-ghost py-2" title="Editar trabajo">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── KPI row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Valor */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-success/15 flex items-center justify-center flex-shrink-0">
            <DollarSign className="w-5 h-5 text-success" />
          </div>
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-wider">Valor Trabajo</p>
            <p className="text-lg font-bold text-success">{formatCOP(trabajo.valor)}</p>
          </div>
        </div>

        {/* Cobrado */}
        <div
          className={`card flex items-center gap-3 cursor-pointer hover:border-success/40 transition-all ${trabajo.cobrado ? 'border-success/30 bg-success/5' : 'border-red-500/20'}`}
          onClick={() => setShowCobro(true)}
          title="Click para gestionar cobro"
        >
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${trabajo.cobrado ? 'bg-success/20' : 'bg-red-500/10'}`}>
            <DollarSign className={`w-5 h-5 ${trabajo.cobrado ? 'text-success' : 'text-red-400'}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-text-dim uppercase tracking-wider">
              {trabajo.cobrado ? 'Cobrado ✓' : '⚠ Sin Cobrar'}
            </p>
            <p className={`text-base font-bold ${trabajo.cobrado ? 'text-success' : 'text-red-400'}`}>
              {trabajo.cobrado ? formatCOP(trabajo.valorCobrado || trabajo.valor) : formatCOP(trabajo.valor)}
            </p>
            {trabajo.cobrado && trabajo.notaCobro && (
              <p className="text-[10px] text-text-dim truncate">{trabajo.notaCobro}</p>
            )}
            {!trabajo.cobrado && (
              <p className="text-[10px] text-red-400/70">Click para registrar pago</p>
            )}
          </div>
        </div>

        {/* Medidas / m² */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center flex-shrink-0">
            <Ruler className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-wider">Medidas</p>
            {trabajo.medidas && trabajo.medidas.alto > 0 ? (
              <>
                <p className="text-sm font-bold text-text">
                  {trabajo.medidas.alto} × {trabajo.medidas.ancho} {trabajo.medidas.unidad}
                </p>
                {(trabajo.medidas.metrosCuadrados || 0) > 0 && (
                  <p className="text-[10px] text-text-dim">{trabajo.medidas.metrosCuadrados?.toFixed(2)} m²</p>
                )}
              </>
            ) : <p className="text-sm text-text-dim italic">Sin medidas</p>}
          </div>
        </div>

        {/* Tiempo */}
        <div className="card flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/15 flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-[#8B5CF6]" />
          </div>
          <div>
            <p className="text-[10px] text-text-dim uppercase tracking-wider">Tiempo Prod.</p>
            {tiempoProduccion !== null
              ? <p className="text-sm font-bold text-text">{tiempoProduccion} horas</p>
              : <p className="text-sm text-text-dim italic">En proceso</p>}
            {trabajo.tiempoInicio && (
              <p className="text-[10px] text-text-dim">
                Inicio: {new Date(trabajo.tiempoInicio).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Layout: info + cliente + historial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Col izq: detalles + acciones */}
        <div className="space-y-4">
          {/* Datos del trabajo */}
          <div className="card space-y-3">
            <h3 className="text-sm font-semibold text-text flex items-center gap-2">
              <Package className="w-4 h-4 text-text-dim" /> Detalles del Trabajo
            </h3>
            <DataRow icon={Hash} label="ID" value={trabajo._id.slice(-8).toUpperCase()} mono />
            <DataRow icon={FileText} label="Tipo" value={trabajo.tipo} />
            <DataRow icon={Printer} label="Máquina" value={MAQUINA_LABEL[trabajo.maquina] || trabajo.maquina} />
            <DataRow icon={Calendar} label="Creado" value={formatDateTime(trabajo.createdAt)} />
            {trabajo.tiempoInicio && <DataRow icon={Zap} label="Inicio producción" value={formatDateTime(trabajo.tiempoInicio)} />}
            {trabajo.tiempoFin && <DataRow icon={CheckCircle2} label="Finalizado" value={formatDateTime(trabajo.tiempoFin)} />}
            {trabajo.creadoPor && <DataRow icon={User} label="Creado por" value={trabajo.creadoPor.nombre} />}
            {trabajo.archivo.carpetaOrigen && <DataRow icon={FileText} label="Carpeta origen" value={trabajo.archivo.carpetaOrigen} mono />}
            {trabajo.observaciones && (
              <div className="pt-2 border-t border-border">
                <p className="text-[10px] text-text-dim uppercase tracking-wider mb-1">Observaciones</p>
                <p className="text-sm text-text-muted leading-relaxed">{trabajo.observaciones}</p>
              </div>
            )}
          </div>

          {/* WhatsApp si está terminado */}
          {trabajo.estado === 'terminado' && trabajo.cliente?.telefono && (
            <div className="card space-y-3" style={{ borderColor: '#25D36630', background: '#25D36608' }}>
              <h3 className="text-sm font-semibold flex items-center gap-2" style={{ color: '#25D366' }}>
                <MessageCircle className="w-4 h-4" /> Notificar al Cliente
              </h3>
              <p className="text-xs text-text-muted">El trabajo está terminado. Avisa al cliente por WhatsApp.</p>
              <div className="flex gap-2">
                <a href={whatsappLink!} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl font-semibold text-sm transition-all"
                  style={{ background: 'linear-gradient(135deg, #25D366, #128C7E)', color: '#fff' }}>
                  <ExternalLink className="w-4 h-4" /> Abrir WhatsApp
                </a>
                {!trabajo.whatsappEnviado && (
                  <button
                    onClick={async () => {
                      await api.patch(`/produccion/${trabajo._id}/whatsapp`);
                      setTrabajo(p => p ? { ...p, whatsappEnviado: true } : p);
                      toast.success('Marcado como avisado');
                    }}
                    className="px-3 py-2.5 rounded-xl text-sm font-medium border transition-all"
                    style={{ borderColor: '#25D36640', color: '#25D366', background: '#25D36615' }}>
                    <Send className="w-4 h-4" />
                  </button>
                )}
              </div>
              {trabajo.whatsappEnviado && (
                <div className="flex items-center gap-2 text-xs" style={{ color: '#25D366' }}>
                  <Check className="w-3.5 h-3.5" /> Cliente avisado por WhatsApp
                </div>
              )}
            </div>
          )}
        </div>

        {/* Col centro: Cliente */}
        <div className="space-y-4">
          {!trabajo.sinCliente && trabajo.cliente ? (
            <div className="card space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                  <User className="w-4 h-4 text-text-dim" /> Cliente
                </h3>
                <Link to={`/clientes/${trabajo.cliente._id}`}
                  className="text-xs text-primary hover:underline flex items-center gap-1">
                  Ver perfil <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-lg font-bold">{trabajo.cliente.nombre.charAt(0)}</span>
                </div>
                <div>
                  <p className="font-bold text-text">{trabajo.cliente.nombre}</p>
                  {trabajo.cliente.empresa && <p className="text-xs text-text-muted">{trabajo.cliente.empresa}</p>}
                  {trabajo.cliente.telefono && (
                    <p className="text-xs text-text-dim font-mono mt-0.5">{trabajo.cliente.telefono}</p>
                  )}
                </div>
              </div>
              {trabajo.cliente.telefono && (
                <a href={`https://wa.me/${trabajo.cliente.telefono.replace(/[\s\-().+]/g, '').replace(/^(\d{10})$/, '57$1')}?text=${encodeURIComponent(`Hola ${trabajo.cliente.nombre}, te contactamos desde Publiart. `)}`}
                  target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-2 rounded-xl text-sm font-medium transition-all"
                  style={{ background: '#25D36615', color: '#25D366', border: '1px solid #25D36630' }}>
                  <MessageCircle className="w-4 h-4" /> Contactar por WhatsApp
                </a>
              )}
            </div>
          ) : (
            <div className="card text-center space-y-3">
              <AlertTriangle className="w-8 h-8 text-yellow-400 mx-auto" />
              <p className="text-sm text-text-muted mb-2">Sin cliente asignado</p>
              <button
                onClick={() => setShowAsignarCliente(true)}
                className="btn-outline w-full justify-center text-xs py-2"
              >
                <User className="w-3.5 h-3.5 mr-2" /> Asignar Cliente
              </button>
            </div>
          )}

          {/* Cobro resumen */}
          <div className={`card cursor-pointer transition-all hover:border-success/40 ${trabajo.cobrado ? 'border-success/30 bg-success/5' : 'border-border'}`}
            onClick={() => setShowCobro(true)}>
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-text flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-text-dim" /> Estado de Pago
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${trabajo.cobrado ? 'bg-success/20 text-success' : 'bg-red-500/20 text-red-400'}`}>
                {trabajo.cobrado ? '✓ Cobrado' : '⚠ Pendiente'}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-text-muted">Valor trabajo</span>
                <span className="font-bold text-text">{formatCOP(trabajo.valor)}</span>
              </div>
              {trabajo.cobrado && trabajo.valorCobrado && (
                <div className="flex justify-between text-sm">
                  <span className="text-text-muted">Cobrado</span>
                  <span className="font-bold text-success">{formatCOP(trabajo.valorCobrado)}</span>
                </div>
              )}
              {trabajo.cobrado && trabajo.valorCobrado && trabajo.valorCobrado !== trabajo.valor && (
                <div className="flex justify-between text-sm pt-1 border-t border-border">
                  <span className="text-text-muted">Diferencia</span>
                  <span className={`font-bold ${trabajo.valorCobrado > trabajo.valor ? 'text-success' : 'text-red-400'}`}>
                    {trabajo.valorCobrado > trabajo.valor ? '+' : ''}{formatCOP(trabajo.valorCobrado - trabajo.valor)}
                  </span>
                </div>
              )}
              {!trabajo.cobrado && (
                <div className="flex justify-between text-sm pt-1 border-t border-red-500/20">
                  <span className="text-red-400">Por cobrar</span>
                  <span className="font-bold text-red-400">{formatCOP(trabajo.valor)}</span>
                </div>
              )}
              {trabajo.notaCobro && (
                <p className="text-xs text-text-dim bg-surface-3 rounded-lg px-3 py-2 mt-2">📝 {trabajo.notaCobro}</p>
              )}
            </div>
            <button className="w-full mt-3 py-2 rounded-lg text-xs font-medium bg-surface-3 text-text-muted hover:bg-surface-4 transition-colors">
              {trabajo.cobrado ? 'Modificar cobro →' : 'Registrar pago →'}
            </button>
          </div>
        </div>

        {/* Col der: Historial */}
        <div className="card">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2 mb-4">
            <History className="w-4 h-4 text-text-dim" /> Historial de Estados
          </h3>
          <div className="relative">
            {/* Línea vertical */}
            <div className="absolute left-3 top-0 bottom-0 w-px bg-border" />
            <div className="space-y-4">
              {[...trabajo.historialEstados].reverse().map((h, i) => {
                const hCfg = ESTADO_CONFIG[h.estado] || { color: '#64748B', bg: '#64748B20', icon: Clock };
                const HIcon = hCfg.icon;
                return (
                  <motion.div key={i}
                    className="flex gap-3 items-start"
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                  >
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 z-10" style={{ background: hCfg.bg, border: `1.5px solid ${hCfg.color}60` }}>
                      <HIcon className="w-3 h-3" style={{ color: hCfg.color }} />
                    </div>
                    <div className="flex-1 pb-4">
                      <p className="text-xs font-semibold" style={{ color: hCfg.color }}>{hCfg.label || h.estado}</p>
                      <p className="text-[10px] text-text-dim mt-0.5">
                        {new Date(h.fecha).toLocaleString('es-CO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {h.usuario?.nombre && (
                        <p className="text-[10px] text-text-dim">por {h.usuario.nombre}</p>
                      )}
                      {h.observacion && (
                        <p className="text-[10px] text-text-muted mt-1 italic bg-surface-3 px-2 py-1 rounded-lg">{h.observacion}</p>
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Modales ── */}
      <AnimatePresence>
        {showCobro && (
          <CobroModal trabajo={trabajo} onClose={() => setShowCobro(false)} onActualizado={fetchTrabajo} />
        )}
        {showEdit && (
          <EditObsModal trabajo={trabajo} onClose={() => setShowEdit(false)} onActualizado={fetchTrabajo} />
        )}
        {showAsignarCliente && (
          <AsignarClienteModal
            trabajo={trabajo as any}
            onClose={() => setShowAsignarCliente(false)}
            onAsignado={fetchTrabajo}
          />
        )}
      </AnimatePresence>

      <WhatsAppModal
        isOpen={waModal.open}
        onClose={() => setWaModal(p => ({ ...p, open: false }))}
        trabajoId={trabajo._id}
        whatsapp={waModal.whatsapp}
        clienteNombre={trabajo.cliente?.nombre || ''}
        archivoNombre={trabajo.descripcion || trabajo.archivo.nombre}
        estadoNuevo={waModal.estadoNuevo}
        onAvisado={() => setTrabajo(p => p ? { ...p, whatsappEnviado: true } : p)}
      />
    </div>
  );
}

// ─── Helper component ─────────────────────────────────────────────────────────
function DataRow({ icon: Icon, label, value, mono }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2.5">
      <Icon className="w-3.5 h-3.5 text-text-dim flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <p className="text-[10px] text-text-dim">{label}</p>
        <p className={`text-xs font-medium text-text truncate ${mono ? 'font-mono' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
