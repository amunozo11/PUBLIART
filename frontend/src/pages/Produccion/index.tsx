import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Printer, Filter, Plus, AlertTriangle, X, Check, ChevronDown,
  MessageCircle, Clock, User, Search, RefreshCw, Layers,
  CheckCircle2, Package, Zap, ExternalLink, FolderOpen, Eye, Image,
} from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import WhatsAppModal from '../../components/whatsapp/WhatsAppModal';
import NuevoTrabajoModal from '../../components/produccion/NuevoTrabajoModal';
import AsignarClienteModal from '../../components/produccion/AsignarClienteModal';
// ─── Constantes ──────────────────────────────────────────────────────────────
const ESTADOS = ['pendiente', 'diseño', 'produccion', 'corte', 'terminado', 'entregado'];

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  pendiente:  { label: 'Pendiente',   color: '#F59E0B', bg: '#F59E0B20', icon: Clock },
  diseño:     { label: 'Diseño',      color: '#8B5CF6', bg: '#8B5CF620', icon: Zap },
  produccion: { label: 'Producción',  color: '#3B82F6', bg: '#3B82F620', icon: Printer },
  corte:      { label: 'Corte',       color: '#EC4899', bg: '#EC489920', icon: Layers },
  terminado:  { label: 'Terminado',   color: '#22C55E', bg: '#22C55E20', icon: CheckCircle2 },
  entregado:  { label: 'Entregado',   color: '#64748B', bg: '#64748B20', icon: Check },
};

const MAQUINA_LABEL: Record<string, string> = {
  plotterVinilo: 'Vinilo', plotterBanner: 'Banner',
  corte: 'Corte', laser: 'Láser', laminado: 'Laminado', instalacion: 'Instalación',
  dtf: 'DTF', corteSticker: 'Corte Sticker',
};

const PRIORIDAD_COLOR: Record<string, string> = {
  baja: '#64748B', media: '#3B82F6', alta: '#F59E0B', urgente: '#EF4444',
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

interface Trabajo {
  _id: string;
  archivo: { nombre: string; extension?: string; ruta?: string };
  descripcion?: string;
  cliente?: { _id: string; nombre: string; empresa?: string; telefono?: string };
  maquina: string;
  tipo: string;
  estado: string;
  valor: number;
  valorFormula?: string;
  valorCobrado?: number;
  cobrado: boolean;
  prioridad: string;
  medidas?: { alto: number; ancho: number; unidad: string };
  sinCliente: boolean;
  whatsappEnviado: boolean;
  createdAt: string;
}

interface WhatsAppPayload { numero: string; mensaje: string; link: string; }

// ─── Menú contextual del archivo ─────────────────────────────────────────────
function MenuContextualArchivo({
  trabajo, x, y, onClose,
}: { trabajo: Trabajo; x: number; y: number; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handle = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, [onClose]);

  const abrirEnExplorador = async () => {
    onClose();
    try {
      await api.post(`/produccion/${trabajo._id}/abrir-explorador`);
      toast.success('📂 Abriendo en explorador...');
    } catch {
      toast.error('No se pudo abrir el explorador (el archivo puede no tener ruta guardada)');
    }
  };

  return (
    <div
      ref={ref}
      className="fixed z-[999] bg-surface-2 border border-border rounded-xl shadow-2xl py-1 min-w-[200px] overflow-hidden"
      style={{ left: x, top: y }}
    >
      <button
        onClick={abrirEnExplorador}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-3 transition-colors text-left"
      >
        <FolderOpen className="w-4 h-4 text-primary" />
        Abrir ubicación en explorador
      </button>
      <button
        onClick={onClose}
        className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-surface-3 transition-colors text-left text-text-muted"
      >
        <X className="w-4 h-4" />
        Cerrar
      </button>
    </div>
  );
}

// ─── Vista previa de imagen de archivo ───────────────────────────────────────
const IMAGE_EXTS = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

function VistaPreviewArchivo({ trabajo, onClose }: { trabajo: Trabajo; onClose: () => void }) {
  const ext = (trabajo.archivo.extension || trabajo.archivo.nombre.split('.').pop() || '').toLowerCase();
  const isImage = IMAGE_EXTS.includes(ext);
  const apiBase = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';
  // La ruta guardada en el servidor es una ruta absoluta de Windows — solo mostramos imagen si es servida
  const rutaServida = trabajo.archivo.ruta?.replace(/\\/g, '/') || '';

  return (
    <div className="fixed inset-0 z-[998] flex items-center justify-center p-4">
      <motion.div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
      />
      <motion.div
        className="relative w-full max-w-2xl bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <p className="font-semibold text-text text-sm font-mono">{trabajo.archivo.nombre}</p>
            {trabajo.archivo.ruta && (
              <p className="text-xs text-text-dim mt-0.5 truncate max-w-lg">{trabajo.archivo.ruta}</p>
            )}
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 flex flex-col items-center gap-4">
          {isImage && rutaServida ? (
            <img
              src={`${apiBase}/uploads/produccion/${encodeURIComponent(trabajo.archivo.nombre)}`}
              alt={trabajo.archivo.nombre}
              className="max-h-[60vh] max-w-full rounded-xl object-contain shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          ) : (
            <div className="flex flex-col items-center gap-3 py-8 text-text-muted">
              <Image className="w-16 h-16 opacity-20" />
              <p className="text-sm">Vista previa no disponible para .{ext || '?'}</p>
              <p className="text-xs text-text-dim">Solo se muestran imágenes PNG/JPG/SVG/GIF</p>
            </div>
          )}
          {trabajo.archivo.ruta && (
            <div className="w-full bg-surface-3 rounded-lg p-3">
              <p className="text-xs text-text-dim font-mono break-all">{trabajo.archivo.ruta}</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// ─── Modal Asignar Cliente importado de components ───

// ─── Dropdown cambio de estado ────────────────────────────────────────────────
function EstadoDropdown({ trabajo, onCambiado }: { trabajo: Trabajo; onCambiado: (estado: string, wa: WhatsAppPayload | null) => void }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const cambiar = async (nuevoEstado: string) => {
    setOpen(false);
    if (nuevoEstado === trabajo.estado) return;
    setLoading(true);
    try {
      const res = await api.patch(`/produccion/${trabajo._id}/estado`, { estado: nuevoEstado });
      onCambiado(nuevoEstado, res.data.whatsapp || null);
      toast.success(`Estado → ${ESTADO_CONFIG[nuevoEstado]?.label}`);
    } catch {
      toast.error('Error al cambiar estado');
    } finally {
      setLoading(false);
    }
  };

  const cfg = ESTADO_CONFIG[trabajo.estado] || ESTADO_CONFIG.pendiente;
  const Icon = cfg.icon;

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((p) => !p)}
        disabled={loading}
        className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all hover:opacity-80"
        style={{ background: cfg.bg, borderColor: cfg.color + '50', color: cfg.color }}
      >
        {loading ? <div className="w-3 h-3 border border-current border-t-transparent rounded-full animate-spin" /> : <Icon className="w-3 h-3" />}
        {cfg.label}
        <ChevronDown className="w-2.5 h-2.5" />
      </button>
      <AnimatePresence>
        {open && (
          <>
            <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
            <motion.div
              className="absolute z-40 top-full mt-1 right-0 bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden min-w-[160px]"
              initial={{ opacity: 0, y: -8, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
            >
              {ESTADOS.map((e) => {
                const c = ESTADO_CONFIG[e];
                const EIcon = c.icon;
                return (
                  <button key={e} onClick={() => cambiar(e)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-xs transition-colors hover:bg-surface-3 ${e === trabajo.estado ? 'opacity-50 cursor-default' : ''}`}>
                    <div className="w-5 h-5 rounded-md flex items-center justify-center flex-shrink-0" style={{ background: c.bg }}>
                      <EIcon className="w-3 h-3" style={{ color: c.color }} />
                    </div>
                    <span className="font-medium" style={{ color: e === trabajo.estado ? c.color : 'var(--text)' }}>
                      {c.label}
                    </span>
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
export default function Produccion() {
  const navigate = useNavigate();
  const [trabajos, setTrabajos] = useState<Trabajo[]>([]);
  const [loading, setLoading] = useState(true);
  const [sinAsignar, setSinAsignar] = useState(0);
  const [filtros, setFiltros] = useState({ estado: '', sinCliente: 'false', search: '' });

  // WhatsApp
  const [waModal, setWaModal] = useState<{
    open: boolean; trabajoId: string; whatsapp: WhatsAppPayload | null;
    clienteNombre: string; archivoNombre: string; estadoNuevo: string;
  }>({ open: false, trabajoId: '', whatsapp: null, clienteNombre: '', archivoNombre: '', estadoNuevo: '' });

  // Modales
  const [trabajoAsignar, setTrabajoAsignar] = useState<Trabajo | null>(null);
  const [showNuevoTrabajo, setShowNuevoTrabajo] = useState(false);
  const [vistaPrevia, setVistaPrevia] = useState<Trabajo | null>(null);
  const [menuContextual, setMenuContextual] = useState<{ trabajo: Trabajo; x: number; y: number } | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (filtros.estado) params.estado = filtros.estado;
      if (filtros.sinCliente === 'true') params.sinCliente = 'true';
      const res = await api.get('/produccion', { params });
      let lista = res.data.trabajos as Trabajo[];
      if (filtros.search) {
        const q = filtros.search.toLowerCase();
        lista = lista.filter(
          (t) =>
            t.archivo.nombre.toLowerCase().includes(q) ||
            t.cliente?.nombre?.toLowerCase().includes(q) ||
            t.descripcion?.toLowerCase().includes(q)
        );
      }
      setTrabajos(lista);
      setSinAsignar(res.data.sinAsignar || 0);
    } catch { /**/ }
    finally { setLoading(false); }
  }, [filtros]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleEstadoCambiado = (trabajo: Trabajo, nuevoEstado: string, wa: WhatsAppPayload | null) => {
    setTrabajos((prev) => prev.map((t) => t._id === trabajo._id ? { ...t, estado: nuevoEstado } : t));
    if (wa && (nuevoEstado === 'terminado' || nuevoEstado === 'entregado')) {
      setWaModal({
        open: true,
        trabajoId: trabajo._id,
        whatsapp: wa,
        clienteNombre: trabajo.cliente?.nombre || '',
        archivoNombre: trabajo.descripcion || trabajo.archivo.nombre,
        estadoNuevo: nuevoEstado,
      });
    }
  };

  const handleWaAvisado = () => {
    setTrabajos((prev) =>
      prev.map((t) => t._id === waModal.trabajoId ? { ...t, whatsappEnviado: true } : t)
    );
  };

  return (
    <div className="space-y-5">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Producción</h2>
          <p className="page-subtitle">Gestión de trabajos en proceso</p>
        </div>
        <div className="flex gap-2">
          <Link to="/produccion/kanban" className="btn-outline">
            <Layers className="w-4 h-4" /> Ver Kanban
          </Link>
          <button onClick={() => setShowNuevoTrabajo(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo trabajo
          </button>
        </div>
      </div>

      {/* ── Banner sin asignar ── */}
      <AnimatePresence>
        {sinAsignar > 0 && (
          <motion.div
            className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-4"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
          >
            <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-yellow-300">
                {sinAsignar} {sinAsignar === 1 ? 'archivo sin cliente asignado' : 'archivos sin cliente asignado'}
              </p>
              <p className="text-xs text-yellow-400/70">Detectados automáticamente — asigna un cliente para procesarlos</p>
            </div>
            <button
              onClick={() => setFiltros((p) => ({ ...p, sinCliente: p.sinCliente === 'true' ? 'false' : 'true', estado: '' }))}
              className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all"
              style={{
                background: filtros.sinCliente === 'true' ? '#F59E0B' : '#F59E0B20',
                color: filtros.sinCliente === 'true' ? '#000' : '#F59E0B',
                border: '1px solid #F59E0B50',
              }}
            >
              {filtros.sinCliente === 'true' ? 'Mostrar todos' : 'Ver solo sin asignar'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Filtros ── */}
      <div className="card p-4 flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input
            value={filtros.search}
            onChange={(e) => setFiltros((p) => ({ ...p, search: e.target.value }))}
            placeholder="Buscar archivo, cliente..."
            className="input pl-10 w-full"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select
            value={filtros.estado}
            onChange={(e) => setFiltros((p) => ({ ...p, estado: e.target.value, sinCliente: 'false' }))}
            className="input w-auto"
          >
            <option value="">Todos los estados</option>
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{ESTADO_CONFIG[e]?.label}</option>
            ))}
          </select>
        </div>
        <button
          onClick={fetchData}
          className="btn-ghost p-2"
          title="Actualizar"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* ── Tabla ── */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Archivo / Descripción</th>
              <th>Cliente</th>
              <th>Máquina</th>
              <th>Medidas</th>
              <th>Valor</th>
              <th>Estado</th>
              <th>Prioridad</th>
              <th>WA</th>
              <th>Fecha</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j}><div className="shimmer-effect h-4 rounded w-20 bg-surface-3" /></td>
                    ))}
                  </tr>
                ))
              : trabajos.map((t, i) => (
                  <motion.tr
                    key={t._id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className={`cursor-pointer hover:bg-surface-3/40 transition-colors ${t.sinCliente ? 'bg-yellow-500/5' : ''}`}
                    onClick={() => navigate(`/produccion/${t._id}`)}
                  >
                    {/* Archivo */}
                    <td
                      onContextMenu={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setMenuContextual({ trabajo: t, x: e.clientX, y: e.clientY });
                      }}
                    >
                      <div className="flex items-center gap-2">
                        {t.sinCliente && (
                          <AlertTriangle className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs font-mono leading-tight truncate max-w-[180px]">
                            {t.descripcion || t.archivo.nombre}
                          </p>
                          {t.descripcion && (
                            <p className="text-[10px] text-text-dim font-mono truncate max-w-[180px]">{t.archivo.nombre}</p>
                          )}
                          {t.valorFormula && (
                            <p className="text-[9px] text-text-dim/60 font-mono mt-0.5">{t.valorFormula}</p>
                          )}
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); setVistaPrevia(t); }}
                          title="Vista previa / ruta del archivo"
                          className="flex-shrink-0 w-5 h-5 rounded flex items-center justify-center text-text-dim hover:text-primary hover:bg-primary/10 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                        </button>
                      </div>
                    </td>

                    {/* Cliente */}
                    <td>
                      {t.sinCliente ? (
                        <button
                          onClick={() => setTrabajoAsignar(t)}
                          className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border border-yellow-500/40 bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition-colors font-medium"
                        >
                          <User className="w-3 h-3" /> Asignar cliente
                        </button>
                      ) : (
                        <div>
                          <p className="font-medium text-sm">{t.cliente?.nombre || '—'}</p>
                          {t.cliente?.empresa && (
                            <p className="text-[10px] text-text-dim">{t.cliente.empresa}</p>
                          )}
                        </div>
                      )}
                    </td>

                    {/* Máquina */}
                    <td>
                      <span className="badge badge-muted text-[11px]">
                        {MAQUINA_LABEL[t.maquina] || t.maquina}
                      </span>
                    </td>

                    {/* Medidas */}
                    <td className="font-mono text-xs text-text-muted">
                      {t.medidas && t.medidas.alto > 0
                        ? `${t.medidas.alto}×${t.medidas.ancho} ${t.medidas.unidad}`
                        : '—'}
                    </td>

                    {/* Valor */}
                    <td>
                      <p className="font-bold text-success text-sm">{formatCOP(t.valor)}</p>
                      {t.cobrado && t.valorCobrado && (
                        <p className="text-[10px] text-text-dim">Cobrado: {formatCOP(t.valorCobrado)}</p>
                      )}
                    </td>

                    {/* Estado */}
                    <td>
                      <EstadoDropdown
                        trabajo={t}
                        onCambiado={(nuevoEstado, wa) => handleEstadoCambiado(t, nuevoEstado, wa)}
                      />
                    </td>

                    {/* Prioridad */}
                    <td>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full border"
                        style={{
                          color: PRIORIDAD_COLOR[t.prioridad],
                          borderColor: PRIORIDAD_COLOR[t.prioridad] + '50',
                          background: PRIORIDAD_COLOR[t.prioridad] + '15',
                        }}>
                        {t.prioridad}
                      </span>
                    </td>

                    {/* WhatsApp */}
                    <td>
                      {t.estado === 'terminado' && t.cliente?.telefono && (
                        <button
                          onClick={() => {
                            const nombre = t.cliente?.nombre || '';
                            const archivo = t.descripcion || t.archivo.nombre;
                            const numero = t.cliente?.telefono?.replace(/[\s\-().+]/g, '') || '';
                            const prefixed = numero.length === 10 ? `57${numero}` : numero;
                            const msg = `Hola ${nombre}, ¡te tenemos una buena noticia! 🎨\nTu trabajo *"${archivo}"* ya está listo para retirar en Publiart.\nPor favor avísanos cuándo puedes pasar. ¡Gracias! 😊`;
                            setWaModal({
                              open: true,
                              trabajoId: t._id,
                              whatsapp: { numero: prefixed, mensaje: msg, link: '' },
                              clienteNombre: nombre,
                              archivoNombre: archivo,
                              estadoNuevo: 'terminado',
                            });
                          }}
                          title="Notificar por WhatsApp"
                          className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${t.whatsappEnviado ? 'bg-[#25D366]/20 text-[#25D366]' : 'bg-surface-3 text-text-dim hover:bg-[#25D366]/20 hover:text-[#25D366]'}`}
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {t.whatsappEnviado && (
                        <div className="flex items-center gap-1 mt-0.5">
                          <Check className="w-2.5 h-2.5 text-[#25D366]" />
                          <span className="text-[9px] text-[#25D366]">Avisado</span>
                        </div>
                      )}
                    </td>

                    {/* Fecha */}
                    <td className="text-text-muted text-xs whitespace-nowrap">
                      {new Date(t.createdAt).toLocaleDateString('es-CO', { day: '2-digit', month: 'short' })}
                    </td>

                    {/* Ver detalle */}
                    <td onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => { e.stopPropagation(); navigate(`/produccion/${t._id}`); }}
                        className="flex items-center gap-1 text-xs text-text-dim hover:text-primary transition-colors px-2 py-1 rounded-lg hover:bg-primary/10"
                      >
                        <ExternalLink className="w-3 h-3" /> Ver
                      </button>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>

        {!loading && trabajos.length === 0 && (
          <div className="text-center py-14 text-text-muted">
            <Package className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p className="text-sm">
              {filtros.sinCliente === 'true'
                ? 'No hay archivos sin cliente asignado'
                : 'Sin trabajos. Agrega archivos a la carpeta de producción o crea uno manualmente.'}
            </p>
            <button onClick={() => setShowNuevoTrabajo(true)} className="btn-outline mt-4 text-sm">
              <Plus className="w-4 h-4" /> Crear trabajo manual
            </button>
          </div>
        )}
      </div>

      {/* ── Modales ── */}
      <AnimatePresence>
        {trabajoAsignar && (
          <AsignarClienteModal
            trabajo={trabajoAsignar}
            onClose={() => setTrabajoAsignar(null)}
            onAsignado={() => { fetchData(); setTrabajoAsignar(null); setSinAsignar((p) => Math.max(0, p - 1)); }}
          />
        )}
      </AnimatePresence>

      <WhatsAppModal
        isOpen={waModal.open}
        onClose={() => setWaModal((p) => ({ ...p, open: false }))}
        trabajoId={waModal.trabajoId}
        whatsapp={waModal.whatsapp}
        clienteNombre={waModal.clienteNombre}
        archivoNombre={waModal.archivoNombre}
        estadoNuevo={waModal.estadoNuevo}
        onAvisado={handleWaAvisado}
      />

      <NuevoTrabajoModal
        isOpen={showNuevoTrabajo}
        onClose={() => setShowNuevoTrabajo(false)}
        onCreado={fetchData}
      />

      {/* Vista previa del archivo */}
      <AnimatePresence>
        {vistaPrevia && (
          <VistaPreviewArchivo
            trabajo={vistaPrevia}
            onClose={() => setVistaPrevia(null)}
          />
        )}
      </AnimatePresence>

      {/* Menú contextual (click derecho en nombre del archivo) */}
      {menuContextual && (
        <MenuContextualArchivo
          trabajo={menuContextual.trabajo}
          x={menuContextual.x}
          y={menuContextual.y}
          onClose={() => setMenuContextual(null)}
        />
      )}
    </div>
  );
}
