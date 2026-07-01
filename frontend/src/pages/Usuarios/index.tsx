import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Shield, Pencil, Power } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';
import NuevoUsuarioModal from './NuevoUsuarioModal';

const ROL_BADGE: Record<string, string> = {
  admin: 'badge-error',
  diseñador: 'badge-info',
  produccion: 'badge-warning',
  ventas: 'badge-success',
};

export default function Usuarios() {
  const [usuarios, setUsuarios] = useState<Array<Record<string,unknown>>>([]);
  const [loading, setLoading] = useState(true);
  const [showNuevo, setShowNuevo] = useState(false);
  const { user: me } = useAuthStore();

  const fetchData = async () => {
    api.get('/usuarios').then((r) => { setUsuarios(r.data.usuarios); setLoading(false); });
  };

  useEffect(() => { fetchData(); }, []);

  const toggleActivo = async (id: string, activo: boolean) => {
    try {
      await api.put(`/usuarios/${id}`, { activo: !activo });
      toast.success(`Usuario ${activo ? 'desactivado' : 'activado'}`);
      fetchData();
    } catch { toast.error('Error'); }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Usuarios</h2>
          <p className="page-subtitle">Gestión de accesos y roles</p>
        </div>
        {me?.rol === 'admin' && (
          <button onClick={() => setShowNuevo(true)} className="btn-primary">
            <Plus className="w-4 h-4" /> Nuevo usuario
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading
          ? Array.from({length:3}).map((_,i) => <div key={i} className="card h-36"><div className="shimmer-effect h-full rounded bg-surface-3"/></div>)
          : usuarios.map((u: Record<string,unknown>, i) => (
              <motion.div
                key={u._id as string}
                className="card hover:border-border-light"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.07 }}
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold flex-shrink-0 ${u.activo ? 'bg-primary/15 text-primary' : 'bg-surface-4 text-text-muted'}`}>
                    {(u.nombre as string).charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-text truncate">{u.nombre as string}</p>
                      {!u.activo && <span className="badge-error badge">inactivo</span>}
                    </div>
                    <p className="text-xs text-text-muted truncate">{u.email as string}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={ROL_BADGE[u.rol as string] || 'badge-muted'}>
                        <Shield className="w-3 h-3 mr-1" />{u.rol as string}
                      </span>
                    </div>
                  </div>
                </div>
                {me?.rol === 'admin' && (u._id as string) !== me._id && (
                  <div className="flex gap-2 mt-4 pt-3 border-t border-border">
                    <button className="btn-ghost text-xs flex-1"><Pencil className="w-3.5 h-3.5" /> Editar</button>
                    <button onClick={() => toggleActivo(u._id as string, u.activo as boolean)} className={`btn-ghost text-xs flex-1 ${u.activo ? 'text-error hover:text-error' : 'text-success hover:text-success'}`}>
                      <Power className="w-3.5 h-3.5" /> {u.activo ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
      </div>

      <NuevoUsuarioModal 
        isOpen={showNuevo} 
        onClose={() => setShowNuevo(false)} 
        onCreado={fetchData} 
      />
    </div>
  );
}
