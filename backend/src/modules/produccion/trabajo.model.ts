import mongoose, { Document, Schema } from 'mongoose';

export interface IHistorialEstado {
  estado: string;
  usuario: mongoose.Types.ObjectId;
  fecha: Date;
  observacion?: string;
}

export interface ITrabajoProduccion extends Document {
  archivo: {
    nombre: string;
    nombreOriginal: string;
    ruta?: string;
    extension: string;
    carpetaOrigen: string;
  };
  medidas: {
    alto: number;
    ancho: number;
    unidad: 'cm' | 'm';
    metrosCuadrados: number;
  };
  maquina: 'plotterVinilo' | 'plotterBanner' | 'corte' | 'laser' | 'laminado' | 'instalacion' | 'dtf' | 'corteSticker';
  tipo: 'vinilo' | 'banner' | 'corte' | 'laser' | 'laminado' | 'instalacion' | 'dtf' | 'corteSticker' | 'otro';
  cliente: mongoose.Types.ObjectId;
  cotizacionRef?: mongoose.Types.ObjectId;
  facturaRef?: mongoose.Types.ObjectId;
  estado: 'pendiente' | 'diseño' | 'produccion' | 'corte' | 'terminado' | 'entregado';
  valor: number;
  valorFormula?: string;
  responsable?: mongoose.Types.ObjectId;
  prioridad: 'baja' | 'media' | 'alta' | 'urgente';
  historialEstados: IHistorialEstado[];
  tiempoInicio?: Date;
  tiempoFin?: Date;
  observaciones?: string;
  creadoPor?: mongoose.Types.ObjectId;
  creadoAutomaticamente: boolean;
  cobrado: boolean;
  valorCobrado?: number;
  notaCobro?: string;
  fechaCobro?: Date;
  sinCliente: boolean;
  whatsappEnviado: boolean;
  descripcion?: string;
}

const TrabajoSchema = new Schema<ITrabajoProduccion>(
  {
    archivo: {
      nombre: { type: String, required: true },
      nombreOriginal: { type: String, required: true },
      ruta: { type: String },
      extension: { type: String },
      carpetaOrigen: { type: String },
    },
    medidas: {
      alto: { type: Number, default: 0 },
      ancho: { type: Number, default: 0 },
      unidad: { type: String, enum: ['cm', 'm'], default: 'cm' },
      metrosCuadrados: { type: Number, default: 0 },
    },
    maquina: {
      type: String,
      enum: ['plotterVinilo', 'plotterBanner', 'corte', 'laser', 'laminado', 'instalacion', 'dtf', 'corteSticker'],
      required: true,
    },
    tipo: {
      type: String,
      enum: ['vinilo', 'banner', 'corte', 'laser', 'laminado', 'instalacion', 'dtf', 'corteSticker', 'otro'],
      required: true,
    },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
    cotizacionRef: { type: Schema.Types.ObjectId, ref: 'Cotizacion' },
    facturaRef: { type: Schema.Types.ObjectId, ref: 'Factura' },
    estado: {
      type: String,
      enum: ['pendiente', 'diseño', 'produccion', 'corte', 'terminado', 'entregado'],
      default: 'pendiente',
    },
    valor: { type: Number, default: 0 },
    valorFormula: { type: String },
    responsable: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    prioridad: { type: String, enum: ['baja', 'media', 'alta', 'urgente'], default: 'media' },
    historialEstados: [
      {
        estado: String,
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        fecha: { type: Date, default: Date.now },
        observacion: String,
      },
    ],
    tiempoInicio: { type: Date },
    tiempoFin: { type: Date },
    observaciones: { type: String },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    creadoAutomaticamente: { type: Boolean, default: false },
    cobrado: { type: Boolean, default: false },
    valorCobrado: { type: Number },
    notaCobro: { type: String },
    fechaCobro: { type: Date },
    sinCliente: { type: Boolean, default: false },
    whatsappEnviado: { type: Boolean, default: false },
    descripcion: { type: String },
  },
  { timestamps: true }
);

export const TrabajoProduccion = mongoose.model<ITrabajoProduccion>('TrabajoProduccion', TrabajoSchema);
