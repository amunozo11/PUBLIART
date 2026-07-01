import mongoose, { Document, Schema } from 'mongoose';

export interface INotificacion extends Document {
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  accionUrl?: string;
  destinatarios: Array<{
    usuario: mongoose.Types.ObjectId;
    leida: boolean;
    leidaEn?: Date;
  }>;
  global: boolean;
}

const NotificacionSchema = new Schema<INotificacion>(
  {
    titulo: { type: String, required: true },
    mensaje: { type: String, required: true },
    tipo: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
    accionUrl: { type: String },
    destinatarios: [
      {
        usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
        leida: { type: Boolean, default: false },
        leidaEn: { type: Date },
      },
    ],
    global: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Notificacion = mongoose.model<INotificacion>('Notificacion', NotificacionSchema);
