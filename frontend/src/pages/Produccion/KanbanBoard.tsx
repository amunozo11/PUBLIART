import { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import { GripVertical, User, Clock, Maximize2, Ruler, Zap, AlertCircle, ExternalLink } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../lib/api';
import toast from 'react-hot-toast';

const COLUMNAS = [
  { id: 'pendiente',  label: 'Pendiente',  color: '#F59E0B' },
  { id: 'diseño',     label: 'Diseño',     color: '#3B82F6' },
  { id: 'produccion', label: 'Producción', color: '#8B5CF6' },
  { id: 'corte',      label: 'Corte',      color: '#EF4444' },
  { id: 'terminado',  label: 'Terminado',  color: '#22C55E' },
  { id: 'entregado',  label: 'Entregado',  color: '#64748B' },
];

const PRIORIDAD_COLOR: Record<string, string> = {
  urgente: 'bg-red-500/20 text-red-400 border border-red-500/30',
  alta:    'bg-orange-500/20 text-orange-400 border border-orange-500/30',
  media:   'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  baja:    'bg-slate-500/20 text-slate-400 border border-slate-500/30',
};

const MAQUINA_LABEL: Record<string, string> = {
  plotterVinilo: 'Vinilo',
  plotterBanner: 'Banner',
  corte: 'Corte',
  laser: 'Láser',
  laminado: 'Laminado',
  instalacion: 'Instalación',
};

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

type Trabajo = Record<string, unknown>;
type Kanban = Record<string, Trabajo[]>;

export default function KanbanBoard() {
  const navigate = useNavigate();
  const [kanban, setKanban] = useState<Kanban>({});
  const [loading, setLoading] = useState(true);
  const [dragging, setDragging] = useState(false);
  const [mostrarArchivados, setMostrarArchivados] = useState(false);

  const fetchKanban = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/produccion/kanban', { params: { mostrarArchivados } });
      setKanban(res.data.kanban);
    } catch {
      toast.error('Error cargando el tablero');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchKanban(); }, [fetchKanban, mostrarArchivados]);

  const onDragStart = () => setDragging(true);

  const onDragEnd = async (result: DropResult) => {
    setDragging(false);

    if (!result.destination) return;

    const sourceCol = result.source.droppableId;
    const destCol = result.destination.droppableId;
    if (sourceCol === destCol) return;

    const id = result.draggableId;
    const prevData = { ...kanban };

    const sourceItems = [...(kanban[sourceCol] || [])];
    const destItems = kanban[destCol] ? [...kanban[destCol]] : [];

    const [movedItem] = sourceItems.splice(result.source.index, 1);
    movedItem.estado = destCol;
    destItems.splice(result.destination.index, 0, movedItem);

    setKanban({
      ...kanban,
      [sourceCol]: sourceItems,
      [destCol]: destItems,
    });

    try {
      await api.patch(`/produccion/${id}/estado`, { estado: destCol });
      const col = COLUMNAS.find((c) => c.id === destCol);
      toast.success(`Movido a "${col?.label || destCol}"`);
    } catch {
      toast.error('Error al mover trabajo — revirtiendo');
      setKanban(prevData);
    }
  };

  const toggleCobro = async (e: React.MouseEvent, t: Trabajo) => {
    e.stopPropagation();
    const nuevoEstado = !t.cobrado;
    const isConfirmed = window.confirm(`¿Marcar este trabajo como ${nuevoEstado ? 'COBRADO' : 'NO COBRADO'}?`);
    if (!isConfirmed) return;

    try {
      await api.patch(`/produccion/${t._id}/cobrado`, { cobrado: nuevoEstado });
      toast.success(`Trabajo marcado como ${nuevoEstado ? 'cobrado' : 'pendiente'}`);
      fetchKanban();
    } catch {
      toast.error('Error al actualizar cobro');
    }
  };

  const deleteTrabajo = async (e: React.MouseEvent, t: Trabajo) => {
    e.stopPropagation();
    const isConfirmed = window.confirm('¿ELIMINAR este trabajo? Esta acción no se puede deshacer.');
    if (!isConfirmed) return;

    try {
      await api.delete(`/produccion/${t._id}`);
      toast.success('Trabajo eliminado');
      fetchKanban();
    } catch {
      toast.error('Error al eliminar trabajo');
    }
  };

  const totalTrabajos = COLUMNAS.reduce((acc, col) => acc + (kanban[col.id]?.length || 0), 0);

  return (
    <div className="space-y-4">
      <div className="page-header">
        <div>
          <h2 className="page-title">Kanban de Producción</h2>
          <p className="page-subtitle">{totalTrabajos} trabajos en total — Arrastra entre columnas para cambiar fase</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-text cursor-pointer hover:text-primary transition-colors">
            <input 
              type="checkbox" 
              checked={mostrarArchivados}
              onChange={(e) => setMostrarArchivados(e.target.checked)}
              className="checkbox"
            />
            Ver Entregados
          </label>
          <button onClick={fetchKanban} className="btn-secondary">
            {loading ? 'Cargando...' : 'Actualizar'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {COLUMNAS.map((c) => (
            <div key={c.id} className="kanban-col min-h-64 flex-shrink-0">
              <div className="px-4 py-3 border-b border-border">
                <div className="shimmer-effect h-4 rounded w-20 bg-surface-3" />
              </div>
              <div className="p-3 space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="shimmer-effect h-24 rounded-lg bg-surface-3" />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <DragDropContext onDragStart={onDragStart} onDragEnd={onDragEnd}>
          <div className="flex gap-4 overflow-x-auto pb-4 select-none">
            {COLUMNAS.map((col) => {
              const items = kanban[col.id] || [];
              return (
                <div
                  key={col.id}
                  className="kanban-col flex-shrink-0"
                  style={{ minWidth: 270 }}
                >
                  {/* Column header */}
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between sticky top-0 bg-surface-2 z-10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full" style={{ background: col.color }} />
                      <span className="text-xs font-semibold text-text">{col.label}</span>
                    </div>
                    <span className="text-xs text-text-muted bg-surface-4 px-2 py-0.5 rounded-full font-mono">
                      {items.length}
                    </span>
                  </div>

                  <Droppable droppableId={col.id}>
                    {(provided, snapshot) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.droppableProps}
                        className="flex-1 p-3 space-y-3 min-h-40 transition-all duration-150"
                        style={{
                          background: snapshot.isDraggingOver
                            ? 'rgba(245,196,0,0.04)'
                            : 'transparent',
                          borderRadius: snapshot.isDraggingOver ? 8 : 0,
                        }}
                      >
                        {items.map((t: Trabajo, i: number) => {
                          const archivo   = t.archivo   as Record<string, string> | undefined;
                          const cliente   = t.cliente   as Record<string, string> | undefined;
                          const medidas   = t.medidas   as Record<string, number|string> | undefined;
                          const responsable = t.responsable as Record<string, string> | undefined;
                          const prioridad = (t.prioridad as string) || 'media';
                          const maquina   = t.maquina   as string;

                          return (
                            <Draggable
                              key={t._id as string}
                              draggableId={t._id as string}
                              index={i}
                            >
                              {(prov, snap) => (
                                <div
                                  ref={prov.innerRef}
                                  {...prov.draggableProps}
                                  className="kanban-card group/card cursor-pointer"
                                  onClick={() => navigate(`/produccion/${t._id as string}`)}
                                  style={{
                                    ...prov.draggableProps.style,
                                    opacity: snap.isDragging ? 0.92 : 1,
                                    boxShadow: snap.isDragging
                                      ? '0 8px 32px rgba(0,0,0,0.5), 0 0 0 2px rgba(245,196,0,0.3)'
                                      : undefined,
                                    transform: snap.isDragging
                                      ? `${prov.draggableProps.style?.transform || ''} rotate(1.5deg)`
                                      : prov.draggableProps.style?.transform,
                                  }}
                                >
                                  {/* Drag handle + content */}
                                  <div className="flex items-start gap-2">
                                    <div
                                      {...prov.dragHandleProps}
                                      className="text-text-dim hover:text-primary mt-0.5 flex-shrink-0 cursor-grab active:cursor-grabbing transition-colors"
                                    >
                                      <GripVertical className="w-3.5 h-3.5" />
                                    </div>

                                    <div className="flex-1 min-w-0">
                                      {/* Badges fila 1 */}
                                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                                        {maquina && (
                                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/15 text-primary font-medium">
                                            {MAQUINA_LABEL[maquina] || maquina}
                                          </span>
                                        )}
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${PRIORIDAD_COLOR[prioridad]}`}>
                                          {prioridad === 'urgente' && <AlertCircle className="w-2.5 h-2.5 inline mr-0.5" />}
                                          {prioridad}
                                        </span>
                                      </div>

                                      {/* Nombre archivo */}
                                      <p className="text-xs font-medium text-text truncate leading-snug">
                                        {archivo?.nombre || 'Sin archivo'}
                                      </p>

                                      {/* Cliente */}
                                      <p className="text-xs text-primary mt-0.5 font-semibold truncate">
                                        {cliente?.nombre || '—'}
                                      </p>

                                      {/* Medidas */}
                                      {medidas && (Number(medidas.alto) > 0 || Number(medidas.ancho) > 0) && (
                                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-text-muted">
                                          <Ruler className="w-3 h-3" />
                                          <span>
                                            {medidas.alto} × {medidas.ancho} {medidas.unidad}
                                            {Number(medidas.metrosCuadrados) > 0 && (
                                              <span className="ml-1 text-text-dim">
                                                ({Number(medidas.metrosCuadrados).toFixed(2)} m²)
                                              </span>
                                            )}
                                          </span>
                                        </div>
                                      )}

                                      {/* Valor + responsable */}
                                      <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-success font-bold">
                                          {formatCOP(t.valor as number || 0)}
                                        </span>
                                        {responsable?.nombre && (
                                          <div className="flex items-center gap-1 text-[10px] text-text-muted">
                                            <User className="w-3 h-3" />
                                            <span className="truncate max-w-16">{responsable.nombre}</span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Fecha */}
                                      <div className="flex items-center justify-between mt-1">
                                        <div className="flex items-center gap-1 text-[10px] text-text-dim">
                                          <Clock className="w-3 h-3" />
                                          {new Date(t.createdAt as string).toLocaleDateString('es-CO', {
                                            day: '2-digit', month: 'short',
                                          })}
                                        </div>
                                        {/* Botones de acción (cobro/borrar) */}
                                        <div className="flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                                          <button 
                                            onClick={(e) => toggleCobro(e, t)}
                                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase transition-colors ${
                                              t.cobrado 
                                                ? 'bg-success/20 text-success hover:bg-success/30' 
                                                : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                                            }`}
                                          >
                                            {t.cobrado ? 'Cobrado' : 'No Cobrado'}
                                          </button>
                                          <button 
                                            onClick={(e) => deleteTrabajo(e, t)}
                                            className="px-1.5 py-0.5 rounded text-[9px] font-bold uppercase bg-surface-3 text-text-dim hover:bg-red-500/20 hover:text-red-500 transition-colors"
                                            title="Eliminar tarjeta"
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </div>

                                      {/* Observaciones */}
                                      {t.observaciones && (
                                        <p className="text-[10px] text-text-dim mt-1 italic truncate">
                                          {t.observaciones as string}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              )}
                            </Draggable>
                          );
                        })}

                        {provided.placeholder}

                        {/* Empty column hint */}
                        {items.length === 0 && !dragging && (
                          <div className="flex flex-col items-center justify-center h-20 border-2 border-dashed border-border rounded-lg text-text-dim">
                            <Maximize2 className="w-4 h-4 mb-1 opacity-40" />
                            <span className="text-[10px]">Arrastra aquí</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Droppable>
                </div>
              );
            })}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}
