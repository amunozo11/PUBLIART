import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, UserPlus, Check } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onCreado: () => void;
}

export default function NuevoUsuarioModal({ isOpen, onClose, onCreado }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    email: '',
    password: '',
    rol: 'ventas',
  });
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.nombre.trim() || !form.email.trim() || !form.password) {
      return toast.error('Llenar todos los campos');
    }

    setSaving(true);
    try {
      await api.post('/usuarios', form);
      toast.success('Usuario creado correctamente');
      onCreado();
      onClose();
      setForm({ nombre: '', email: '', password: '', rol: 'ventas' });
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Error al crear usuario');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-md bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="flex items-center gap-3 p-5 border-b border-border">
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
              <UserPlus className="w-5 h-5 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-text text-base">Nuevo Usuario</h3>
              <p className="text-xs text-text-muted">Crear un nuevo acceso al sistema</p>
            </div>
            <button onClick={onClose} className="text-text-dim hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Nombre completo</label>
              <input
                type="text"
                value={form.nombre}
                onChange={e => setForm({ ...form, nombre: e.target.value })}
                className="input w-full"
                placeholder="Ej: Juan Pérez"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-xs text-text-dim mb-1.5">Correo electrónico</label>
              <input
                type="email"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="input w-full"
                placeholder="correo@ejemplo.com"
              />
            </div>

            <div>
              <label className="block text-xs text-text-dim mb-1.5">Contraseña</label>
              <input
                type="password"
                value={form.password}
                onChange={e => setForm({ ...form, password: e.target.value })}
                className="input w-full"
                placeholder="Mínimo 6 caracteres"
                minLength={6}
              />
            </div>

            <div>
              <label className="block text-xs text-text-dim mb-1.5">Rol</label>
              <select
                value={form.rol}
                onChange={e => setForm({ ...form, rol: e.target.value })}
                className="input w-full"
              >
                <option value="admin">Administrador</option>
                <option value="diseñador">Diseñador</option>
                <option value="produccion">Producción / Máquina</option>
                <option value="ventas">Ventas</option>
              </select>
            </div>

            <div className="flex gap-3 mt-4 pt-4 border-t border-border">
              <button type="button" onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button type="submit" disabled={saving} className="btn-primary flex-1 flex items-center justify-center gap-2">
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check className="w-4 h-4" />
                )}
                Crear Usuario
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
