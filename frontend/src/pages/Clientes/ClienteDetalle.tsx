import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Phone, Mail, Building2, MapPin, Hash,
  TrendingUp, FileText, Zap, Clock, Edit2, Check, X,
  Plus, ChevronRight, AlertTriangle, Package,
  MessageCircle, DollarSign, Bell, ExternalLink,
  ChevronDown, Layers, Wallet, Camera, Loader2, Trash2,
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import NuevoTrabajoModal from '../../components/produccion/NuevoTrabajoModal';
import WhatsAppModal from '../../components/whatsapp/WhatsAppModal';

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString('es-CO', { day: '2-digit', month: 'short', year: 'numeric' });

const ESTADO_BADGE: Record<string, string> = {
  potencial:   'bg-slate-500/20 text-slate-400 border border-slate-500/30',
  negociacion: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  activo:      'bg-green-500/20 text-green-400 border border-green-500/30',
  frecuente:   'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
  inactivo:    'bg-red-500/20 text-red-400 border border-red-500/30',
};

const ESTADO_TRABAJO_COLOR: Record<string, { color: string; bg: string }> = {
  pendiente:  { color: '#F59E0B', bg: '#F59E0B20' },
  'diseño':   { color: '#8B5CF6', bg: '#8B5CF620' },
  produccion: { color: '#3B82F6', bg: '#3B82F620' },
  corte:      { color: '#EC4899', bg: '#EC489920' },
  terminado:  { color: '#22C55E', bg: '#22C55E20' },
  entregado:  { color: '#64748B', bg: '#64748B20' },
};

const ESTADOS_TRABAJO = ['pendiente', 'diseño', 'produccion', 'corte', 'terminado', 'entregado'];

const ESTADO_COT_COLOR: Record<string, string> = {
  borrador:   'bg-slate-500/20 text-slate-400',
  enviada:    'bg-blue-500/20 text-blue-400',
  aprobada:   'bg-green-500/20 text-green-400',
  rechazada:  'bg-red-500/20 text-red-400',
  convertida: 'bg-yellow-500/20 text-yellow-400',
};

const ESTADO_FAC_COLOR: Record<string, string> = {
  pendiente: 'bg-yellow-500/20 text-yellow-400',
  parcial:   'bg-blue-500/20 text-blue-400',
  pagada:    'bg-green-500/20 text-green-400',
  cancelada: 'bg-red-500/20 text-red-400',
};

const ESTADOS_CLIENTE = ['potencial', 'negociacion', 'activo', 'frecuente', 'inactivo'];

const MAQUINA_LABEL: Record<string, string> = {
  plotterVinilo: 'Vinilo', plotterBanner: 'Banner',
  corte: 'Corte', laser: 'Láser', laminado: 'Laminado', instalacion: 'Instalación',
};

type Tab = 'trabajos' | 'cotizaciones' | 'facturas';

interface Cliente {
  _id: string; nombre: string; empresa?: string; telefono?: string;
  correo?: string; nit?: string; ciudad?: string; estado: string;
  observaciones?: string; foto?: string; createdAt: string;
}

interface Stats {
  totalFacturado: number; deudaTotal: number; numFacturas: number;
  numCotizaciones: number; trabajosActivos: number; trabajosTerminados: number;
  trabajosPendientesAviso: number; statsPorTipo: Record<string, number>;
}

interface TrabajoActivo {
  _id: string; archivo: { nombre: string }; descripcion?: string;
  maquina: string; tipo: string; estado: string; valor: number;
  prioridad: string; medidas?: { alto: number; ancho: number; unidad: string };
  whatsappEnviado: boolean; createdAt: string;
  cobrado: boolean; valorCobrado?: number;
}

interface Cotizacion {
  _id: string; numero: number; total: number; estado: string; createdAt: string;
}

interface Factura {
  _id: string; numero: number; total: number; totalPagado: number;
  saldoPendiente: number; estado: string; createdAt: string;
}

interface WaPayload { numero: string; mensaje: string; link: string; }

// ─── Dropdown Estado Trabajo ──────────────────────────────────────────────────
function EstadoTrabajoDropdown({
  trabajo, onCambiado,
}: {
  trabajo: TrabajoActivo;
  onCambiado: (nuevoEstado: string, wa: WaPayload | null) => void;
}) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const cfg = ESTADO_TRABAJO_COLOR[trabajo.estado] || ESTADO_TRABAJO_COLOR.pendiente;

  const cambiar = async (nuevoEstado: string) => {
    setOpen(false);
    if (nuevoEstado === trabajo.estado) return;
    setLoading(true);
    try {
      const res = await api.patch(`/produccion/${trabajo._id}/estado`, { estado: nuevoEstado });
      onCambiado(nuevoEstado, res.data.whatsapp || null);
      toast.success(`Estado → ${nuevoEstado}`);
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full border transition-all hover:opacity-80"
        style={{ background: cfg.bg, borderColor: cfg.color + '50', color: cfg.color }}
      >
        {loading ? <div className="w-2.5 h-2.5 border border-current border-t-transparent rounded-full animate-spin" /> : null}
        {trabajo.estado}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute z-40 top-full mt-1 right-0 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden min-w-[140px]"
              initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
            >
              {ESTADOS_TRABAJO.map((e) => {
                const c = ESTADO_TRABAJO_COLOR[e] || { color: '#64748B', bg: '#64748B20' };
                return (
                  <button key={e} onClick={() => cambiar(e)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs hover:bg-surface-3 transition-colors">
                    <div className="w-2 h-2 rounded-full" style={{ background: c.color }} />
                    <span style={{ color: e === trabajo.estado ? c.color : 'var(--text)' }} className="font-medium">{e}</span>
                    {e === trabajo.estado && <Check className="w-3 h-3 ml-auto" style={{ color: c.color }} />}
                  </button>
                );
              })}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function ClienteDetalle() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: me } = useAuthStore();

  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [trabajosActivos, setTrabajosActivos] = useState<TrabajoActivo[]>([]);
  const [trabajosTodos, setTrabajosTodos] = useState<TrabajoActivo[]>([]);
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [whatsappContacto, setWhatsappContacto] = useState<WaPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('trabajos');
  const [mostrarTodosTrabajos, setMostrarTodosTrabajos] = useState(false);

  const [editField, setEditField] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [uploadingFoto, setUploadingFoto] = useState(false);

  const [showNuevoTrabajo, setShowNuevoTrabajo] = useState(false);
  const [waModal, setWaModal] = useState<{
    open: boolean; trabajoId: string; whatsapp: WaPayload | null;
    clienteNombre: string; archivoNombre: string; estadoNuevo: string;
  }>({ open: false, trabajoId: '', whatsapp: null, clienteNombre: '', archivoNombre: '', estadoNuevo: '' });

  const fetchData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/clientes/${id}/resumen`);
      setCliente(res.data.cliente);
      setStats(res.data.stats);
      setTrabajosActivos(res.data.trabajosActivos || []);
      setTrabajosTodos(res.data.trabajosTodos || []);
      setCotizaciones(res.data.ultimasCotizaciones || []);
      setFacturas(res.data.ultimasFacturas || []);
      setWhatsappContacto(res.data.whatsappContacto || null);
    } catch {
      toast.error('No se pudo cargar el cliente');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [id]);

  const startEdit = (field: string, value: string) => {
    setEditField(field); setEditValue(value || '');
  };
  const saveEdit = async () => {
    if (!id || !editField) return;
    try {
      const res = await api.put(`/clientes/${id}`, { [editField]: editValue });
      setCliente(res.data.cliente);
      toast.success('Actualizado');
    } catch { toast.error('Error al actualizar'); }
    finally { setEditField(null); }
  };
  const cancelEdit = () => setEditField(null);

  const handleEstadoTrabajoCambiado = (trabajoId: string, nuevoEstado: string, wa: WaPayload | null) => {
    const update = (list: TrabajoActivo[]) =>
      list.map((t) => t._id === trabajoId ? { ...t, estado: nuevoEstado } : t);
    setTrabajosActivos(update);
    setTrabajosTodos(update);
    if (wa && cliente && (nuevoEstado === 'terminado' || nuevoEstado === 'entregado')) {
      const trabajo = trabajosTodos.find((t) => t._id === trabajoId);
      setWaModal({
        open: true, trabajoId,
        whatsapp: wa,
        clienteNombre: cliente.nombre,
        archivoNombre: trabajo?.descripcion || trabajo?.archivo.nombre || '',
        estadoNuevo: nuevoEstado,
      });
    }
  };

  const handleFotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    if (file.size > 5 * 1024 * 1024) return toast.error('La imagen no debe superar los 5MB');

    const formData = new FormData();
    formData.append('foto', file);

    setUploadingFoto(true);
    try {
      const res = await api.post(`/clientes/${id}/foto`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCliente(res.data.cliente);
      toast.success('Foto actualizada');
    } catch {
      toast.error('Error al subir la foto');
    } finally {
      setUploadingFoto(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar a este cliente? Esta acción no se puede deshacer y puede afectar historiales.')) return;
    try {
      await api.delete(`/clientes/${id}`);
      toast.success('Cliente eliminado correctamente');
      navigate('/clientes');
    } catch {
      toast.error('Error al eliminar cliente');
    }
  };

  if (loading) {
    return (
      <div className="space-y-5">
        <div className="shimmer-effect h-36 rounded-2xl bg-surface-3" />
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="shimmer-effect h-20 rounded-xl bg-surface-3" />
          ))}
        </div>
      </div>
    );
  }

  if (!cliente) {
    return (
      <div className="text-center py-20 text-text-muted">
        <p>Cliente no encontrado</p>
        <button onClick={() => navigate('/clientes')} className="btn-primary mt-4">Volver</button>
      </div>
    );
  }

  const initials = cliente.nombre.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();

  const EditableField = ({ field, value, label, icon: Icon }: { field: string; value?: string; label: string; icon: React.ElementType }) => {
    const isEditing = editField === field;
    return (
      <div className="flex items-start gap-3 group">
        <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Icon className="w-4 h-4 text-text-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] text-text-dim uppercase tracking-wider">{label}</p>
          {isEditing ? (
            <div className="flex items-center gap-2 mt-1">
              <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                className="input text-sm py-1 flex-1" />
              <button onClick={saveEdit} className="text-green-400 hover:text-green-300 transition-colors"><Check className="w-4 h-4" /></button>
              <button onClick={cancelEdit} className="text-text-dim hover:text-text-muted transition-colors"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-text mt-0.5 truncate">{value || <span className="text-text-dim italic">Sin datos</span>}</p>
              <button onClick={() => startEdit(field, value || '')}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-primary">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const trabajosMostrar = mostrarTodosTrabajos ? trabajosTodos : trabajosActivos;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* ── Header ── */}
      <div className="flex items-start gap-4">
        <button onClick={() => navigate('/clientes')} className="btn-ghost mt-1">
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="relative group w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center flex-shrink-0 overflow-hidden border border-primary/20 cursor-pointer">
              {cliente.foto ? (
                <img
                  src={`${import.meta.env.VITE_API_URL?.replace('/api', '') || `http://${window.location.hostname}:5000`}/uploads/clientes/${cliente.foto}`}
                  alt={cliente.nombre}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-primary text-xl font-bold">{initials}</span>
              )}
              
              {/* Overlay hover para subir foto */}
              <label className={`absolute inset-0 bg-black/50 flex flex-col items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer ${uploadingFoto ? 'opacity-100' : ''}`}>
                {uploadingFoto ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleFotoUpload} disabled={uploadingFoto} />
              </label>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                {editField === 'nombre' ? (
                  <div className="flex items-center gap-2">
                    <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="input text-xl font-bold py-1" />
                    <button onClick={saveEdit} className="text-green-400"><Check className="w-5 h-5" /></button>
                    <button onClick={cancelEdit} className="text-text-dim"><X className="w-5 h-5" /></button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group">
                    <h2 className="text-2xl font-bold text-text">{cliente.nombre}</h2>
                    <button onClick={() => startEdit('nombre', cliente.nombre)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-primary">
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
                {/* Estado */}
                {editField === 'estado' ? (
                  <div className="flex items-center gap-2">
                    <select autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)} className="input text-sm py-1 w-auto">
                      {ESTADOS_CLIENTE.map((e) => <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>)}
                    </select>
                    <button onClick={saveEdit} className="text-green-400"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="text-text-dim"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button onClick={() => startEdit('estado', cliente.estado)}
                    className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer transition-opacity hover:opacity-80 ${ESTADO_BADGE[cliente.estado] || ESTADO_BADGE.potencial}`}>
                    {cliente.estado}
                  </button>
                )}
              </div>
              {cliente.empresa && (
                <p className="text-text-muted mt-1 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4" /> {cliente.empresa}
                </p>
              )}
              <p className="text-xs text-text-dim mt-0.5">Cliente desde {formatDate(cliente.createdAt)}</p>
            </div>

            {/* Acciones rápidas */}
            <div className="flex items-center gap-2 ml-auto">
              {me?.rol === 'admin' && (
                <button onClick={handleDelete} className="btn-ghost text-error hover:bg-error/10 hover:text-error h-10 px-3">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {/* WhatsApp directo */}
              {cliente.telefono && whatsappContacto && (
                <a href={whatsappContacto.link} target="_blank" rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium transition-all"
                  style={{ background: '#25D36620', color: '#25D366', border: '1px solid #25D36640' }}
                  title={`WhatsApp a ${cliente.telefono}`}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              )}
              <button onClick={() => setShowNuevoTrabajo(true)} className="btn-primary">
                <Plus className="w-4 h-4" /> Nuevo trabajo
              </button>
              <Link to={`/cotizaciones/nueva?clienteId=${id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`}
                className="btn-outline">
                <FileText className="w-4 h-4" /> Cotización
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Aviso de trabajos pendientes de aviso ── */}
      {stats && stats.trabajosPendientesAviso > 0 && (
        <motion.div
          className="flex items-center gap-3 bg-[#25D366]/10 border border-[#25D366]/30 rounded-xl p-4"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}
        >
          <Bell className="w-5 h-5 text-[#25D366] flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-[#25D366]">
              {stats.trabajosPendientesAviso} {stats.trabajosPendientesAviso === 1 ? 'trabajo terminado sin avisar' : 'trabajos terminados sin avisar'}
            </p>
            <p className="text-xs text-[#25D366]/70">¡Notifica al cliente por WhatsApp!</p>
          </div>
          <button onClick={() => setTab('trabajos')}
            className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: '#25D36620', color: '#25D366', border: '1px solid #25D36640' }}>
            Ver trabajos
          </button>
        </motion.div>
      )}

      {/* ── KPI Cards ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
          {[
            {
              label: 'Total Facturado',
              value: formatCOP(stats.totalFacturado),
              icon: TrendingUp, color: '#22C55E', span: 1,
            },
            {
              label: 'Deuda Pendiente',
              value: formatCOP(stats.deudaTotal),
              icon: Wallet,
              color: stats.deudaTotal > 0 ? '#EF4444' : '#22C55E',
              span: 1,
              highlight: stats.deudaTotal > 0,
            },
            { label: 'Facturas', value: String(stats.numFacturas), icon: FileText, color: '#3B82F6', span: 1 },
            { label: 'Cotizaciones', value: String(stats.numCotizaciones), icon: FileText, color: '#8B5CF6', span: 1 },
            { label: 'En Proceso', value: String(stats.trabajosActivos), icon: AlertTriangle, color: '#F59E0B', span: 1 },
            { label: 'Completados', value: String(stats.trabajosTerminados), icon: Package, color: '#22C55E', span: 1 },
          ].map((kpi, i) => (
            <motion.div
              key={kpi.label}
              className={`card flex items-center gap-3 py-4 ${kpi.highlight ? 'border-red-500/30 bg-red-500/5' : ''}`}
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${kpi.color}20` }}>
                <kpi.icon className="w-4 h-4" style={{ color: kpi.color }} />
              </div>
              <div>
                <p className="text-[10px] text-text-dim uppercase tracking-wider">{kpi.label}</p>
                <p className="text-base font-bold" style={{ color: kpi.highlight ? kpi.color : 'var(--text)' }}>
                  {kpi.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Deuda detallada (si tiene) ── */}
      {stats && stats.deudaTotal > 0 && (
        <div className="flex items-center gap-3 bg-red-500/8 border border-red-500/20 rounded-xl p-4">
          <DollarSign className="w-5 h-5 text-red-400 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-300">
              Deuda total: <span className="font-bold">{formatCOP(stats.deudaTotal)}</span>
            </p>
            <p className="text-xs text-red-400/70">Saldo pendiente en facturas activas</p>
          </div>
          <button onClick={() => setTab('facturas')} className="text-xs px-3 py-1.5 rounded-lg font-medium"
            style={{ background: '#EF444420', color: '#EF4444', border: '1px solid #EF444430' }}>
            Ver facturas
          </button>
        </div>
      )}

      {/* ── Layout: contacto + historial ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Datos de contacto */}
        <div className="card space-y-4">
          <h3 className="text-sm font-semibold text-text">Datos de Contacto</h3>
          {/* Teléfono con botón WA */}
          <div className="flex items-start gap-3 group">
            <div className="w-8 h-8 rounded-lg bg-surface-3 flex items-center justify-center flex-shrink-0 mt-0.5">
              <Phone className="w-4 h-4 text-text-muted" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[10px] text-text-dim uppercase tracking-wider">Teléfono</p>
              <div className="flex items-center gap-2">
                {editField === 'telefono' ? (
                  <div className="flex items-center gap-2 mt-1">
                    <input autoFocus value={editValue} onChange={(e) => setEditValue(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') cancelEdit(); }}
                      className="input text-sm py-1 flex-1" />
                    <button onClick={saveEdit} className="text-green-400"><Check className="w-4 h-4" /></button>
                    <button onClick={cancelEdit} className="text-text-dim"><X className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <>
                    <p className="text-sm text-text mt-0.5">{cliente.telefono || <span className="text-text-dim italic">Sin datos</span>}</p>
                    <button onClick={() => startEdit('telefono', cliente.telefono || '')}
                      className="opacity-0 group-hover:opacity-100 transition-opacity text-text-dim hover:text-primary">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    {cliente.telefono && whatsappContacto && (
                      <a href={whatsappContacto.link} target="_blank" rel="noopener noreferrer"
                        className="text-[#25D366] hover:text-[#128C7E] transition-colors ml-1" title="Abrir WhatsApp">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
          <EditableField field="correo"    value={cliente.correo}    label="Correo"     icon={Mail}       />
          <EditableField field="empresa"   value={cliente.empresa}   label="Empresa"    icon={Building2}  />
          <EditableField field="ciudad"    value={cliente.ciudad}    label="Ciudad"     icon={MapPin}     />
          <EditableField field="nit"       value={cliente.nit}       label="NIT / CC"   icon={Hash}       />
          {cliente.observaciones !== undefined && (
            <EditableField field="observaciones" value={cliente.observaciones} label="Observaciones" icon={FileText} />
          )}
        </div>

        {/* Historial tabs */}
        <div className="lg:col-span-2 card">
          <div className="flex gap-1 mb-5 bg-surface-3 rounded-lg p-1">
            {([
              { id: 'trabajos', label: `Trabajos` },
              { id: 'cotizaciones', label: `Cotizaciones (${stats?.numCotizaciones || 0})` },
              { id: 'facturas', label: `Facturas (${stats?.numFacturas || 0})` },
            ] as { id: Tab; label: string }[]).map((t) => (
              <button key={t.id} onClick={() => setTab(t.id)}
                className={`flex-1 text-xs py-1.5 rounded-md transition-all font-medium ${tab === t.id ? 'bg-primary text-dark' : 'text-text-muted hover:text-text'}`}>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab — Trabajos */}
          {tab === 'trabajos' && (
            <div className="space-y-3">
              {/* Toggle activos/todos */}
              <div className="flex items-center gap-2 mb-3">
                <button
                  onClick={() => setMostrarTodosTrabajos(false)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${!mostrarTodosTrabajos ? 'bg-primary text-dark' : 'text-text-muted hover:text-text'}`}>
                  <Zap className="w-3 h-3 inline mr-1" />
                  Activos ({stats?.trabajosActivos || 0})
                </button>
                <button
                  onClick={() => setMostrarTodosTrabajos(true)}
                  className={`text-xs px-3 py-1 rounded-lg font-medium transition-all ${mostrarTodosTrabajos ? 'bg-primary text-dark' : 'text-text-muted hover:text-text'}`}>
                  <Layers className="w-3 h-3 inline mr-1" />
                  Todos ({trabajosTodos.length})
                </button>
              </div>

              {trabajosMostrar.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  <Zap className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sin trabajos</p>
                  <button onClick={() => setShowNuevoTrabajo(true)} className="btn-outline mt-3 text-xs">
                    <Plus className="w-3 h-3" /> Crear trabajo
                  </button>
                </div>
              ) : (
                Object.entries(
                  trabajosMostrar.reduce((acc, t) => {
                    const fecha = new Date(t.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' });
                    if (!acc[fecha]) acc[fecha] = { trabajos: [], deuda: 0, total: 0 };
                    acc[fecha].trabajos.push(t);
                    acc[fecha].total += (t.valor || 0);
                    const deuda = t.cobrado ? 0 : (t.valor - (t.valorCobrado || 0));
                    acc[fecha].deuda += Math.max(0, deuda);
                    return acc;
                  }, {} as Record<string, { trabajos: TrabajoActivo[], deuda: number, total: number }>)
                ).map(([fecha, data]) => (
                  <div key={fecha} className="mb-6 last:mb-0">
                    <div className="flex items-center justify-between mb-3 bg-surface-3/30 px-3 py-2 rounded-xl">
                      <h4 className="text-sm font-semibold capitalize flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" /> {fecha}
                      </h4>
                      <div className="text-right flex items-center gap-4">
                        <div>
                          <p className="text-[10px] text-text-dim uppercase">Total Día</p>
                          <p className="text-xs font-bold">{formatCOP(data.total)}</p>
                        </div>
                        {data.deuda > 0 && (
                          <div className="bg-red-500/10 px-2 py-0.5 rounded-lg border border-red-500/20">
                            <p className="text-[10px] text-red-400/80 uppercase">Deuda del día</p>
                            <p className="text-xs font-bold text-red-400">{formatCOP(data.deuda)}</p>
                          </div>
                        )}
                        {data.deuda === 0 && data.total > 0 && (
                          <div className="bg-green-500/10 px-2 py-0.5 rounded-lg border border-green-500/20">
                            <p className="text-[10px] text-green-400/80 uppercase">Estado</p>
                            <p className="text-xs font-bold text-green-400">Todo pagado</p>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      {data.trabajos.map((t) => {
                        const cfg = ESTADO_TRABAJO_COLOR[t.estado] || { color: '#64748B', bg: '#64748B20' };
                        const needsWa = t.estado === 'terminado' && !t.whatsappEnviado;
                        const deudaT = t.cobrado ? 0 : (t.valor - (t.valorCobrado || 0));
                        return (
                          <motion.div key={t._id}
                            className={`flex items-center gap-4 p-3 rounded-xl transition-colors cursor-pointer ${needsWa ? 'bg-[#25D366]/5 border border-[#25D366]/20 hover:bg-[#25D366]/10' : 'bg-surface-3 hover:bg-surface-4'}`}
                            initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                            onClick={() => navigate(`/produccion/${t._id}`)}>
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: cfg.bg }}>
                              <Package className="w-4 h-4" style={{ color: cfg.color }} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-text truncate">
                                {t.descripcion || t.archivo?.nombre || 'Sin nombre'}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary">
                                  {MAQUINA_LABEL[t.maquina] || t.maquina}
                                </span>
                                {t.medidas && Number(t.medidas.alto) > 0 && (
                                  <span className="text-[10px] text-text-dim">
                                    {t.medidas.alto}×{t.medidas.ancho} {t.medidas.unidad}
                                  </span>
                                )}
                                <span className="text-[10px] font-medium" style={{ color: t.cobrado ? '#22C55E' : (t.valorCobrado ? '#F59E0B' : '#EF4444') }}>
                                  {t.cobrado ? 'Cobrado' : (t.valorCobrado ? `Abono: ${formatCOP(t.valorCobrado)}` : 'No cobrado')}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0 mr-2">
                               <p className="text-sm font-bold text-success">{formatCOP(t.valor)}</p>
                               {!t.cobrado && deudaT > 0 && (
                                 <p className="text-[10px] font-medium text-red-400">Debe {formatCOP(deudaT)}</p>
                               )}
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                              {/* Botón WhatsApp si está terminado y no avisado */}
                              {needsWa && cliente.telefono && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const num = cliente.telefono!.replace(/[\s\-().+]/g, '');
                                    const prefixed = num.length === 10 ? `57${num}` : num;
                                    const archivo = t.descripcion || t.archivo?.nombre || '';
                                    const msg = `Hola ${cliente.nombre}, ¡te tenemos una buena noticia! 🎨\nTu trabajo *"${archivo}"* ya está listo para retirar en Publiart.\nPor favor avísanos cuándo puedes pasar. ¡Gracias! 😊`;
                                    setWaModal({
                                      open: true, trabajoId: t._id,
                                      whatsapp: { numero: prefixed, mensaje: msg, link: '' },
                                      clienteNombre: cliente.nombre,
                                      archivoNombre: archivo,
                                      estadoNuevo: 'terminado',
                                    });
                                  }}
                                  className="flex items-center gap-1 text-[10px] px-2 py-1 rounded-lg font-medium hover:opacity-80"
                                  style={{ background: '#25D36620', color: '#25D366', border: '1px solid #25D36630' }}>
                                  <MessageCircle className="w-3 h-3" /> Avisar
                                </button>
                              )}
                              <EstadoTrabajoDropdown
                                trabajo={t}
                                onCambiado={(nuevoEstado, wa) => handleEstadoTrabajoCambiado(t._id, nuevoEstado, wa)}
                              />
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Tab — Cotizaciones */}
          {tab === 'cotizaciones' && (
            <div className="space-y-3">
              <div className="flex justify-end mb-2">
                <Link to={`/cotizaciones/nueva?clienteId=${id}&clienteNombre=${encodeURIComponent(cliente.nombre)}`}
                  className="btn-primary text-xs py-1.5 px-3">
                  <Plus className="w-3 h-3" /> Nueva cotización
                </Link>
              </div>
              {cotizaciones.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sin cotizaciones</p>
                </div>
              ) : cotizaciones.map((c) => (
                <motion.div key={c._id}
                  className="flex items-center gap-4 p-3 bg-surface-3 rounded-xl hover:bg-surface-4 transition-colors"
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">COT-{String(c.numero).padStart(4, '0')}</p>
                    <div className="flex items-center gap-1 text-xs text-text-dim mt-0.5">
                      <Clock className="w-3 h-3" /> {formatDate(c.createdAt)}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ESTADO_COT_COLOR[c.estado] || ''}`}>{c.estado}</span>
                  <p className="text-sm font-bold text-text">{formatCOP(c.total)}</p>
                  <Link to={`/cotizaciones/${c._id}`} className="text-text-dim hover:text-primary">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* Tab — Facturas */}
          {tab === 'facturas' && (
            <div className="space-y-3">
              {facturas.length === 0 ? (
                <div className="text-center py-10 text-text-muted">
                  <FileText className="w-8 h-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Sin facturas</p>
                </div>
              ) : facturas.map((f) => (
                <motion.div key={f._id}
                  className={`flex items-center gap-4 p-3 rounded-xl transition-colors ${f.saldoPendiente > 0 ? 'bg-red-500/5 border border-red-500/20' : 'bg-surface-3 hover:bg-surface-4'}`}
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-text">FAC-{String(f.numero).padStart(4, '0')}</p>
                    <div className="flex items-center gap-1 text-xs text-text-dim mt-0.5">
                      <Clock className="w-3 h-3" /> {formatDate(f.createdAt)}
                    </div>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${ESTADO_FAC_COLOR[f.estado] || ''}`}>{f.estado}</span>
                  <div className="text-right">
                    <p className="text-sm font-bold text-text">{formatCOP(f.total)}</p>
                    {f.saldoPendiente > 0 && (
                      <p className="text-[11px] font-semibold text-red-400">
                        Debe: {formatCOP(f.saldoPendiente)}
                      </p>
                    )}
                  </div>
                  <Link to={`/facturas/${f._id}`} className="text-text-dim hover:text-primary">
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Modales ── */}
      <NuevoTrabajoModal
        isOpen={showNuevoTrabajo}
        onClose={() => setShowNuevoTrabajo(false)}
        clientePreseleccionado={cliente ? { id: cliente._id, nombre: cliente.nombre } : undefined}
        onCreado={fetchData}
      />

      <WhatsAppModal
        isOpen={waModal.open}
        onClose={() => setWaModal((p) => ({ ...p, open: false }))}
        trabajoId={waModal.trabajoId}
        whatsapp={waModal.whatsapp}
        clienteNombre={waModal.clienteNombre}
        archivoNombre={waModal.archivoNombre}
        estadoNuevo={waModal.estadoNuevo}
        onAvisado={fetchData}
      />
    </div>
  );
}
