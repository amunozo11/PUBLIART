import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Package, Ruler, DollarSign, AlertTriangle, ChevronDown, Calculator, Loader2 } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Cliente {
  _id: string;
  nombre: string;
  empresa?: string;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  clientePreseleccionado?: { id: string; nombre: string };
  onCreado?: () => void;
}

const TIPOS = ['vinilo', 'banner', 'corte', 'laser', 'laminado', 'instalacion', 'dtf', 'corteSticker', 'otro'];
const MAQUINAS = ['plotterVinilo', 'plotterBanner', 'corte', 'laser', 'laminado', 'instalacion', 'dtf', 'corteSticker'];
const MAQUINA_LABELS: Record<string, string> = {
  plotterVinilo: 'Plotter Vinilo', plotterBanner: 'Plotter Banner',
  corte: 'Corte', laser: 'Láser', laminado: 'Laminado', instalacion: 'Instalación',
  dtf: 'DTF', corteSticker: 'Corte Sticker',
};
const TIPO_LABELS: Record<string, string> = {
  vinilo: 'Vinilo', banner: 'Banner', corte: 'Corte', laser: 'Láser',
  laminado: 'Laminado', instalacion: 'Instalación', dtf: 'DTF', corteSticker: 'Corte Sticker', otro: 'Otro',
};
const PRIORIDADES = ['baja', 'media', 'alta', 'urgente'];
const PRIORIDAD_COLOR: Record<string, string> = {
  baja: '#64748B', media: '#3B82F6', alta: '#F59E0B', urgente: '#EF4444',
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

export default function NuevoTrabajoModal({ isOpen, onClose, clientePreseleccionado, onCreado }: Props) {
  const [saving, setSaving] = useState(false);
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [usuarios, setUsuarios] = useState<{ _id: string; nombre: string; rol: string }[]>([]);
  const [busquedaCliente, setBusquedaCliente] = useState('');
  const [clienteSeleccionado, setClienteSeleccionado] = useState<{ id: string; nombre: string } | null>(
    clientePreseleccionado || null
  );
  const [showClienteDropdown, setShowClienteDropdown] = useState(false);
  const [tabCliente, setTabCliente] = useState<'existente' | 'nuevo'>('existente');
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState('');

  const [form, setForm] = useState({
    descripcion: '',
    tipo: 'vinilo',
    maquina: 'plotterVinilo',
    prioridad: 'media',
    alto: '',
    ancho: '',
    unidad: 'cm' as 'cm' | 'm',
    valor: '',
    observaciones: '',
    responsable: '',
  });
  const [autoCalculando, setAutoCalculando] = useState(false);

  // Metros cuadrados calculados
  const alto = parseFloat(form.alto) || 0;
  const ancho = parseFloat(form.ancho) || 0;
  const factorM = form.unidad === 'cm' ? 0.01 : 1;
  const m2 = alto && ancho ? parseFloat((alto * factorM * ancho * factorM).toFixed(4)) : 0;

  useEffect(() => {
    // Cargar usuarios para el responsable
    const fetchUsuarios = async () => {
      try {
        const res = await api.get('/usuarios');
        setUsuarios(res.data.usuarios || []);
      } catch { /**/ }
    };
    if (isOpen) fetchUsuarios();
  }, [isOpen]);

  useEffect(() => {
    if (clientePreseleccionado) {
      setClienteSeleccionado(clientePreseleccionado);
    }
  }, [clientePreseleccionado]);

  useEffect(() => {
    if (!busquedaCliente) return;
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/clientes', { params: { search: busquedaCliente, limit: 8 } });
        setClientes(res.data.clientes);
      } catch { /**/ }
    }, 300);
    return () => clearTimeout(timer);
  }, [busquedaCliente]);

  const setField = (field: string, value: string) =>
    setForm((p) => ({ ...p, [field]: value }));

  // Auto-calcular valor cuando cambian medidas o tipo
  const autoCalcValor = useCallback(async (tipo: string, alto: string, ancho: string, unidad: 'cm' | 'm') => {
    const altNum = parseFloat(alto) || 0;
    const anchNum = parseFloat(ancho) || 0;
    if (!altNum || !anchNum) return;
    // Convertir a cm si vienen en metros
    const altCm = unidad === 'm' ? altNum * 100 : altNum;
    const anchCm = unidad === 'm' ? anchNum * 100 : anchNum;
    setAutoCalculando(true);
    try {
      const res = await api.get('/produccion/calcular-valor', {
        params: { tipo, alto: altCm, ancho: anchCm },
      });
      if (res.data.valor > 0) {
        setForm((p) => ({ ...p, valor: String(res.data.valor) }));
        toast.success(`💰 ${res.data.formula || ''} = ${formatCOP(res.data.valor)}${res.data.aplicoMinimo ? ' (mínimo)' : ''}`);
      }
    } catch { /**/ } finally { setAutoCalculando(false); }
  }, []);

  const handleSubmit = async () => {
    if (!clientePreseleccionado) {
      if (tabCliente === 'existente' && !clienteSeleccionado) return toast.error('Selecciona un cliente');
      if (tabCliente === 'nuevo' && !nuevoClienteNombre.trim()) return toast.error('Ingresa el nombre del cliente nuevo');
    }
    if (!form.descripcion.trim()) return toast.error('Ingresa una descripción del trabajo');
    if (!form.maquina) return toast.error('Selecciona la máquina');

    setSaving(true);
    try {
      const payload: any = {
        descripcion: form.descripcion,
        tipo: form.tipo,
        maquina: form.maquina,
        prioridad: form.prioridad,
        medidas: {
          alto: parseFloat(form.alto) || 0,
          ancho: parseFloat(form.ancho) || 0,
          unidad: form.unidad,
        },
        valor: parseFloat(form.valor) || 0,
        observaciones: form.observaciones,
      };

      if (form.responsable) {
        payload.responsable = form.responsable;
      }

      const endpoint = clientePreseleccionado
        ? `/clientes/${clientePreseleccionado.id}/trabajo`
        : '/produccion';

      let body = payload;
      if (!clientePreseleccionado) {
        if (tabCliente === 'existente') {
          body = { ...payload, cliente: clienteSeleccionado?.id };
        } else {
          body = { ...payload, clienteNombre: nuevoClienteNombre.trim() };
        }
      }

      await api.post(endpoint, body);
      toast.success('✅ Trabajo creado correctamente');
      onCreado?.();
      onClose();
      // Reset form
      setForm({ descripcion: '', tipo: 'vinilo', maquina: 'plotterVinilo', prioridad: 'media', alto: '', ancho: '', unidad: 'cm', valor: '', observaciones: '', responsable: '' });
      setNuevoClienteNombre('');
      setTabCliente('existente');
    } catch {
      toast.error('Error al crear el trabajo');
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="relative w-full max-w-2xl bg-surface-2 rounded-2xl border border-border shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 20 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            {/* Header */}
            <div className="flex items-center gap-3 p-5 border-b border-border">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Package className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-text text-base">Nuevo Trabajo</h3>
                <p className="text-xs text-text-muted">
                  {clientePreseleccionado ? `Para: ${clientePreseleccionado.nombre}` : 'Selecciona un cliente'}
                </p>
              </div>
              <button onClick={onClose} className="text-text-dim hover:text-text transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="overflow-y-auto flex-1 p-5 space-y-5">
              {/* Cliente (solo si no hay preseleccionado) */}
              {!clientePreseleccionado && (
                <div className="border border-border rounded-xl p-4 bg-surface-3/30 space-y-3">
                  <div className="flex gap-1 bg-surface-3 rounded-lg p-1">
                    {(['existente', 'nuevo'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setTabCliente(t)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-medium transition-all ${tabCliente === t ? 'bg-primary text-dark shadow-sm' : 'text-text-muted hover:text-text'}`}
                      >
                        {t === 'existente' ? 'Cliente Existente' : 'Nuevo Cliente'}
                      </button>
                    ))}
                  </div>

                  {tabCliente === 'existente' ? (
                    <div className="relative">
                      <div className="relative">
                        <input
                          value={clienteSeleccionado ? clienteSeleccionado.nombre : busquedaCliente}
                          onChange={(e) => {
                            setBusquedaCliente(e.target.value);
                            setClienteSeleccionado(null);
                            setShowClienteDropdown(true);
                          }}
                          onFocus={() => setShowClienteDropdown(true)}
                          placeholder="Buscar cliente..."
                          className="input w-full pr-8"
                        />
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim pointer-events-none" />
                      </div>
                      {showClienteDropdown && clientes.length > 0 && (
                        <div className="absolute z-10 top-full mt-1 w-full bg-surface-3 border border-border rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                          {clientes.map((c) => (
                            <button
                              key={c._id}
                              type="button"
                              onClick={() => {
                                setClienteSeleccionado({ id: c._id, nombre: c.nombre });
                                setBusquedaCliente(c.nombre);
                                setShowClienteDropdown(false);
                              }}
                              className="w-full text-left px-4 py-2.5 hover:bg-surface-4 transition-colors text-sm border-b border-border/50 last:border-0"
                            >
                              <span className="font-medium text-text">{c.nombre}</span>
                              {c.empresa && <span className="text-text-dim ml-2 text-xs">{c.empresa}</span>}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <input
                        value={nuevoClienteNombre}
                        onChange={(e) => setNuevoClienteNombre(e.target.value)}
                        placeholder="Nombre completo del cliente"
                        className="input w-full"
                      />
                      <p className="text-[10px] text-text-dim mt-1.5">Se creará automáticamente en la base de datos.</p>
                    </div>
                  )}
                </div>
              )}

              {/* Descripción y Responsable */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-dim mb-1.5">Descripción del trabajo *</label>
                  <input
                    value={form.descripcion}
                    onChange={(e) => setField('descripcion', e.target.value)}
                    placeholder="Ej: Letrero vinilo..."
                    className="input w-full"
                  />
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1.5">Asignar a (Responsable)</label>
                  <select
                    value={form.responsable}
                    onChange={(e) => setField('responsable', e.target.value)}
                    className="input w-full"
                  >
                    <option value="">Sin asignar (Cualquiera)</option>
                    {usuarios.map(u => (
                      <option key={u._id} value={u._id}>{u.nombre} ({u.rol})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Tipo y Máquina */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-dim mb-1.5">Tipo de trabajo</label>
                  <select value={form.tipo} onChange={(e) => setField('tipo', e.target.value)} className="input w-full">
                    {TIPOS.map((t) => (
                      <option key={t} value={t}>{TIPO_LABELS[t] || t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1.5">Máquina *</label>
                  <select value={form.maquina} onChange={(e) => setField('maquina', e.target.value)} className="input w-full">
                    {MAQUINAS.map((m) => (
                      <option key={m} value={m}>{MAQUINA_LABELS[m]}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Medidas */}
              <div>
                <label className="block text-xs text-text-dim mb-1.5 flex items-center gap-1.5">
                  <Ruler className="w-3 h-3" /> Medidas (opcional)
                </label>
                <div className="flex gap-3 items-end">
                  <div className="flex-1">
                    <label className="text-[10px] text-text-dim">Alto</label>
                     <input
                      type="number"
                      value={form.alto}
                      onChange={(e) => setField('alto', e.target.value)}
                      onBlur={() => autoCalcValor(form.tipo, form.alto, form.ancho, form.unidad)}
                      placeholder="0"
                      className="input w-full mt-0.5"
                      min={0}
                    />
                  </div>
                  <span className="text-text-muted pb-2">×</span>
                  <div className="flex-1">
                    <label className="text-[10px] text-text-dim">Ancho</label>
                    <input
                      type="number"
                      value={form.ancho}
                      onChange={(e) => setField('ancho', e.target.value)}
                      onBlur={() => autoCalcValor(form.tipo, form.alto, form.ancho, form.unidad)}
                      placeholder="0"
                      className="input w-full mt-0.5"
                      min={0}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-text-dim">Unidad</label>
                    <select value={form.unidad} onChange={(e) => setField('unidad', e.target.value as 'cm' | 'm')} className="input w-auto mt-0.5">
                      <option value="cm">cm</option>
                      <option value="m">m</option>
                    </select>
                  </div>
                  {m2 > 0 && (
                    <div className="pb-2 text-right">
                      <p className="text-[10px] text-text-dim">m²</p>
                      <p className="text-sm font-bold text-primary">{m2}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Valor y Prioridad */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-text-dim mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3 h-3" /> Valor estimado (COP)
                    {autoCalculando && <Loader2 className="w-3 h-3 animate-spin text-primary" />}
                    {!autoCalculando && alto > 0 && ancho > 0 && (
                      <button
                        type="button"
                        onClick={() => autoCalcValor(form.tipo, form.alto, form.ancho, form.unidad)}
                        className="ml-auto text-[10px] text-primary hover:underline flex items-center gap-0.5"
                      >
                        <Calculator className="w-3 h-3" /> Calcular
                      </button>
                    )}
                  </label>
                  <input
                    type="number"
                    value={form.valor}
                    onChange={(e) => setField('valor', e.target.value)}
                    placeholder="0"
                    className="input w-full"
                    min={0}
                  />
                  {form.valor && (
                    <p className="text-xs text-success mt-1 font-medium">{formatCOP(parseFloat(form.valor) || 0)}</p>
                  )}
                </div>
                <div>
                  <label className="block text-xs text-text-dim mb-1.5 flex items-center gap-1.5">
                    <AlertTriangle className="w-3 h-3" /> Prioridad
                  </label>
                  <div className="flex gap-2">
                    {PRIORIDADES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setField('prioridad', p)}
                        className="flex-1 py-1.5 rounded-lg text-[10px] font-semibold border transition-all"
                        style={{
                          background: form.prioridad === p ? `${PRIORIDAD_COLOR[p]}30` : 'transparent',
                          borderColor: form.prioridad === p ? PRIORIDAD_COLOR[p] : 'rgba(255,255,255,0.1)',
                          color: form.prioridad === p ? PRIORIDAD_COLOR[p] : 'var(--text-muted)',
                        }}
                      >
                        {p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Observaciones */}
              <div>
                <label className="block text-xs text-text-dim mb-1.5">Observaciones (opcional)</label>
                <textarea
                  value={form.observaciones}
                  onChange={(e) => setField('observaciones', e.target.value)}
                  placeholder="Instrucciones especiales, detalles del trabajo..."
                  rows={3}
                  className="input w-full resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 p-5 pt-3 border-t border-border">
              <button onClick={onClose} className="btn-ghost flex-1">Cancelar</button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {saving ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Package className="w-4 h-4" />
                )}
                Crear Trabajo
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
