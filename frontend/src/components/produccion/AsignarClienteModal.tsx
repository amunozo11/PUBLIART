import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, Search, User, Check } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Trabajo {
  _id: string;
  archivo: { nombre: string; };
  descripcion?: string;
}

export default function AsignarClienteModal({
  trabajo, onClose, onAsignado,
}: { trabajo: Trabajo; onClose: () => void; onAsignado: () => void }) {
  const [search, setSearch] = useState('');
  const [clientes, setClientes] = useState<{ _id: string; nombre: string; empresa?: string }[]>([]);
  const [seleccionado, setSeleccionado] = useState<{ id: string; nombre: string } | null>(null);
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [tab, setTab] = useState<'existente' | 'nuevo'>('existente');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!search) return;
    const t = setTimeout(async () => {
      try {
        const res = await api.get('/clientes', { params: { search, limit: 8 } });
        setClientes(res.data.clientes);
      } catch { /**/ }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const handleAsignar = async () => {
    const body = tab === 'existente'
      ? { clienteId: seleccionado?.id }
      : { clienteNombre: nuevoNombre.trim() };

    if (tab === 'existente' && !seleccionado) return toast.error('Selecciona un cliente');
    if (tab === 'nuevo' && !nuevoNombre.trim()) return toast.error('Ingresa el nombre del cliente');

    setSaving(true);
    try {
      await api.patch(`/produccion/${trabajo._id}/cliente`, body);
      toast.success('✅ Cliente asignado correctamente');
      onAsignado();
      onClose();
    } catch {
      toast.error('Error al asignar cliente');
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
        className="relative w-full max-w-md bg-surface-2 rounded-2xl border border-border shadow-2xl"
        initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
      >
        <div className="p-5 border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-text">Asignar Cliente</h3>
              <p className="text-xs text-text-dim mt-0.5 font-mono truncate max-w-xs">{trabajo.archivo?.nombre || trabajo.descripcion}</p>
            </div>
            <button onClick={onClose} className="text-text-dim hover:text-text"><X className="w-5 h-5" /></button>
          </div>
          {/* Tabs */}
          <div className="flex gap-1 mt-4 bg-surface-3 rounded-lg p-1">
            {(['existente', 'nuevo'] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tab === t ? 'bg-primary text-dark' : 'text-text-muted hover:text-text'}`}>
                {t === 'existente' ? 'Cliente existente' : 'Crear nuevo cliente'}
              </button>
            ))}
          </div>
        </div>

        <div className="p-5">
          {tab === 'existente' ? (
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input value={search} onChange={(e) => { setSearch(e.target.value); setSeleccionado(null); }}
                  placeholder="Buscar cliente por nombre..." className="input pl-10 w-full" />
              </div>
              {clientes.length > 0 && (
                <div className="rounded-xl border border-border overflow-hidden max-h-48 overflow-y-auto">
                  {clientes.map((c) => (
                    <button key={c._id} onClick={() => setSeleccionado({ id: c._id, nombre: c.nombre })}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${seleccionado?.id === c._id ? 'bg-primary/15 border-l-2 border-primary' : 'hover:bg-surface-3'}`}>
                      <div className="w-7 h-7 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                        <User className="w-3.5 h-3.5 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-text">{c.nombre}</p>
                        {c.empresa && <p className="text-xs text-text-dim">{c.empresa}</p>}
                      </div>
                      {seleccionado?.id === c._id && <Check className="w-4 h-4 text-primary ml-auto" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Nombre del cliente</label>
              <input value={nuevoNombre} onChange={(e) => setNuevoNombre(e.target.value)}
                placeholder="Nombre completo del cliente" className="input w-full"
                onKeyDown={(e) => { if (e.key === 'Enter') handleAsignar(); }} />
              <p className="text-xs text-text-dim mt-2">Se creará automáticamente como cliente potencial.</p>
            </div>
          )}
        </div>

        <div className="flex gap-3 p-5 pt-0">
          <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
          <button onClick={handleAsignar} disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
            {saving ? <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /> : <User className="w-4 h-4" />}
            Asignar
          </button>
        </div>
      </motion.div>
    </div>
  );
}
