import { create } from 'zustand';

interface Notificacion {
  _id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  createdAt: string;
  leida?: boolean;
}

interface NotifState {
  notificaciones: Notificacion[];
  unreadCount: number;
  setNotificaciones: (n: Notificacion[]) => void;
  addNotificacion: (n: Notificacion) => void;
  marcarLeida: (id: string) => void;
}

export const useNotifStore = create<NotifState>((set) => ({
  notificaciones: [],
  unreadCount: 0,
  setNotificaciones: (n) =>
    set({ notificaciones: n, unreadCount: n.filter((x) => !x.leida).length }),
  addNotificacion: (n) =>
    set((s) => ({
      notificaciones: [n, ...s.notificaciones],
      unreadCount: s.unreadCount + 1,
    })),
  marcarLeida: (id) =>
    set((s) => ({
      notificaciones: s.notificaciones.map((n) => n._id === id ? { ...n, leida: true } : n),
      unreadCount: Math.max(0, s.unreadCount - 1),
    })),
}));
