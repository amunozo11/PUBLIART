import mongoose from 'mongoose';
import { Cotizacion } from './src/modules/cotizaciones/cotizacion.model';
import { Cliente } from './src/modules/clientes/cliente.model';
import { Usuario } from './src/modules/auth/usuario.model';
import { getCotizacionById } from './src/modules/cotizaciones/cotizaciones.service';
import { generarPDFCotizacion } from './src/modules/cotizaciones/pdf.generator';

async function run() {
  await mongoose.connect('mongodb+srv://publiart2026:publiart2026@cluster0.4jwlpxr.mongodb.net/publiart?appName=Cluster0');
  const cot = await Cotizacion.findOne().sort({ createdAt: -1 });
  if (!cot) {
    console.log("No cotizaciones found");
    process.exit(0);
  }
  
  console.log("Found cotizacion:", cot._id);
  const cotPop = await getCotizacionById(cot._id.toString());
  const clienteDoc = cotPop.cliente as any;

  const datos = {
    numero: cotPop.numero,
    fecha: (cotPop as any).createdAt as Date,
    validezDias: cotPop.validezDias || 15,
    cliente: {
      nombre: clienteDoc?.nombre || 'Cliente',
      nit: clienteDoc?.nit,
      telefono: clienteDoc?.telefono,
      direccion: clienteDoc?.direccion,
      ciudad: clienteDoc?.ciudad || 'Valledupar',
      correo: clienteDoc?.correo,
    },
    items: cotPop.items.map((item: any) => ({
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      alto: item.alto,
      ancho: item.ancho,
      valorUnitario: item.valorUnitario,
      descuento: item.descuento,
      subtotal: item.subtotal,
    })),
    subtotal: cotPop.subtotal,
    descuento: cotPop.descuento,
    impuesto: cotPop.impuesto,
    total: cotPop.total,
    observaciones: cotPop.observaciones,
  };

  try {
    console.log("Generating PDF...");
    const pdf = await generarPDFCotizacion(datos);
    console.log("PDF generated, size:", pdf.length);
  } catch (err) {
    console.error("Error generating PDF:", err);
  }
  process.exit(0);
}

run().catch(console.error);
