import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus, Trash2, Save, FileDown, Calculator, User,
  Ruler, DollarSign, Check, ChevronDown, Loader2,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../store/auth.store';

// ─── Tipos ────────────────────────────────────────────────────────────────────
interface Item {
  descripcion: string;
  cantidad: number;
  alto: number;
  ancho: number;
  material: string;
  valorUnitario: number;
  descuento: number;
  subtotal: number;
}

const itemVacio = (): Item => ({
  descripcion: '',
  cantidad: 1,
  alto: 0,
  ancho: 0,
  material: '',
  valorUnitario: 0,
  descuento: 0,
  subtotal: 0,
});

const formatCOP = (v: number): string =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v || 0);

const calcSubtotalItem = (item: Item): number => {
  const base = (item.cantidad || 0) * (item.valorUnitario || 0);
  return Math.round(base - base * ((item.descuento || 0) / 100));
};

// ─── Selector de cliente ──────────────────────────────────────────────────────
function ClienteSelector({
  value, onChange,
}: {
  value: string;
  onChange: (nombre: string, id?: string) => void;
}) {
  const [query, setQuery] = useState(value);
  const [sugerencias, setSugerencias] = useState<{ _id: string; nombre: string; empresa?: string; ciudad?: string }[]>([]);
  const [open, setOpen] = useState(false);
  const [seleccionado, setSeleccionado] = useState(false);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    if (seleccionado || query.length < 2) { setSugerencias([]); return; }
    const t = setTimeout(async () => {
      try {
        const r = await api.get('/clientes', { params: { search: query, limit: 8 } });
        setSugerencias(r.data.clientes || []);
        setOpen(true);
      } catch { /**/ }
    }, 250);
    return () => clearTimeout(t);
  }, [query, seleccionado]);

  return (
    <div className="relative">
      <div className="relative">
        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
        <input
          value={query}
          onChange={(e) => { setQuery(e.target.value); setSeleccionado(false); onChange(e.target.value); }}
          onFocus={() => { if (sugerencias.length > 0) setOpen(true); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          placeholder="Nombre del cliente..."
          className="input pl-10 w-full text-base"
        />
        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
      </div>
      <AnimatePresence>
        {open && sugerencias.length > 0 && (
          <motion.div
            className="absolute z-50 top-full mt-1 w-full bg-surface-2 border border-border rounded-xl shadow-2xl overflow-hidden"
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
          >
            {sugerencias.map((c) => (
              <button
                key={c._id}
                type="button"
                onMouseDown={() => {
                  setQuery(c.nombre);
                  setSeleccionado(true);
                  onChange(c.nombre, c._id);
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-3 hover:bg-surface-3 text-left transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-primary/15 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary text-sm font-bold">{c.nombre.charAt(0)}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-text">{c.nombre}</p>
                  {c.empresa && <p className="text-xs text-text-dim">{c.empresa}</p>}
                  {c.ciudad && <p className="text-xs text-text-dim">{c.ciudad}</p>}
                </div>
                <Check className="w-4 h-4 text-primary ml-auto opacity-0 group-hover:opacity-100" />
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Fila de ítem ──────────────────────────────────────────────────────────────
function ItemRow({
  item, index, onChange, onRemove,
}: {
  item: Item;
  index: number;
  onChange: (idx: number, field: keyof Item, value: string | number) => void;
  onRemove: (idx: number) => void;
}) {
  const [calculando, setCalculando] = useState(false);

  const calcularValorAuto = useCallback(async () => {
    if (!item.alto || !item.ancho) return;
    setCalculando(true);
    try {
      const tipo = item.material || 'vinilo';
      const r = await api.get('/produccion/calcular-valor', {
        params: { tipo, alto: item.alto, ancho: item.ancho, cantidad: item.cantidad },
      });
      if (r.data.valor > 0) {
        onChange(index, 'valorUnitario', r.data.valor);
        toast.success(`💰 Valor calculado: ${formatCOP(r.data.valor)} (${r.data.formula || ''})`);
      }
    } catch { /**/ } finally { setCalculando(false); }
  }, [item.alto, item.ancho, item.material, item.cantidad, index, onChange]);

  const subtotal = calcSubtotalItem(item);

  const nf = (val: number | string | undefined) => val === 0 || val === '0' ? '' : String(val || '');

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10, height: 0 }}
      className="rounded-xl border border-border bg-surface-3/50 overflow-hidden"
    >
      {/* Encabezado de fila */}
      <div className="flex items-center justify-between px-4 py-2 bg-surface-3 border-b border-border">
        <span className="text-xs font-bold text-text-muted">Ítem #{index + 1}</span>
        <button type="button" onClick={() => onRemove(index)}
          className="text-error/70 hover:text-error transition-colors p-1 rounded-lg hover:bg-error/10">
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="p-4 space-y-3">
        {/* Descripción */}
        <div>
          <label className="label">Descripción *</label>
          <input
            value={item.descripcion}
            onChange={(e) => onChange(index, 'descripcion', e.target.value)}
            placeholder="Ej: Banner impreso 100x200cm, Vinilo cor adhesivo..."
            className="input w-full"
          />
        </div>

        {/* Medidas + Material */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div>
            <label className="label flex items-center gap-1"><Ruler className="w-3 h-3" /> Alto (cm)</label>
            <input
              type="number" min="0" step="0.1"
              value={nf(item.alto)}
              onChange={(e) => onChange(index, 'alto', parseFloat(e.target.value) || 0)}
              onBlur={calcularValorAuto}
              placeholder="0"
              className="input w-full"
            />
          </div>
          <div>
            <label className="label flex items-center gap-1"><Ruler className="w-3 h-3" /> Ancho (cm)</label>
            <input
              type="number" min="0" step="0.1"
              value={nf(item.ancho)}
              onChange={(e) => onChange(index, 'ancho', parseFloat(e.target.value) || 0)}
              onBlur={calcularValorAuto}
              placeholder="0"
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Tipo/Material</label>
            <select
              value={item.material}
              onChange={(e) => onChange(index, 'material', e.target.value)}
              className="input w-full"
            >
              <option value="vinilo">Vinilo</option>
              <option value="banner">Banner</option>
              <option value="laser">Láser</option>
              <option value="dtf">DTF</option>
              <option value="corteSticker">Corte Sticker</option>
              <option value="laminado">Laminado</option>
              <option value="instalacion">Instalación</option>
            </select>
          </div>
          <div>
            <label className="label">Cantidad</label>
            <input
              type="number" min="1"
              value={item.cantidad}
              onChange={(e) => onChange(index, 'cantidad', parseInt(e.target.value) || 1)}
              className="input w-full"
            />
          </div>
        </div>

        {/* Valor + Descuento + Subtotal */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 items-end">
          <div>
            <label className="label flex items-center gap-1 justify-between">
              <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor Unitario</span>
              {(item.alto > 0 && item.ancho > 0) && (
                <button type="button" onClick={calcularValorAuto}
                  className="text-[10px] text-primary hover:underline flex items-center gap-0.5">
                  {calculando ? <Loader2 className="w-3 h-3 animate-spin" /> : <Calculator className="w-3 h-3" />}
                  Auto-calcular
                </button>
              )}
            </label>
            <input
              type="number" min="0"
              value={nf(item.valorUnitario)}
              onChange={(e) => onChange(index, 'valorUnitario', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="input w-full font-mono"
            />
            {item.valorUnitario > 0 && (
              <p className="text-xs text-success mt-1 font-medium">{formatCOP(item.valorUnitario)}</p>
            )}
          </div>
          <div>
            <label className="label">Descuento %</label>
            <input
              type="number" min="0" max="100"
              value={nf(item.descuento)}
              onChange={(e) => onChange(index, 'descuento', parseFloat(e.target.value) || 0)}
              placeholder="0"
              className="input w-full"
            />
          </div>
          <div>
            <label className="label">Subtotal</label>
            <div className="input font-bold text-success font-mono bg-surface-4 cursor-default text-base py-3">
              {formatCOP(subtotal)}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────
export default function CotizacionForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [submitting, setSubmitting] = useState(false);
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(id || null);

  const [clienteNombre, setClienteNombre] = useState('');
  const [items, setItems] = useState<Item[]>([itemVacio()]);
  const [descuento, setDescuento] = useState(0);
  const [impuesto, setImpuesto] = useState(0);
  const [observaciones, setObservaciones] = useState('');

  // Cargar cotización existente si se edita
  useEffect(() => {
    if (!id) return;
    api.get(`/cotizaciones/${id}`).then((r) => {
      const c = r.data.cotizacion;
      setClienteNombre(c.cliente?.nombre || '');
      setItems(c.items?.length ? c.items : [itemVacio()]);
      setDescuento(c.descuento || 0);
      setImpuesto(c.impuesto || 0);
      setObservaciones(c.observaciones || '');
    });
  }, [id]);

  // Actualizar un campo de un ítem
  const updateItem = useCallback((idx: number, field: keyof Item, value: string | number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[idx] = { ...updated[idx], [field]: value };
      updated[idx].subtotal = calcSubtotalItem(updated[idx]);
      return updated;
    });
  }, []);

  const removeItem = useCallback((idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  const addItem = () => setItems((prev) => [...prev, itemVacio()]);

  // Totales
  const subtotalTotal = items.reduce((s, i) => s + (i.subtotal || 0), 0);
  const descuentoVal = subtotalTotal * (descuento / 100);
  const base = subtotalTotal - descuentoVal;
  const impuestoVal = base * (impuesto / 100);
  const total = base + impuestoVal;

  const getPayload = () => ({
    clienteNombre,
    items: items.map((it) => ({ ...it, subtotal: calcSubtotalItem(it) })),
    descuento,
    impuesto,
    observaciones,
  });

  const onSubmit = async () => {
    if (!clienteNombre.trim()) return toast.error('Ingresa el nombre del cliente');
    if (items.length === 0 || items.every((i) => !i.descripcion.trim())) return toast.error('Agrega al menos un ítem con descripción');

    setSubmitting(true);
    try {
      if (id) {
        await api.put(`/cotizaciones/${id}`, getPayload());
        toast.success('Cotización actualizada ✓');
      } else {
        const res = await api.post('/cotizaciones', getPayload());
        const newId = res.data.cotizacion._id;
        setSavedId(newId);
        toast.success(`Cotización COT-${String(res.data.cotizacion.numero).padStart(3, '0')} creada ✓`);
      }
    } catch (e: unknown) {
      const err = e as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Error al guardar');
    } finally { setSubmitting(false); }
  };

  const descargarPDF = async () => {
    const currentId = savedId || id;
    if (!currentId) {
      toast.error('Primero guarda la cotización para generar el PDF');
      return;
    }
    setGenerandoPDF(true);
    try {
      const token = useAuthStore.getState().accessToken;
      const response = await fetch(`${import.meta.env.VITE_API_URL || `http://${window.location.hostname}:5000/api`}/cotizaciones/${currentId}/pdf`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) {
        let errMessage = 'Error al generar PDF';
        try {
          const errData = await response.json();
          if (errData.message) errMessage = errData.message;
        } catch {
          errMessage = `Error ${response.status}: ${response.statusText}`;
        }
        throw new Error(errMessage);
      }
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Cotizacion-${currentId}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success('📄 PDF descargado correctamente');
    } catch (e: any) {
      toast.error(e.message || 'Error al generar el PDF');
    } finally { setGenerandoPDF(false); }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">{id ? 'Editar' : 'Nueva'} Cotización</h2>
          <p className="page-subtitle">Valledupar, Cesar — {new Date().toLocaleDateString('es-CO', { day: '2-digit', month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={descargarPDF}
            disabled={generandoPDF}
            className="btn-outline flex items-center gap-2"
          >
            {generandoPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
            {generandoPDF ? 'Generando...' : 'Descargar PDF'}
          </button>
          <button
            type="button"
            onClick={onSubmit}
            disabled={submitting}
            className="btn-primary flex items-center gap-2"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {submitting ? 'Guardando...' : id ? 'Actualizar' : 'Guardar'}
          </button>
        </div>
      </div>

      {/* Sección 1: Cliente */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center text-primary text-xs font-bold">1</span>
          Información del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="label">Nombre del cliente *</label>
            <ClienteSelector value={clienteNombre} onChange={(nombre) => setClienteNombre(nombre)} />
          </div>
          <div>
            <label className="label">Observaciones / Notas</label>
            <input
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Instrucciones especiales, condiciones, etc..."
              className="input w-full"
            />
          </div>
        </div>
      </div>

      {/* Sección 2: Ítems */}
      <div className="card">
        <div className="flex items-center justify-between mb-5">
          <h3 className="text-sm font-semibold text-text flex items-center gap-2">
            <span className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center text-primary text-xs font-bold">2</span>
            Productos / Servicios
            <span className="text-xs text-text-dim font-normal">({items.length} ítem{items.length !== 1 ? 's' : ''})</span>
          </h3>
          <button
            type="button"
            onClick={addItem}
            className="btn-primary text-sm"
          >
            <Plus className="w-4 h-4" /> Agregar ítem
          </button>
        </div>

        <div className="space-y-4">
          <AnimatePresence>
            {items.map((item, i) => (
              <ItemRow
                key={i}
                item={item}
                index={i}
                onChange={updateItem}
                onRemove={removeItem}
              />
            ))}
          </AnimatePresence>
        </div>

        {items.length === 0 && (
          <div className="text-center py-10 text-text-muted">
            <Calculator className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No hay ítems. Agrega el primero.</p>
            <button type="button" onClick={addItem} className="btn-outline mt-3 text-sm">
              <Plus className="w-4 h-4" /> Agregar primer ítem
            </button>
          </div>
        )}
      </div>

      {/* Sección 3: Totales */}
      <div className="card">
        <h3 className="text-sm font-semibold text-text mb-4 flex items-center gap-2">
          <span className="w-7 h-7 bg-primary/15 rounded-lg flex items-center justify-center text-primary text-xs font-bold">3</span>
          <Calculator className="w-4 h-4" /> Resumen de Totales
        </h3>

        <div className="flex justify-end">
          <div className="w-full max-w-sm space-y-3">
            {/* Subtotal */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">Subtotal:</span>
              <span className="font-mono font-semibold text-text">{formatCOP(subtotalTotal)}</span>
            </div>

            {/* Descuento */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">Descuento:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-3 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    value={descuento}
                    onChange={(e) => setDescuento(Math.max(0, Math.min(100, parseFloat(e.target.value) || 0)))}
                    className="w-12 bg-transparent text-center text-sm font-mono outline-none text-text"
                    min="0" max="100"
                  />
                  <span className="text-text-dim text-xs">%</span>
                </div>
                <span className="font-mono text-error text-sm">- {formatCOP(descuentoVal)}</span>
              </div>
            </div>

            {/* IVA */}
            <div className="flex justify-between items-center py-2 border-b border-border">
              <span className="text-sm text-text-muted">IVA:</span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-surface-3 rounded-lg px-2 py-1">
                  <input
                    type="number"
                    value={impuesto}
                    onChange={(e) => setImpuesto(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-12 bg-transparent text-center text-sm font-mono outline-none text-text"
                    min="0"
                  />
                  <span className="text-text-dim text-xs">%</span>
                </div>
                <span className="font-mono text-sm">{formatCOP(impuestoVal)}</span>
              </div>
            </div>

            {/* TOTAL */}
            <div className="bg-primary/10 rounded-xl p-4 flex justify-between items-center border border-primary/20">
              <span className="font-bold text-base">TOTAL</span>
              <span className="font-bold text-2xl text-primary font-mono">{formatCOP(total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Botones inferiores */}
      <div className="flex gap-3 justify-end pb-6">
        <button type="button" onClick={() => navigate('/cotizaciones')} className="btn-ghost">
          Cancelar
        </button>
        <button type="button" onClick={descargarPDF} disabled={generandoPDF} className="btn-outline">
          {generandoPDF ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4" />}
          PDF
        </button>
        <button type="button" onClick={onSubmit} disabled={submitting} className="btn-primary">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          {submitting ? 'Guardando...' : 'Guardar Cotización'}
        </button>
      </div>
    </div>
  );
}
