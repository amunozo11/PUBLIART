import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditoria extends Document {
  usuario?: mongoose.Types.ObjectId;
  accion: string;
  modulo: string;
  entidadId?: string;
  ip?: string;
  userAgent?: string;
  datos?: Record<string, unknown>;
  duracionMs?: number;
}

const AuditoriaSchema = new Schema<IAuditoria>(
  {
    usuario: { type: Schema.Types.ObjectId, ref: 'Usuario' },
    accion: { type: String, required: true },
    modulo: { type: String, required: true },
    entidadId: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    datos: { type: Schema.Types.Mixed },
    duracionMs: { type: Number },
  },
  { timestamps: true }
);

AuditoriaSchema.index({ createdAt: -1 });
AuditoriaSchema.index({ usuario: 1 });

export const Auditoria = mongoose.model<IAuditoria>('Auditoria', AuditoriaSchema);
