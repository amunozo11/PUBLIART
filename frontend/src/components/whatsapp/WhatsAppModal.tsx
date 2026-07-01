import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Check, Send, ExternalLink, Phone } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface WhatsAppPayload {
  numero: string;
  mensaje: string;
  link: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  trabajoId: string;
  whatsapp: WhatsAppPayload | null;
  clienteNombre: string;
  archivoNombre: string;
  estadoNuevo: string;
  onAvisado?: () => void;
}

export default function WhatsAppModal({
  isOpen, onClose, trabajoId, whatsapp, clienteNombre, archivoNombre, estadoNuevo, onAvisado,
}: Props) {
  const [mensajeEditado, setMensajeEditado] = useState('');
  const [enviado, setEnviado] = useState(false);
  const [markingDone, setMarkingDone] = useState(false);

  useEffect(() => {
    if (whatsapp) {
      setMensajeEditado(whatsapp.mensaje);
      setEnviado(false);
    }
  }, [whatsapp]);

  if (!whatsapp) return null;

  const linkFinal = `https://wa.me/${whatsapp.numero}?text=${encodeURIComponent(mensajeEditado)}`;

  const abrirWhatsApp = () => {
    window.open(linkFinal, '_blank');
    setEnviado(true);
  };

  const marcarAvisado = async () => {
    setMarkingDone(true);
    try {
      await api.patch(`/produccion/${trabajoId}/whatsapp`);
      toast.success('✅ Marcado como avisado');
      onAvisado?.();
      onClose();
    } catch {
      toast.error('Error al marcar como avisado');
    } finally {
      setMarkingDone(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="relative w-full max-w-lg bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-border bg-gradient-to-r from-[#25D36620] to-transparent">
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 flex items-center justify-center flex-shrink-0">
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text text-base">
                  {estadoNuevo === 'terminado' ? '🎉 Trabajo Terminado' : '📦 Trabajo Entregado'}
                </h3>
                <p className="text-xs text-text-muted">Notificar al cliente por WhatsApp</p>
              </div>
              <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4">
              {/* Info */}
              <div className="flex items-center gap-3 bg-surface-3 rounded-xl p-3">
                <Phone className="w-4 h-4 text-[#25D366] flex-shrink-0" />
                <div>
                  <p className="text-xs text-text-dim">Enviando a</p>
                  <p className="text-sm font-medium text-text">{clienteNombre}</p>
                  <p className="text-xs text-text-muted font-mono">+{whatsapp.numero}</p>
                </div>
              </div>

              {/* Archivo */}
              <div className="bg-surface-3 rounded-xl p-3">
                <p className="text-xs text-text-dim mb-1">Trabajo</p>
                <p className="text-sm font-mono text-text truncate">{archivoNombre}</p>
              </div>

              {/* Mensaje editable */}
              <div>
                <p className="text-xs text-text-dim mb-2 flex items-center gap-1.5">
                  <MessageCircle className="w-3 h-3" />
                  Mensaje (puedes editarlo)
                </p>
                <textarea
                  value={mensajeEditado}
                  onChange={(e) => setMensajeEditado(e.target.value)}
                  rows={5}
                  className="input w-full resize-none text-sm font-mono"
                  style={{ fontFamily: 'monospace' }}
                />
                <p className="text-[10px] text-text-dim mt-1">{mensajeEditado.length} caracteres</p>
              </div>

              {enviado && (
                <motion.div
                  className="flex items-center gap-2 bg-[#25D366]/10 border border-[#25D366]/30 rounded-lg p-3 text-sm text-[#25D366]"
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Check className="w-4 h-4 flex-shrink-0" />
                  WhatsApp abierto — ¿ya enviaste el mensaje?
                </motion.div>
              )}
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 pt-0">
              <button
                onClick={abrirWhatsApp}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all"
                style={{
                  background: 'linear-gradient(135deg, #25D366, #128C7E)',
                  color: '#fff',
                }}
              >
                <ExternalLink className="w-4 h-4" />
                Abrir WhatsApp
              </button>

              {enviado && (
                <button
                  onClick={marcarAvisado}
                  disabled={markingDone}
                  className="flex-1 flex items-center justify-center gap-2 btn-primary py-2.5 px-4 rounded-xl font-semibold text-sm"
                >
                  {markingDone ? (
                    <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Marcar como avisado
                </button>
              )}

              {!enviado && (
                <button onClick={onClose} className="btn-ghost py-2.5 px-4 rounded-xl text-sm">
                  Después
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
