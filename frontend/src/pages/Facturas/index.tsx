import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Receipt, Plus, DollarSign } from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../lib/api';

const ESTADO_BADGE: Record<string, string> = {
  pendiente: 'badge-warning',
  parcial: 'badge-info',
  pagada: 'badge-success',
  cancelada: 'badge-error',
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

export default function Facturas() {
  const navigate = useNavigate();
  const [facturas, setFacturas] = useState<Array<{_id: string; numero: number; cliente: {nombre: string}; total: number; saldoPendiente: number; estado: string; createdAt: string}>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/facturas').then((r) => { setFacturas(r.data.facturas); setLoading(false); });
  }, []);

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Facturación</h2>
          <p className="page-subtitle">Historial de facturas y pagos</p>
        </div>
        <Link to="/cotizaciones" className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva factura
        </Link>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Total</th>
              <th>Saldo</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => <tr key={i}>{Array.from({length: 6}).map((_,j) => <td key={j}><div className="shimmer-effect h-4 rounded w-20 bg-surface-3"/></td>)}</tr>)
              : facturas.map((f, i) => (
                  <motion.tr key={f._id} onClick={() => navigate(`/facturas/${f._id}`)} className="cursor-pointer hover:bg-surface-2 transition-colors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td><span className="font-mono text-primary font-bold">FAC-{String(f.numero).padStart(4,'0')}</span></td>
                    <td className="font-medium">{f.cliente?.nombre}</td>
                    <td className="font-bold text-success">{formatCOP(f.total)}</td>
                    <td className={f.saldoPendiente > 0 ? 'text-warning font-mono' : 'text-success font-mono'}>
                      {formatCOP(f.saldoPendiente)}
                    </td>
                    <td><span className={ESTADO_BADGE[f.estado] || 'badge-muted'}>{f.estado}</span></td>
                    <td className="text-text-muted text-xs">{new Date(f.createdAt).toLocaleDateString('es-CO')}</td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
        {!loading && facturas.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>Sin facturas registradas. Convierte una cotización en factura.</p>
          </div>
        )}
      </div>
    </div>
  );
}
