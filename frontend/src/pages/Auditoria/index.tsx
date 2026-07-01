import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Activity, User, Clock, Search, Calendar as CalendarIcon, Filter } from 'lucide-react';
import api from '../../lib/api';
import AuditoriaDetalleModal from './AuditoriaDetalleModal';

export default function Auditoria() {
  const [registros, setRegistros] = useState<Array<Record<string,any>>>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedRegistro, setSelectedRegistro] = useState<Record<string,any> | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const r = await api.get(`/auditoria?${params.toString()}`);
      setRegistros(r.data.registros);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch initial or when filters change (with debounce for search)
  useEffect(() => {
    const t = setTimeout(() => {
      fetchData();
    }, 400);
    return () => clearTimeout(t);
  }, [search, startDate, endDate]);

  const ACCION_BADGE: Record<string, string> = {
    LOGIN: 'badge-info', LOGOUT: 'badge-muted',
    CREAR: 'badge-success', EDITAR: 'badge-warning', ELIMINAR: 'badge-error',
  };

  return (
    <div className="space-y-5 flex flex-col h-full">
      <div className="page-header">
        <div>
          <h2 className="page-title">Auditoría</h2>
          <p className="page-subtitle">Registro de todas las acciones del sistema</p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 items-end bg-surface-2 p-4 rounded-xl border border-border">
        <div className="flex-1 w-full">
          <label className="block text-xs font-medium text-text-dim mb-1.5 flex items-center gap-1.5"><Search className="w-3.5 h-3.5"/> Búsqueda</label>
          <input
            type="text"
            className="input w-full"
            placeholder="Buscar por módulo, acción, o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-text-dim mb-1.5 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> Desde</label>
          <input
            type="date"
            className="input w-full"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
          />
        </div>
        <div className="w-full md:w-48">
          <label className="block text-xs font-medium text-text-dim mb-1.5 flex items-center gap-1.5"><CalendarIcon className="w-3.5 h-3.5"/> Hasta</label>
          <input
            type="date"
            className="input w-full"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
          />
        </div>
        <div className="flex items-center">
          <button 
            className="btn-ghost text-xs h-10 px-4"
            onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); }}
          >
            Limpiar filtros
          </button>
        </div>
      </div>

      <div className="table-wrapper flex-1">
        <table className="table">
          <thead>
            <tr>
              <th>Usuario</th>
              <th>Acción</th>
              <th>Módulo</th>
              <th>IP</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && registros.length === 0
              ? Array.from({length:8}).map((_,i) => <tr key={i}>{Array.from({length:5}).map((_,j) => <td key={j}><div className="shimmer-effect h-4 rounded w-20 bg-surface-3"/></td>)}</tr>)
              : registros.map((r, i) => (
                  <motion.tr 
                    key={r._id} 
                    initial={{ opacity: 0 }} 
                    animate={{ opacity: 1 }} 
                    transition={{ delay: i * 0.02 }}
                    onClick={() => setSelectedRegistro(r)}
                    className="cursor-pointer hover:bg-surface-3 transition-colors"
                  >
                    <td>
                      <div className="flex items-center gap-2">
                        <User className="w-3.5 h-3.5 text-text-muted" />
                        <span className="text-sm font-medium">{r.usuario?.nombre || 'Sistema'}</span>
                      </div>
                    </td>
                    <td><span className={ACCION_BADGE[r.accion] || 'badge-muted'}>{r.accion}</span></td>
                    <td className="text-text-muted text-sm">{r.modulo}</td>
                    <td className="font-mono text-xs text-text-dim">{r.ip}</td>
                    <td>
                      <div className="flex items-center gap-1.5 text-xs text-text-muted">
                        <Clock className="w-3 h-3" />
                        {new Date(r.createdAt).toLocaleString('es-CO')}
                      </div>
                    </td>
                  </motion.tr>
                ))}
          </tbody>
        </table>
        {!loading && registros.length === 0 && (
          <div className="text-center py-16 text-text-muted">
            <Filter className="w-10 h-10 mx-auto mb-3 opacity-20" />
            <p>No se encontraron registros que coincidan con la búsqueda.</p>
          </div>
        )}
      </div>

      <AuditoriaDetalleModal 
        registro={selectedRegistro} 
        onClose={() => setSelectedRegistro(null)} 
      />
    </div>
  );
}
