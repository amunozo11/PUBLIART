/**
 * Motor de fórmulas de precios de producción PUBLIART
 *
 * Las medidas que llegan a estas funciones están SIEMPRE en cm.
 *
 * Fórmulas por máquina (resultado en COP):
 *   laser          : ancho(cm) × alto(cm) × 20
 *   dtf            : largo/ancho(cm) × 0.16
 *   banner         : alto(cm) × ancho(cm) × 1.2
 *   vinilo         : alto(cm) × ancho(cm) × 1.2
 *   corteSticker   : alto(cm) × ancho(cm) × 2.1
 *   laminado       : alto(cm) × ancho(cm) × 2.1
 *   instalacion    : precio fijo desde configuración
 *
 * Mínimo: si el resultado < 6.000 → aplicar mínimo de 10.000 COP
 */

const VALOR_MINIMO_UMBRAL = 6000;
const VALOR_MINIMO = 10000;

export interface FormulaVars {
  /** Alto en cm */
  alto: number;
  /** Ancho en cm (para DTF es el "largo") */
  ancho: number;
  /** Precio base desde configuración (para instalación u otros) */
  precio?: number;
  cantidad?: number;
}

export interface ValorCalculado {
  valor: number;
  formula: string;
  aplicoMinimo: boolean;
}

/**
 * Calcula el valor de un trabajo según el tipo de máquina.
 * Aplica el valor mínimo si el resultado es menor al umbral.
 */
export const calcularValorPorTipo = (
  tipo: string,
  vars: FormulaVars
): ValorCalculado => {
  const { alto, ancho, precio = 0, cantidad = 1 } = vars;

  let valor = 0;
  let formula = '';

  const tipoNorm = tipo.toLowerCase().replace(/[_\s]/g, '');

  switch (tipoNorm) {
    case 'laser':
      valor = ancho * alto * 20;
      formula = `${ancho} × ${alto} × 20`;
      break;

    case 'dtf':
      // DTF: solo se usa el "largo" = ancho del archivo
      valor = ancho * 0.16;
      formula = `${ancho} × 0.16`;
      break;

    case 'banner':
      valor = alto * ancho * 1.2;
      formula = `${alto} × ${ancho} × 1.2`;
      break;

    case 'vinilo':
    case 'plottervino':
    case 'plottervinilo':
      valor = alto * ancho * 1.2;
      formula = `${alto} × ${ancho} × 1.2`;
      break;

    case 'cortesticker':
    case 'sticker':
    case 'corte':
      valor = alto * ancho * 2.1;
      formula = `${alto} × ${ancho} × 2.1`;
      break;

    case 'laminado':
    case 'laminacion':
      valor = alto * ancho * 2.1;
      formula = `${alto} × ${ancho} × 2.1`;
      break;

    case 'instalacion':
    case 'instalación':
      // Precio fijo configurado
      valor = precio * (cantidad || 1);
      formula = `Precio fijo: ${precio}`;
      break;

    default:
      valor = alto * ancho * 1.2;
      formula = `${alto} × ${ancho} × 1.2 (por defecto)`;
      break;
  }

  const aplicoMinimo = valor < VALOR_MINIMO_UMBRAL && valor > 0;
  const valorFinal = aplicoMinimo ? VALOR_MINIMO : Math.round(valor);

  return { valor: valorFinal, formula, aplicoMinimo };
};

/**
 * Compatibilidad con código anterior que pasa alto/ancho en METROS.
 * Convierte a cm internamente.
 */
export const calcularValor = async (
  tipo: string,
  vars: { alto: number; ancho: number; precio: number; material?: number; tiempo?: number; cantidad?: number }
): Promise<number> => {
  // El watcher llama con metros (lo convierte), el modal manual llama con cm
  // Para mantener compatibilidad asumimos que si alto < 20 son metros, si > 20 son cm
  const altoCm = vars.alto > 20 ? vars.alto : vars.alto * 100;
  const anchoCm = vars.ancho > 20 ? vars.ancho : vars.ancho * 100;

  const result = calcularValorPorTipo(tipo, {
    alto: altoCm,
    ancho: anchoCm,
    precio: vars.precio,
    cantidad: vars.cantidad,
  });

  return result.valor;
};
