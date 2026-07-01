import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, Bell, Search, X, CheckCheck } from 'lucide-react';
import { useNotifStore } from '../../store/notif.store';
import { useLocation } from 'react-router-dom';

const pageTitles: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/clientes': 'Clientes',
  '/cotizaciones': 'Cotizaciones',
  '/facturas': 'Facturación',
  '/produccion': 'Producción',
  '/produccion/kanban': 'Kanban de Producción',
  '/reportes': 'Reportes',
  '/configuracion': 'Configuración',
  '/auditoria': 'Auditoría',
  '/usuarios': 'Usuarios',
};

const tipoBadge: Record<string, string> = {
  info: 'bg-info/15 text-info',
  success: 'bg-success/15 text-success',
  warning: 'bg-warning/15 text-warning',
  error: 'bg-error/15 text-error',
};

export default function Header({ onMenuClick }: { onMenuClick: () => void }) {
  const [notifOpen, setNotifOpen] = useState(false);
  const { notificaciones, unreadCount, marcarLeida } = useNotifStore();
  const location = useLocation();
  const notifRef = useRef<HTMLDivElement>(null);

  const title = pageTitles[location.pathname] || 'PUBLIART';

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-5 flex-shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="text-text-muted hover:text-text p-1.5 rounded-lg hover:bg-surface-3 transition-colors"
        >
          <Menu className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold text-text">{title}</h1>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        {/* Notificaciones */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setNotifOpen(!notifOpen)}
            className="relative p-2 text-text-muted hover:text-text rounded-lg hover:bg-surface-3 transition-colors"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-primary text-dark text-xs font-bold rounded-full flex items-center justify-center"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </motion.span>
            )}
          </button>

          <AnimatePresence>
            {notifOpen && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.95 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="absolute right-0 top-10 w-80 bg-surface-2 border border-border rounded-2xl shadow-card-hover z-50 overflow-hidden"
              >
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-text">Notificaciones</span>
                  <button onClick={() => setNotifOpen(false)}>
                    <X className="w-4 h-4 text-text-muted hover:text-text" />
                  </button>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificaciones.length === 0 ? (
                    <div className="p-6 text-center text-text-muted text-sm">
                      <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      Sin notificaciones
                    </div>
                  ) : (
                    notificaciones.slice(0, 10).map((n) => (
                      <motion.div
                        key={n._id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`px-4 py-3 border-b border-border last:border-0 cursor-pointer hover:bg-surface-3 transition-colors ${!n.leida ? 'bg-primary/5' : ''}`}
                        onClick={() => marcarLeida(n._id)}
                      >
                        <div className="flex items-start gap-3">
                          <span className={`badge ${tipoBadge[n.tipo]} flex-shrink-0 mt-0.5`}>
                            {n.tipo}
                          </span>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-text">{n.titulo}</p>
                            <p className="text-xs text-text-muted mt-0.5 truncate">{n.mensaje}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
