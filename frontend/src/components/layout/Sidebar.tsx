import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, FileText, Receipt, Cog, Activity,
  BarChart3, Settings, LogOut, Palette, Layers, X, ChevronRight,
  Shield, Printer
} from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import toast from 'react-hot-toast';

const navItems = [
  { path: '/dashboard',        icon: LayoutDashboard, label: 'Dashboard',      color: '#F5C400' },
  { path: '/clientes',         icon: Users,           label: 'Clientes',       color: '#3B82F6' },
  { path: '/cotizaciones',     icon: FileText,        label: 'Cotizaciones',   color: '#8B5CF6' },
  { path: '/facturas',         icon: Receipt,         label: 'Facturas',       color: '#22C55E' },
  { path: '/gastos',           icon: Cog,             label: 'Gastos',         color: '#EF4444' },
  { path: '/produccion/kanban',icon: Layers,          label: 'Kanban',         color: '#F59E0B' },
  { path: '/produccion',       icon: Printer,         label: 'Producción',     color: '#EF4444' },
  { path: '/reportes',         icon: BarChart3,       label: 'Reportes',       color: '#06B6D4' },
  { path: '/auditoria',        icon: Activity,        label: 'Auditoría',      color: '#6366F1' },
  { path: '/usuarios',         icon: Shield,          label: 'Usuarios',       color: '#EC4899' },
  { path: '/configuracion',    icon: Settings,        label: 'Configuración',  color: '#64748B' },
];

export default function Sidebar({ onClose }: { onClose: () => void }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  return (
    <aside className="h-screen w-64 bg-surface border-r border-border flex flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-primary flex items-center justify-center shadow-glow">
            <Palette className="w-5 h-5 text-dark" strokeWidth={2.5} />
          </div>
          <div>
            <span className="text-base font-bold text-white tracking-tight">PUBLIART</span>
            <p className="text-xs text-text-muted -mt-0.5">Studio ERP</p>
          </div>
        </div>
        <button onClick={onClose} className="text-text-dim hover:text-text p-1 rounded-lg hover:bg-surface-3 transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto no-scrollbar px-3 py-4 space-y-0.5">
        {navItems.map((item, i) => (
          <motion.div
            key={item.path}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04, type: 'spring', stiffness: 300 }}
          >
            <NavLink
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link group ${isActive ? 'active' : ''}`
              }
            >
              {({ isActive }) => (
                <>
                  <div
                    className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      background: isActive ? `${item.color}20` : 'transparent',
                    }}
                  >
                    <item.icon
                      className="w-4 h-4 transition-colors duration-200"
                      style={{ color: isActive ? item.color : '#8A8A8E' }}
                    />
                  </div>
                  <span className="flex-1 text-sm">{item.label}</span>
                  {isActive && (
                    <ChevronRight className="w-3 h-3 text-primary opacity-60" />
                  )}
                </>
              )}
            </NavLink>
          </motion.div>
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 p-2 rounded-xl hover:bg-surface-3 transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center flex-shrink-0">
            <span className="text-primary text-xs font-bold">
              {user?.nombre?.charAt(0).toUpperCase() || 'A'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-text truncate">{user?.nombre}</p>
            <p className="text-xs text-text-muted truncate capitalize">{user?.rol}</p>
          </div>
          <button onClick={handleLogout} className="text-text-dim hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
