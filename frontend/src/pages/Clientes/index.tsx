import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Search, User, Phone, Mail, Building2, Filter,
  MessageCircle, X, Check, DollarSign,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Cliente {
  _id: string;
  nombre: string;
  empresa?: string;
  telefono?: string;
  correo?: string;
  estado: string;
  ciudad?: string;
  createdAt: string;
}

const ESTADO_BADGE: Record<string, string> = {
  potencial: 'badge-muted',
  negociacion: 'badge-info',
  activo: 'badge-success',
  frecuente: 'badge-primary',
  inactivo: 'badge-error',
};

const ESTADOS = ['', 'potencial', 'negociacion', 'activo', 'frecuente', 'inactivo'];

const limpiarNumero = (tel: string): string => {
  let num = tel.replace(/[\s\-().+]/g, '');
  if (num.startsWith('0')) num = num.slice(1);
  if (num.length === 10 && !num.startsWith('57')) num = `57${num}`;
  return num;
};

// ─── Modal nuevo cliente ──────────────────────────────────────────────────────
function NuevoClienteModal({ onClose, onCreado }: { onClose: () => void; onCreado: () => void }) {
  const [form, setForm] = useState({
    nombre: '', empresa: '', telefono: '', correo: '',
    nit: '', ciudad: 'Valledupar', estado: 'potencial', observaciones: '',
  });
  const [saving, setSaving] = useState(false);

  const setField = (f: string, v: string) => setForm((p) => ({ ...p, [f]: v }));

  const handleSubmit = async () => {
    if (!form.nombre.trim()) return toast.error('El nombre es obligatorio');
    setSaving(true);
    try {
      await api.post('/clientes', form);
      toast.success('✅ Cliente creado');
      onCreado();
      onClose();
    } catch {
      toast.error('Error al crear cliente');
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
        className="relative w-full max-w-lg bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        transition={{ type: 'spring', damping: 20 }}
      >
        <div className="flex items-center gap-3 p-5 border-b border-border">
          <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
            <User className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-text">Nuevo Cliente</h3>
            <p className="text-xs text-text-muted">Registrar nuevo cliente en el sistema</p>
          </div>
          <button onClick={onClose} className="text-text-dim hover:text-text"><X className="w-5 h-5" /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-5 space-y-4">
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Nombre *</label>
            <input value={form.nombre} onChange={(e) => setField('nombre', e.target.value)}
              placeholder="Nombre completo" className="input w-full"
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Empresa</label>
              <input value={form.empresa} onChange={(e) => setField('empresa', e.target.value)}
                placeholder="Razón social" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1.5">NIT / CC</label>
              <input value={form.nit} onChange={(e) => setField('nit', e.target.value)}
                placeholder="000-000-0" className="input w-full" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Teléfono / WhatsApp</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
                <input value={form.telefono} onChange={(e) => setField('telefono', e.target.value)}
                  placeholder="310 000 0000" className="input pl-9 w-full" />
              </div>
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Correo</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-text-dim" />
                <input value={form.correo} onChange={(e) => setField('correo', e.target.value)}
                  placeholder="correo@ejemplo.com" className="input pl-9 w-full" type="email" />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Ciudad</label>
              <input value={form.ciudad} onChange={(e) => setField('ciudad', e.target.value)}
                placeholder="Bogotá" className="input w-full" />
            </div>
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Estado inicial</label>
              <select value={form.estado} onChange={(e) => setField('estado', e.target.value)} className="input w-full">
                {['potencial', 'negociacion', 'activo', 'frecuente'].map((e) => (
                  <option key={e} value={e}>{e.charAt(0).toUpperCase() + e.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-dim mb-1.5">Observaciones</label>
            <textarea value={form.observaciones} onChange={(e) => setField('observaciones', e.target.value)}
              placeholder="Notas internas sobre este cliente..." rows={3} className="input w-full resize-none" />
          </div>
        </div>

        <div className="flex gap-3 p-5 pt-3 border-t border-border">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleSubmit} disabled={saving}
            className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <Check className="w-4 h-4" />}
            Crear Cliente
          </button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function Clientes() {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [estado, setEstado] = useState('');
  const [total, setTotal] = useState(0);
  const [showNuevoCliente, setShowNuevoCliente] = useState(false);

  const fetchClientes = async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (estado) params.estado = estado;
      const res = await api.get('/clientes', { params });
      setClientes(res.data.clientes);
      setTotal(res.data.total);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchClientes(); }, [search, estado]);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Clientes</h2>
          <p className="page-subtitle">{total} clientes registrados</p>
        </div>
        <button onClick={() => setShowNuevoCliente(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo cliente
        </button>
      </div>

      {/* Filters */}
      <div className="card p-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nombre, empresa, correo..." className="input pl-10 w-full" />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-text-muted" />
          <select value={estado} onChange={(e) => setEstado(e.target.value)} className="input w-auto">
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e ? e.charAt(0).toUpperCase() + e.slice(1) : 'Todos los estados'}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Empresa</th>
              <th>Contacto</th>
              <th>Ciudad</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-center">WA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 8 }).map((_, j) => (
                      <td key={j}><div className="shimmer-effect h-4 rounded w-24 bg-surface-3" /></td>
                    ))}
                  </tr>
                ))
              : clientes.map((c, i) => (
                  <motion.tr key={c._id}
                    initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}>
                    <td>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                          <span className="text-primary text-xs font-bold">{c.nombre.charAt(0)}</span>
                        </div>
                        <span className="font-medium">{c.nombre}</span>
                      </div>
                    </td>
                    <td>
                      <div className="flex items-center gap-1.5 text-text-muted">
                        {c.empresa && <Building2 className="w-3.5 h-3.5" />}
                        {c.empresa || '—'}
                      </div>
                    </td>
                    <td>
                      <div className="space-y-0.5">
                        {c.telefono && (
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Phone className="w-3 h-3" />{c.telefono}
                          </div>
                        )}
                        {c.correo && (
                          <div className="flex items-center gap-1.5 text-xs text-text-muted">
                            <Mail className="w-3 h-3" />{c.correo}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="text-text-muted">{c.ciudad || '—'}</td>
                    <td>
                      <span className={ESTADO_BADGE[c.estado] || 'badge-muted'}>{c.estado}</span>
                    </td>
                    <td className="text-text-muted text-xs">
                      {new Date(c.createdAt).toLocaleDateString('es-CO')}
                    </td>
                    {/* WhatsApp rápido */}
                    <td className="text-center">
                      {c.telefono ? (
                        <a
                          href={`https://wa.me/${limpiarNumero(c.telefono)}?text=${encodeURIComponent(`Hola ${c.nombre}, te contactamos desde Publiart. `)}`}
                          target="_blank" rel="noopener noreferrer"
                          title={`WhatsApp a ${c.nombre}`}
                          className="inline-flex items-center justify-center w-7 h-7 rounded-lg transition-all bg-surface-3 text-text-dim hover:bg-[#25D366]/20 hover:text-[#25D366]">
                          <MessageCircle className="w-3.5 h-3.5" />
                        </a>
                      ) : (
                        <span className="text-text-dim text-xs">—</span>
                      )}
                    </td>
                    <td>
                      <Link to={`/clientes/${c._id}`} className="btn-ghost text-xs py-1 px-2">Ver</Link>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
        {!loading && clientes.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <User className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No se encontraron clientes</p>
            <button onClick={() => setShowNuevoCliente(true)} className="btn-outline mt-4 text-sm">
              <Plus className="w-4 h-4" /> Crear primer cliente
            </button>
          </div>
        )}
      </div>

      {/* Modal nuevo cliente */}
      <AnimatePresence>
        {showNuevoCliente && (
          <NuevoClienteModal
            onClose={() => setShowNuevoCliente(false)}
            onCreado={() => { fetchClientes(); setShowNuevoCliente(false); }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
