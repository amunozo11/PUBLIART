import mongoose, { Document, Schema } from 'mongoose';

export interface IGasto extends Document {
  descripcion: string;
  monto: number;
  categoria: 'Materiales' | 'Maquinaria' | 'Nómina' | 'Servicios' | 'Otros';
  fecha: Date;
  referencia?: string;
  creadoPor: mongoose.Types.ObjectId;
}

const GastoSchema = new Schema<IGasto>(
  {
    descripcion: { type: String, required: true },
    monto: { type: Number, required: true },
    categoria: {
      type: String,
      enum: ['Materiales', 'Maquinaria', 'Nómina', 'Servicios', 'Otros'],
      required: true,
    },
    fecha: { type: Date, default: Date.now },
    referencia: { type: String },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario', required: true },
  },
  { timestamps: true }
);

export const Gasto = mongoose.model<IGasto>('Gasto', GastoSchema);
