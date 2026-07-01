import path from 'path';

export interface ParsedFileName {
  alto: number;
  ancho: number;
  unidad: 'cm' | 'm';
  metrosCuadrados: number;
  clienteNombre: string;
  extension: string;
  nombreOriginal: string;
}

/**
 * Parsea nombres de archivo con formato: "120x150 Nombre Cliente.pdf"
 * Soporta: 120x150, 120X150, 1.2x1.5, 120x150cm, 1.2x1.5m
 */
export const parseFileName = (fileName: string): ParsedFileName | null => {
  const baseName = path.basename(fileName);
  const nameWithoutExt = baseName.replace(/\.[^/.]+$/, '');
  const extension = path.extname(baseName).slice(1).toLowerCase();

  // Regex: medidas al inicio, luego nombre
  const regex = /^(\d+(?:[.,]\d+)?)\s*[xX×]\s*(\d+(?:[.,]\d+)?)\s*(cm|m)?\s+(.+)$/;
  const match = nameWithoutExt.match(regex);

  if (!match) {
    // Sin medidas — nombre del cliente completo
    return {
      alto: 0,
      ancho: 0,
      unidad: 'cm',
      metrosCuadrados: 0,
      clienteNombre: nameWithoutExt.trim(),
      extension,
      nombreOriginal: baseName,
    };
  }

  // Reemplazar coma por punto para parseo (formato colombiano)
  let alto = parseFloat(match[1].replace(',', '.'));
  let ancho = parseFloat(match[2].replace(',', '.'));
  const unidadRaw = match[3]?.toLowerCase() || '';
  const clienteNombre = match[4].trim();

  const unidad: 'cm' | 'm' = unidadRaw === 'm' ? 'm' : 'cm';

  let metrosCuadrados: number;
  if (unidad === 'cm') {
    metrosCuadrados = (alto / 100) * (ancho / 100);
  } else {
    metrosCuadrados = alto * ancho;
  }

  // Si sin unidad y valores > 10, probablemente son cm
  if (!match[3] && alto > 10 && ancho > 10) {
    metrosCuadrados = (alto / 100) * (ancho / 100);
  }

  return {
    alto,
    ancho,
    unidad,
    metrosCuadrados: Math.round(metrosCuadrados * 10000) / 10000,
    clienteNombre,
    extension,
    nombreOriginal: baseName,
  };
};

/**
 * Detecta la máquina, tipo y carpeta origen según la RUTA del archivo.
 *
 * Estructura esperada de carpetas de producción:
 *   PRODUCCION/
 *     Plotter Vinilo/  ← carpeta de máquina
 *       Junio/         ← mes
 *         28/          ← día
 *           archivo.pdf
 *     Plotter Banner/
 *     Laser/
 *     DTF/
 *
 * Se detecta la máquina buscando el nombre de la carpeta de máquina
 * en cualquier parte de la ruta (compatible con rutas variables).
 */
export const getMaquinaFromPath = (filePath: string): {
  maquina: string;
  tipo: string;
  carpetaOrigen: string;
} => {
  const normalized = filePath.replace(/\\/g, '/').toLowerCase();

  // Detectar por segmentos de carpeta (buscamos los primeros segmentos relevantes)
  const segments = normalized.split('/');

  for (const seg of segments) {
    // Plotter Vinilo / Vinilo
    if (seg.includes('plotter vinilo') || seg === 'vinilo' || (seg.includes('vinilo') && !seg.includes('banner'))) {
      return { maquina: 'plotterVinilo', tipo: 'vinilo', carpetaOrigen: 'Plotter Vinilo' };
    }
    // Plotter Banner / Banner
    if (seg.includes('plotter banner') || seg === 'banner' || seg.includes('banner')) {
      return { maquina: 'plotterBanner', tipo: 'banner', carpetaOrigen: 'Plotter Banner' };
    }
    // DTF
    if (seg === 'dtf') {
      return { maquina: 'dtf', tipo: 'dtf', carpetaOrigen: 'DTF' };
    }
    // Laser / Láser
    if (seg.includes('laser') || seg.includes('láser') || seg.includes('laser')) {
      return { maquina: 'laser', tipo: 'laser', carpetaOrigen: 'Laser' };
    }
    // Laminado / Laminación
    if (seg.includes('laminado') || seg.includes('laminaci')) {
      return { maquina: 'laminado', tipo: 'laminado', carpetaOrigen: 'Laminado' };
    }
    // Corte / Corte Sticker
    if (seg.includes('corte') || seg.includes('sticker')) {
      return { maquina: 'corteSticker', tipo: 'corteSticker', carpetaOrigen: 'Corte Sticker' };
    }
    // Instalación
    if (seg.includes('instalaci')) {
      return { maquina: 'instalacion', tipo: 'instalacion', carpetaOrigen: 'Instalación' };
    }
  }

  // También intentar con la ruta completa (compatibilidad hacia atrás)
  if (normalized.includes('plotter vinilo') || (normalized.includes('vinilo') && !normalized.includes('banner'))) {
    return { maquina: 'plotterVinilo', tipo: 'vinilo', carpetaOrigen: 'Plotter Vinilo' };
  }
  if (normalized.includes('plotter banner') || normalized.includes('banner')) {
    return { maquina: 'plotterBanner', tipo: 'banner', carpetaOrigen: 'Plotter Banner' };
  }
  if (normalized.includes('/dtf/') || normalized.includes('\\dtf\\')) {
    return { maquina: 'dtf', tipo: 'dtf', carpetaOrigen: 'DTF' };
  }
  if (normalized.includes('laser') || normalized.includes('láser')) {
    return { maquina: 'laser', tipo: 'laser', carpetaOrigen: 'Laser' };
  }
  if (normalized.includes('laminad')) {
    return { maquina: 'laminado', tipo: 'laminado', carpetaOrigen: 'Laminado' };
  }
  if (normalized.includes('corte') || normalized.includes('sticker')) {
    return { maquina: 'corteSticker', tipo: 'corteSticker', carpetaOrigen: 'Corte Sticker' };
  }

  return { maquina: 'plotterVinilo', tipo: 'otro', carpetaOrigen: 'General' };
};
