import { useEffect, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import Sidebar from './Sidebar';
import Header from './Header';
import { io as socketIO } from 'socket.io-client';
import { useNotifStore } from '../../store/notif.store';
import toast from 'react-hot-toast';

const socket = socketIO(import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000', {
  autoConnect: false,
});

export default function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const addNotificacion = useNotifStore((s) => s.addNotificacion);

  useEffect(() => {
    socket.connect();

    socket.on('nuevo-trabajo', ({ trabajo }) => {
      addNotificacion({
        _id: Date.now().toString(),
        titulo: '📄 Nuevo trabajo detectado',
        mensaje: `${trabajo.archivo?.nombre} - ${trabajo.clienteNombre || 'Cliente'}`,
        tipo: 'info',
        createdAt: new Date().toISOString(),
      });
      toast.success(`Nuevo trabajo: ${trabajo.archivo?.nombre}`);
    });

    socket.on('estado-trabajo', ({ nuevoEstado }) => {
      addNotificacion({
        _id: Date.now().toString(),
        titulo: '🔄 Estado actualizado',
        mensaje: `Trabajo movido a: ${nuevoEstado}`,
        tipo: 'success',
        createdAt: new Date().toISOString(),
      });
    });

    return () => { socket.disconnect(); };
  }, []);

  return (
    <div className="flex h-screen bg-dark overflow-hidden bg-mesh">
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <motion.div
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex-shrink-0"
          >
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
