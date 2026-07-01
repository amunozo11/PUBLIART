import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUsuario extends Document {
  nombre: string;
  email: string;
  password: string;
  rol: 'admin' | 'diseñador' | 'produccion' | 'ventas';
  activo: boolean;
  avatar?: string;
  ultimoAcceso?: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const UsuarioSchema = new Schema<IUsuario>(
  {
    nombre: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true, minlength: 6 },
    rol: { type: String, enum: ['admin', 'diseñador', 'produccion', 'ventas'], default: 'ventas' },
    activo: { type: Boolean, default: true },
    avatar: { type: String },
    ultimoAcceso: { type: Date },
  },
  { timestamps: true }
);

UsuarioSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

UsuarioSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

UsuarioSchema.set('toJSON', {
  transform: (_doc, ret: any) => {
    delete ret.password;
    return ret;
  },
});

export const Usuario = mongoose.model<IUsuario>('Usuario', UsuarioSchema);
