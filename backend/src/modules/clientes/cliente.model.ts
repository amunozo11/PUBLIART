import mongoose, { Document, Schema } from 'mongoose';

export interface ICliente extends Document {
  nombre: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  nit?: string;
  empresa?: string;
  ciudad?: string;
  observaciones?: string;
  foto?: string;
  estado: 'potencial' | 'negociacion' | 'activo' | 'frecuente' | 'inactivo';
  creadoPor?: mongoose.Types.ObjectId;
  creadoAutomaticamente: boolean;
}

const ClienteSchema = new Schema<ICliente>(
  {
    nombre: { type: String, required: true, trim: true },
    telefono: { type: String, trim: true },
    correo: { type: String, lowercase: true, trim: true },
    direccion: { type: String, trim: true },
    nit: { type: String, trim: true },
    empresa: { type: String, trim: true },
    ciudad: { type: String, trim: true, default: 'Valledupar' },
    observaciones: { type: String },
    foto: { type: String }, // ruta relativa a la imagen del cliente
    estado: {
      type: String,
      enum: ['potencial', 'negociacion', 'activo', 'frecuente', 'inactivo'],
      default: 'potencial',
    },
    creadoPor: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    creadoAutomaticamente: { type: Boolean, default: false },
  },
  { timestamps: true }
);

ClienteSchema.index({ nombre: 'text', empresa: 'text', correo: 'text' });

export const Cliente = mongoose.model<ICliente>('Cliente', ClienteSchema);
