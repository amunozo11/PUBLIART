import { motion, AnimatePresence } from 'framer-motion';
import { X, Clock, Database, Globe, User, Fingerprint } from 'lucide-react';

interface Props {
  registro: Record<string, any> | null;
  onClose: () => void;
}

export default function AuditoriaDetalleModal({ registro, onClose }: Props) {
  if (!registro) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
        />
        <motion.div
          className="relative w-full max-w-2xl max-h-[90vh] bg-surface-2 rounded-2xl border border-border shadow-2xl flex flex-col"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
        >
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-text text-base">Detalle del Registro</h3>
                <p className="text-xs text-text-muted">ID: {registro._id}</p>
              </div>
            </div>
            <button onClick={onClose} className="text-text-dim hover:text-text">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-5 overflow-y-auto space-y-6 flex-1 custom-scrollbar">
            {/* Header Info */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="card p-3 bg-surface-3">
                <p className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><User className="w-3.5 h-3.5" /> Usuario</p>
                <p className="text-sm font-semibold text-text truncate">{registro.usuario?.nombre || 'Sistema'}</p>
              </div>
              <div className="card p-3 bg-surface-3">
                <p className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Activity className="w-3.5 h-3.5" /> Acción</p>
                <p className="text-sm font-semibold text-text">{registro.accion}</p>
              </div>
              <div className="card p-3 bg-surface-3">
                <p className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Database className="w-3.5 h-3.5" /> Módulo</p>
                <p className="text-sm font-semibold text-text">{registro.modulo}</p>
              </div>
              <div className="card p-3 bg-surface-3">
                <p className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5" /> Fecha</p>
                <p className="text-sm font-semibold text-text">{new Date(registro.createdAt).toLocaleString('es-CO')}</p>
              </div>
            </div>

            {/* Metadatos */}
            <div>
              <h4 className="text-sm font-medium text-text mb-3 border-b border-border pb-2">Metadatos de conexión</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {registro.ip && (
                  <div className="bg-surface-3 rounded-lg p-3">
                    <p className="text-xs text-text-dim mb-1">Dirección IP</p>
                    <p className="text-sm font-mono text-text">{registro.ip}</p>
                  </div>
                )}
                {registro.entidadId && (
                  <div className="bg-surface-3 rounded-lg p-3">
                    <p className="text-xs text-text-dim mb-1">ID Entidad Afectada</p>
                    <p className="text-sm font-mono text-text">{registro.entidadId}</p>
                  </div>
                )}
                {registro.duracionMs !== undefined && (
                  <div className="bg-surface-3 rounded-lg p-3">
                    <p className="text-xs text-text-dim mb-1">Tiempo de Respuesta</p>
                    <p className="text-sm font-mono text-text">{registro.duracionMs} ms</p>
                  </div>
                )}
              </div>
              {registro.userAgent && (
                <div className="bg-surface-3 rounded-lg p-3 mt-4">
                  <p className="text-xs text-text-dim mb-1 flex items-center gap-1.5"><Globe className="w-3.5 h-3.5" /> User Agent</p>
                  <p className="text-xs font-mono text-text-muted break-all">{registro.userAgent}</p>
                </div>
              )}
            </div>

            {/* Payload (datos) */}
            {registro.datos && Object.keys(registro.datos).length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-text mb-3 border-b border-border pb-2">Datos Modificados / Payload</h4>
                <div className="bg-[#0D0D0D] rounded-xl border border-border p-4 overflow-x-auto">
                  <pre className="text-xs font-mono text-primary/90">
                    {JSON.stringify(registro.datos, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

// Necesario importar Activity
import { Activity } from 'lucide-react';
