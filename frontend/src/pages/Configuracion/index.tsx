import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Settings, Save, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import api from '../../lib/api';
import toast from 'react-hot-toast';

export default function Configuracion() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { register, handleSubmit, reset } = useForm();

  useEffect(() => {
    api.get('/configuracion').then((r) => {
      reset(r.data.configuracion);
      setLoading(false);
    });
  }, []);

  const onSubmit = async (data: Record<string, unknown>) => {
    setSaving(true);
    try {
      await api.put('/configuracion', data);
      toast.success('Configuración guardada');
    } catch { toast.error('Error al guardar'); }
    finally { setSaving(false); }
  };

  if (loading) return <div className="card"><div className="shimmer-effect h-64 rounded bg-surface-3" /></div>;

  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Configuración</h2>
          <p className="page-subtitle">Precios, fórmulas y datos de empresa</p>
        </div>
        <button onClick={handleSubmit(onSubmit)} disabled={saving} className="btn-primary">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Guardar cambios
        </button>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Precios */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
          <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
            <Settings className="w-4 h-4 text-primary" /> Precios por metro cuadrado
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {['vinilo','banner','corte','laminado','laser','instalacion'].map((k) => (
              <div key={k}>
                <label className="label">{k.charAt(0).toUpperCase() + k.slice(1)}</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">$</span>
                  <input type="number" step="0.01" {...register(`precios.${k}`)} className="input pl-8" />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Fórmulas */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <h3 className="text-sm font-semibold text-text mb-2">Fórmulas de Cálculo</h3>
          <p className="text-xs text-text-muted mb-4">Variables disponibles: <code className="text-primary bg-surface-4 px-1 rounded">alto</code>, <code className="text-primary bg-surface-4 px-1 rounded">ancho</code>, <code className="text-primary bg-surface-4 px-1 rounded">precio</code>, <code className="text-primary bg-surface-4 px-1 rounded">material</code>, <code className="text-primary bg-surface-4 px-1 rounded">tiempo</code></p>
          <div className="space-y-3">
            {['vinilo','banner','corte','laminado','laser'].map((k) => (
              <div key={k} className="flex items-center gap-3">
                <label className="label w-20 flex-shrink-0 capitalize">{k}:</label>
                <input {...register(`formulas.${k}`)} className="input font-mono text-sm text-primary" placeholder={`alto * ancho * precio`} />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Empresa */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="text-sm font-semibold text-text mb-4">Datos de la Empresa</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { field: 'empresa.nombre', label: 'Nombre' },
              { field: 'empresa.nit', label: 'NIT' },
              { field: 'empresa.telefono', label: 'Teléfono' },
              { field: 'empresa.correo', label: 'Correo' },
              { field: 'empresa.direccion', label: 'Dirección' },
              { field: 'empresa.ciudad', label: 'Ciudad' },
            ].map(({ field, label }) => (
              <div key={field}>
                <label className="label">{label}</label>
                <input {...register(field)} className="input" />
              </div>
            ))}
          </div>
        </motion.div>

        {/* Impuesto */}
        <motion.div className="card" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-center gap-4">
            <label className="label w-32 flex-shrink-0">IVA por defecto:</label>
            <div className="flex items-center gap-2">
              <input type="number" {...register('impuesto')} className="input w-24" min="0" max="100" />
              <span className="text-text-muted">%</span>
            </div>
          </div>
        </motion.div>
      </form>
    </div>
  );
}
