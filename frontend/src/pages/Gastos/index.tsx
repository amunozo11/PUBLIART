import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Trash2, Edit2, Wallet, X, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';

const CATEGORIAS = ['Materiales', 'Maquinaria', 'Nómina', 'Servicios', 'Otros'];

export default function Gastos() {
  const [gastos, setGastos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    descripcion: '',
    monto: '',
    categoria: 'Materiales',
    fecha: new Date().toISOString().split('T')[0],
  });

  const fetchGastos = async () => {
    try {
      const res = await api.get('/gastos');
      setGastos(res.data.gastos);
    } catch (e: any) {
      toast.error('Error al cargar gastos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGastos();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.descripcion.trim()) return toast.error('Ingresa una descripción');
    if (!formData.monto || parseFloat(formData.monto) <= 0) return toast.error('Ingresa un monto válido');
    
    setSubmitting(true);
    try {
      await api.post('/gastos', {
        ...formData,
        monto: parseFloat(formData.monto),
      });
      toast.success('Gasto registrado exitosamente');
      setIsModalOpen(false);
      setFormData({
        descripcion: '',
        monto: '',
        categoria: 'Materiales',
        fecha: new Date().toISOString().split('T')[0],
      });
      fetchGastos();
    } catch (e: any) {
      toast.error('Error al guardar gasto');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('¿Seguro que deseas eliminar este gasto?')) return;
    try {
      await api.delete(`/gastos/${id}`);
      toast.success('Gasto eliminado');
      fetchGastos();
    } catch (e: any) {
      toast.error('Error al eliminar gasto');
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Gestión de Gastos</h2>
          <p className="page-subtitle">Control de egresos, pagos y materiales</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="btn-primary">
          <Plus className="w-4 h-4" /> Nuevo Gasto
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="card bg-primary/10 border border-primary/20 p-5">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-primary font-bold">Total Gastos (Mes)</h3>
            <Wallet className="w-6 h-6 text-primary" />
          </div>
          <p className="text-3xl font-mono font-bold">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(
              gastos.reduce((s, g) => s + g.monto, 0)
            )}
          </p>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th className="text-right">Monto</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="text-center p-8"><Loader2 className="w-6 h-6 animate-spin mx-auto text-primary" /></td></tr>
            ) : gastos.length === 0 ? (
              <tr><td colSpan={5} className="text-center p-8 text-text-muted">No hay gastos registrados.</td></tr>
            ) : (
              gastos.map((gasto, i) => (
                <motion.tr key={gasto._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="text-text-muted text-sm">{new Date(gasto.fecha).toLocaleDateString('es-CO')}</td>
                  <td className="font-medium">{gasto.descripcion}</td>
                  <td><span className="badge-info text-xs">{gasto.categoria}</span></td>
                  <td className="text-right font-mono font-bold text-error">
                    - {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(gasto.monto)}
                  </td>
                  <td className="text-right">
                    <button onClick={() => handleDelete(gasto._id)} className="text-error/70 hover:text-error p-2 rounded-lg hover:bg-error/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-surface border border-border rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
            >
              <div className="flex justify-between items-center p-5 border-b border-border bg-surface-2">
                <h3 className="font-bold text-lg">Registrar Nuevo Gasto</h3>
                <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="label">Descripción</label>
                  <input
                    value={formData.descripcion}
                    onChange={(e) => setFormData({ ...formData, descripcion: e.target.value })}
                    placeholder="Ej: Compra de tintas CMYK, Pago nómina Carlos..."
                    className="input w-full"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="label">Monto (COP)</label>
                  <input
                    type="number"
                    min="0"
                    value={formData.monto}
                    onChange={(e) => setFormData({ ...formData, monto: e.target.value })}
                    placeholder="0"
                    className="input w-full font-mono text-xl"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label">Categoría</label>
                    <select
                      value={formData.categoria}
                      onChange={(e) => setFormData({ ...formData, categoria: e.target.value })}
                      className="input w-full"
                    >
                      {CATEGORIAS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label">Fecha</label>
                    <input
                      type="date"
                      value={formData.fecha}
                      onChange={(e) => setFormData({ ...formData, fecha: e.target.value })}
                      className="input w-full"
                    />
                  </div>
                </div>
                <div className="pt-4 flex justify-end gap-3 border-t border-border mt-4">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="btn-ghost">Cancelar</button>
                  <button type="submit" disabled={submitting} className="btn-primary">
                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Guardar Gasto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
