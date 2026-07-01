import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import path from 'path';
import fs from 'fs';

export interface PDFDatos {
  numero: number;
  fecha: Date;
  validezDias?: number;
  cliente: {
    nombre?: string;
    nit?: string;
    telefono?: string;
    direccion?: string;
    ciudad?: string;
    correo?: string;
  };
  items: Array<{
    cantidad: number;
    descripcion: string;
    ancho?: number;
    alto?: number;
    valorUnitario: number;
    subtotal: number;
  }>;
  subtotal: number;
  descuento: number;
  impuesto: number;
  total: number;
  observaciones?: string;
}

const formatFecha = (d: Date): string => {
  if (!d || isNaN(d.getTime())) d = new Date();
  return d.toLocaleDateString('es-CO', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatNumber = (num: number): string => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(num);
};

export const generarPDFCotizacion = async (datos: PDFDatos, tipo: 'COTIZACIÓN' | 'FACTURA' = 'COTIZACIÓN'): Promise<Buffer> => {
  // Cargar plantilla base
  const plantillaPath = path.join(process.cwd(), '..', 'plantilla-cotizacion.pdf');
  if (!fs.existsSync(plantillaPath)) {
    throw new Error('No se encontró el archivo plantilla-cotizacion.pdf en la raíz del proyecto.');
  }
  const plantillaBytes = fs.readFileSync(plantillaPath);
  const pdfDoc = await PDFDocument.load(plantillaBytes);
  pdfDoc.registerFontkit(fontkit);

  // Cargar fuente
  let customFont;
  const fontPath = path.join(process.cwd(), 'uploads', 'champagne.ttf');
  if (fs.existsSync(fontPath)) {
    const fontBytes = fs.readFileSync(fontPath);
    customFont = await pdfDoc.embedFont(fontBytes);
  } else {
    // Fallback si no está la fuente en uploads/champagne.ttf
    customFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  }

  const pages = pdfDoc.getPages();
  const page = pages[0];
  const { height, width } = page.getSize();

  // Helpers para dibujar texto. pdf-lib usa Y desde ABAJO. height - y = Y desde arriba.
  const drawText = (text: string, x: number, yInverted: number, size = 11, options: any = {}) => {
    page.drawText(text, {
      x,
      y: height - yInverted,
      size,
      font: customFont,
      color: rgb(0.1, 0.1, 0.1), // Gris oscuro / Negro
      ...options
    });
  };

  // 1. Fecha y Hora Factura
  drawText(formatFecha(new Date(datos.fecha)), 400, 135, 14);

  // 2. Datos del cliente
  drawText((datos.cliente.nombre || '').toUpperCase(), 155, 160, 14);
  drawText(datos.cliente.nit || '000000000', 155, 180, 14);
  drawText((datos.cliente.direccion || '').toUpperCase(), 155, 190, 14);

  drawText(datos.cliente.telefono || '0000000', 412, 180, 14);
  drawText((datos.cliente.ciudad || 'VALLEDUPAR').toUpperCase(), 412, 201, 14);

  // 3. Tabla de Productos
  let startY = 279;
  const rowHeight = 22.8; // Altura de fila aprox

  datos.items.forEach((item, index) => {
    if (index >= 14) return; // Límite de la plantilla
    const y = startY + (index * rowHeight);

    // No dibujar cantidad en la columna de índice
    drawText((item.descripcion || '').toUpperCase(), 75, y, 14);
    drawText(formatNumber(item.valorUnitario), 345, y, 14);
    drawText(String(item.cantidad), 445, y, 14);
    drawText(formatNumber(item.subtotal), 505, y, 14);
  });

  // 4. Totales
  drawText(formatNumber(datos.subtotal), 450, 575, 14);
  const abono = 0; // O si hay pago, ponerlo
  drawText(formatNumber(abono), 450, 595, 14);

  // Total a pagar
  drawText(formatNumber(datos.total), 450, 614, 14, { color: rgb(1, 1, 1) }); // Blanco

  const pdfBytes = await pdfDoc.save();
  return Buffer.from(pdfBytes);
};
