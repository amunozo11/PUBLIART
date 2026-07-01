import mongoose, { Document, Schema } from 'mongoose';

export interface IConfiguracion extends Document {
  precios: {
    vinilo: number;
    banner: number;
    corte: number;
    laminado: number;
    laser: number;
    instalacion: number;
    dtf: number;
    corteSticker: number;
    manoObra: number;
  };
  formulas: {
    vinilo: string;
    banner: string;
    corte: string;
    laminado: string;
    laser: string;
    dtf: string;
    corteSticker: string;
  };
  impuesto: number;
  materiales: Array<{
    nombre: string;
    precio: number;
    unidad: string;
  }>;
  empresa: {
    nombre: string;
    nit: string;
    direccion: string;
    telefono: string;
    correo: string;
    ciudad: string;
    website?: string;
  };
}

const ConfiguracionSchema = new Schema<IConfiguracion>(
  {
    precios: {
      vinilo: { type: Number, default: 15000 },
      banner: { type: Number, default: 12000 },
      corte: { type: Number, default: 18000 },
      laminado: { type: Number, default: 20000 },
      laser: { type: Number, default: 45000 },
      instalacion: { type: Number, default: 50000 },
      dtf: { type: Number, default: 1600 }, // largo x 0.16 (ej: 100 x 0.16 = 16)
      corteSticker: { type: Number, default: 21000 },
      manoObra: { type: Number, default: 30000 },
    },
    formulas: {
      vinilo: { type: String, default: 'alto * ancho * 1.2' },
      banner: { type: String, default: 'alto * ancho * 1.2' },
      corte: { type: String, default: 'alto * ancho * 2.1' },
      laminado: { type: String, default: 'alto * ancho * 2.1' },
      laser: { type: String, default: 'ancho * alto * 20' },
      dtf: { type: String, default: 'largo * 0.16' },
      corteSticker: { type: String, default: 'alto * ancho * 2.1' },
    },
    impuesto: { type: Number, default: 19 },
    materiales: [
      {
        nombre: { type: String },
        precio: { type: Number },
        unidad: { type: String, default: 'm2' },
      },
    ],
    empresa: {
      nombre: { type: String, default: 'PUBLIART' },
      nit: { type: String, default: '' },
      direccion: { type: String, default: '' },
      telefono: { type: String, default: '' },
      correo: { type: String, default: '' },
      ciudad: { type: String, default: 'Valledupar, Cesar' },
      website: { type: String },
    },
  },
  { timestamps: true }
);

export const Configuracion = mongoose.model<IConfiguracion>('Configuracion', ConfiguracionSchema);
