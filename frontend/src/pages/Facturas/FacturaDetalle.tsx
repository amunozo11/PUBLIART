import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { FileDown, ArrowLeft, Loader2, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';
export default function FacturaDetalle() {
  const { id } = useParams();
  const [factura, setFactura] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [generandoPDF, setGenerandoPDF] = useState(false);

  useEffect(() => {
    if (id) {
      api.get(`/facturas/${id}`)
        .then((res) => {
          setFactura(res.data.factura);
          setLoading(false);
        })
        .catch(() => {
          toast.error('Factura no encontrada');
          setLoading(false);
        });
    }
  }, [id]);

  const descargarPDF = async () => {
    setGenerandoPDF(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/facturas/${id}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (!response.ok) {
        let errMessage = 'Error al generar PDF';
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          errMessage = `Error ${response.status}`;
        }
        throw new Error(errMessage);
      }
      
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Factura-${id}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('📄 PDF descargado');
    } catch (e: any) {
      toast.error(e.message || 'Error al descargar PDF');
    } finally {
      setGenerandoPDF(false);
    }
  };

  const registrarPago = async () => {
    const saldo = factura.saldoPendiente || 0;
    if (saldo <= 0) return toast.error('Factura ya está pagada');
    
    const montoStr = window.prompt(`Saldo pendiente: ${new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(saldo)}\n\nIngrese el monto a pagar (solo números):`, saldo.toString());
    if (!montoStr) return;
    
    const monto = parseFloat(montoStr.replace(/\D/g, ''));
    if (isNaN(monto) || monto <= 0) return toast.error('Monto inválido');
    
    try {
      await api.post(`/facturas/${id}/pago`, {
        monto,
        metodo: 'efectivo',
      });
      toast.success('💰 Pago registrado exitosamente');
      const res = await api.get(`/facturas/${id}`);
      setFactura(res.data.factura);
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Error al registrar pago');
    }
  };

  if (loading) {
    return <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!factura) {
    return <div className="p-8 text-center text-text-muted">No se pudo cargar la factura.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center gap-4 mb-4">
        <Link to="/facturas" className="p-2 rounded-lg hover:bg-surface-3 transition-colors">
          <ArrowLeft className="w-5 h-5 text-text-muted" />
        </Link>
        <div className="flex-1">
          <h2 className="text-2xl font-bold">Factura N° {String(factura.numero).padStart(4, '0')}</h2>
          <p className="text-text-muted">Estado: <span className="uppercase font-bold">{factura.estado}</span></p>
        </div>
        <button onClick={descargarPDF} disabled={generandoPDF} className="btn-primary flex items-center gap-2">
          {generandoPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          Descargar PDF
        </button>
      </div>

      <div className="card p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Cliente</h3>
          <p className="font-medium text-lg">{factura.cliente?.nombre}</p>
          <p className="text-text-muted text-sm">NIT/CC: {factura.cliente?.nit || 'N/A'}</p>
          <p className="text-text-muted text-sm">Tel: {factura.cliente?.telefono || 'N/A'}</p>
        </div>
        <div className="md:text-right">
          <h3 className="text-sm font-bold text-text-muted mb-2 uppercase tracking-wider">Detalles de Facturación</h3>
          <p className="font-medium text-2xl text-success">
            {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(factura.total)}
          </p>
          <p className="text-text-muted text-sm">Emitida: {new Date(factura.createdAt).toLocaleDateString('es-CO')}</p>
          {factura.cotizacionBase && (
            <p className="text-text-muted text-sm mt-1">Ref Cotización: COT-{String(factura.cotizacionBase?.numero || '').padStart(4, '0')}</p>
          )}
          <div className="mt-4 p-4 bg-surface-2 rounded-lg inline-block text-left">
            <p className="text-sm font-bold text-text-muted mb-1 uppercase">Estado de Pago</p>
            <p className="font-mono text-lg">Pagado: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(factura.total - (factura.saldoPendiente || 0))}</p>
            <p className={`font-mono text-lg font-bold ${(factura.saldoPendiente || 0) > 0 ? 'text-warning' : 'text-success'}`}>
              Saldo: {new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(factura.saldoPendiente || 0)}
            </p>
            {(factura.saldoPendiente || 0) > 0 && (
              <button onClick={registrarPago} className="btn-primary w-full mt-3 flex justify-center items-center gap-2">
                <DollarSign className="w-4 h-4" />
                Registrar Pago
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tabla simplificada */}
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>
              <th>Cant.</th>
              <th>Descripción</th>
              <th className="text-right">Unitario</th>
              <th className="text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {factura.items?.map((item: any, i: number) => (
              <tr key={i}>
                <td className="text-center font-mono">{item.cantidad}</td>
                <td>{item.descripcion}</td>
                <td className="text-right font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.valorUnitario)}</td>
                <td className="text-right font-mono">{new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP' }).format(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
