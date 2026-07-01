import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth.store';
import AppLayout from '../components/layout/AppLayout';
import Login from '../pages/Auth/Login';
import Dashboard from '../pages/Dashboard';
import Clientes from '../pages/Clientes';
import ClienteDetalle from '../pages/Clientes/ClienteDetalle';
import Cotizaciones from '../pages/Cotizaciones';
import CotizacionForm from '../pages/Cotizaciones/CotizacionForm';
import Facturas from '../pages/Facturas';
import FacturaDetalle from '../pages/Facturas/FacturaDetalle';
import Produccion from '../pages/Produccion';
import KanbanBoard from '../pages/Produccion/KanbanBoard';
import TrabajoDetalle from '../pages/Produccion/TrabajoDetalle';
import Reportes from '../pages/Reportes';
import Configuracion from '../pages/Configuracion';
import Auditoria from '../pages/Auditoria';
import Usuarios from '../pages/Usuarios';

import Gastos from '../pages/Gastos';

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuthStore();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function AppRouter() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/"
        element={
          <RequireAuth>
            <AppLayout />
          </RequireAuth>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="clientes" element={<Clientes />} />
        <Route path="clientes/:id" element={<ClienteDetalle />} />
        <Route path="cotizaciones" element={<Cotizaciones />} />
        <Route path="cotizaciones/nueva" element={<CotizacionForm />} />
        <Route path="cotizaciones/:id" element={<CotizacionForm />} />
        <Route path="facturas" element={<Facturas />} />
        <Route path="facturas/:id" element={<FacturaDetalle />} />
        <Route path="produccion" element={<Produccion />} />
        <Route path="produccion/kanban" element={<KanbanBoard />} />
        <Route path="produccion/:id" element={<TrabajoDetalle />} />
        <Route path="gastos" element={<Gastos />} />
        <Route path="reportes" element={<Reportes />} />
        <Route path="configuracion" element={<Configuracion />} />
        <Route path="auditoria" element={<Auditoria />} />
        <Route path="usuarios" element={<Usuarios />} />
      </Route>
    </Routes>
  );
}
