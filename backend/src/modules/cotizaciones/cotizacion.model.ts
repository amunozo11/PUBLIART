import mongoose, { Document, Schema } from 'mongoose';

export interface ICotizacionItem {
  descripcion: string;
  cantidad: number;
  alto?: number;
  ancho?: number;
  material?: string;
  valorUnitario: number;
  descuento: number;
  subtotal: number;
}

export interface ICotizacion extends Document {
  numero: number;
  cliente: mongoose.Types.ObjectId;
  items: ICotizacionItem[];
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observaciones?: string;
  estado: 'borrador' | 'enviada' | 'aprobada' | 'rechazada' | 'convertida';
  validezDias: number;
  convertidaAFactura: boolean;
  facturaRef?: mongoose.Types.ObjectId;
  creadoPor: mongoose.Types.ObjectId;
}

const ItemSchema = new Schema<ICotizacionItem>({
  descripcion: { type: String, required: true },
  cantidad: { type: Number, required: true, min: 1 },
  alto: { type: Number },
  ancho: { type: Number },
  material: { type: String },
  valorUnitario: { type: Number, required: true },
  descuento: { type: Number, default: 0 },
  subtotal: { type: Number, required: true },
}, { _id: false });

const CotizacionSchema = new Schema<ICotizacion>(
  {
    numero: { type: Number, unique: true },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
    items: [ItemSchema],
    subtotal: { type: Number, default: 0 },
    descuento: { type: Number, default: 0 },
    impuesto: { type: Number, default: 19 },
    total: { type: Number, default: 0 },
    observaciones: { type: String },
    estado: {
      type: String,
      enum: ['borrador', 'enviada', 'aprobada', 'rechazada', 'convertida'],
      default: 'borrador',
    },
    validezDias: { type: Number, default: 30 },
    convertidaAFactura: { type: Boolean, default: false },
    facturaRef: { type: Schema.Types.ObjectId, ref: 'Factura' },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

// Auto-incremento del número
CotizacionSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await mongoose.model('Cotizacion').findOne().sort({ numero: -1 }).select('numero');
    this.numero = (last?.numero || 0) + 1;
  }
  next();
});

export const Cotizacion = mongoose.model<ICotizacion>('Cotizacion', CotizacionSchema);
