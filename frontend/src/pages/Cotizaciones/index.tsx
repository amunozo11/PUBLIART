import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, FileText, Send, Copy, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Cotizacion {
  _id: string;
  numero: number;
  cliente: { nombre: string; empresa?: string };
  total: number;
  estado: string;
  createdAt: string;
  items: unknown[];
}

const ESTADO_BADGE: Record<string, string> = {
  borrador: 'badge-muted',
  enviada: 'badge-info',
  aprobada: 'badge-success',
  rechazada: 'badge-error',
  convertida: 'badge-primary',
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

export default function Cotizaciones() {
  const [cotizaciones, setCotizaciones] = useState<Cotizacion[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/cotizaciones');
      setCotizaciones(res.data.cotizaciones);
    } catch { /**/ }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const duplicar = async (id: string) => {
    try {
      await api.post(`/cotizaciones/${id}/duplicar`);
      toast.success('Cotización duplicada');
      fetchData();
    } catch { toast.error('Error al duplicar'); }
  };

  const convertir = async (id: string) => {
    try {
      await api.post(`/cotizaciones/${id}/convertir`);
      toast.success('Convertida a factura ✓');
      fetchData();
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Error');
    }
  };

  return (
    <div className="space-y-5">
      <div className="page-header">
        <div>
          <h2 className="page-title">Cotizaciones</h2>
          <p className="page-subtitle">Gestión de presupuestos y propuestas</p>
        </div>
        <Link to="/cotizaciones/nueva" className="btn-primary">
          <Plus className="w-4 h-4" /> Nueva cotización
        </Link>
      </div>

      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>N°</th>
              <th>Cliente</th>
              <th>Items</th>
              <th>Total</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 7 }).map((_, j) => (<td key={j}><div className="shimmer-effect h-4 rounded w-20 bg-surface-3" /></td>))}</tr>
                ))
              : cotizaciones.map((c, i) => (
                  <motion.tr key={c._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td><span className="font-mono text-primary font-bold">COT-{String(c.numero).padStart(4, '0')}</span></td>
                    <td>
                      <p className="font-medium">{c.cliente?.nombre}</p>
                      {c.cliente?.empresa && <p className="text-xs text-text-muted">{c.cliente.empresa}</p>}
                    </td>
                    <td className="text-text-muted">{c.items?.length || 0} items</td>
                    <td className="font-bold text-success">{formatCOP(c.total)}</td>
                    <td><span className={ESTADO_BADGE[c.estado] || 'badge-muted'}>{c.estado}</span></td>
                    <td className="text-text-muted text-xs">{new Date(c.createdAt).toLocaleDateString('es-CO')}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/cotizaciones/${c._id}`} className="btn-ghost p-1.5" title="Ver/Editar">
                          <FileText className="w-3.5 h-3.5" />
                        </Link>
                        <button onClick={() => duplicar(c._id)} className="btn-ghost p-1.5" title="Duplicar">
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        {c.estado !== 'convertida' && (
                          <button onClick={() => convertir(c._id)} className="btn-ghost p-1.5 text-success hover:text-success" title="Convertir a factura">
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <a
                          href={`https://wa.me/?text=Cotización COT-${String(c.numero).padStart(4,'0')} por ${formatCOP(c.total)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-ghost p-1.5 text-success"
                          title="WhatsApp"
                        >
                          <Send className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
        {!loading && cotizaciones.length === 0 && (
          <div className="text-center py-12 text-text-muted">
            <FileText className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No hay cotizaciones</p>
            <Link to="/cotizaciones/nueva" className="btn-primary mt-3 inline-flex">Crear primera</Link>
          </div>
        )}
      </div>
    </div>
  );
}
