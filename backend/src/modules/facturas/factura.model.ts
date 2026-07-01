import mongoose, { Document, Schema } from 'mongoose';

export interface IPago {
  monto: number;
  fecha: Date;
  metodo: 'efectivo' | 'transferencia' | 'tarjeta' | 'nequi' | 'daviplata' | 'otro';
  referencia?: string;
  usuario: mongoose.Types.ObjectId;
}

export interface IFactura extends Document {
  numero: number;
  cliente: mongoose.Types.ObjectId;
  cotizacionRef?: mongoose.Types.ObjectId;
  items: Array<{
    descripcion: string;
    cantidad: number;
    alto?: number;
    ancho?: number;
    material?: string;
    valorUnitario: number;
    descuento: number;
    subtotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  totalPagado: number;
  saldoPendiente: number;
  estado: 'pendiente' | 'parcial' | 'pagada' | 'cancelada';
  pagos: IPago[];
  observaciones?: string;
  creadoPor: mongoose.Types.ObjectId;
}

const PagoSchema = new Schema<IPago>({
  monto: { type: Number, required: true },
  fecha: { type: Date, default: Date.now },
  metodo: { type: String, enum: ['efectivo', 'transferencia', 'tarjeta', 'nequi', 'daviplata', 'otro'], required: true },
  referencia: { type: String },
  usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
}, { _id: true });

const ItemSchema = new Schema({
  descripcion: String,
  cantidad: Number,
  alto: Number,
  ancho: Number,
  material: String,
  valorUnitario: Number,
  descuento: { type: Number, default: 0 },
  subtotal: Number,
}, { _id: false });

const FacturaSchema = new Schema<IFactura>(
  {
    numero: { type: Number, unique: true },
    cliente: { type: Schema.Types.ObjectId, ref: 'Cliente', required: true },
    cotizacionRef: { type: Schema.Types.ObjectId, ref: 'Cotizacion' },
    items: [ItemSchema],
    subtotal: { type: Number, default: 0 },
    descuento: { type: Number, default: 0 },
    impuesto: { type: Number, default: 19 },
    total: { type: Number, default: 0 },
    totalPagado: { type: Number, default: 0 },
    saldoPendiente: { type: Number, default: 0 },
    estado: {
      type: String,
      enum: ['pendiente', 'parcial', 'pagada', 'cancelada'],
      default: 'pendiente',
    },
    pagos: [PagoSchema],
    observaciones: { type: String },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

FacturaSchema.pre('save', async function (next) {
  if (this.isNew) {
    const last = await mongoose.model('Factura').findOne().sort({ numero: -1 }).select('numero');
    this.numero = (last?.numero || 0) + 1;
  }
  this.totalPagado = this.pagos.reduce((sum, p) => sum + p.monto, 0);
  this.saldoPendiente = this.total - this.totalPagado;
  if (this.totalPagado >= this.total) this.estado = 'pagada';
  else if (this.totalPagado > 0) this.estado = 'parcial';
  next();
});

export const Factura = mongoose.model<IFactura>('Factura', FacturaSchema);
