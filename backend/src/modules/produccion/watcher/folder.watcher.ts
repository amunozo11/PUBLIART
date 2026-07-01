import chokidar from 'chokidar';
import path from 'path';
import { Server as SocketServer } from 'socket.io';
import { logger } from '../../../config/logger';
import { parseFileName, getMaquinaFromPath } from '../parser/filename.parser';
import { calcularValorPorTipo } from '../parser/formula.engine';
import { TrabajoProduccion } from '../trabajo.model';
import { findOrCreateCliente, findClienteSimilar } from '../../clientes/clientes.service';
import { Notificacion } from '../../notificaciones/notificacion.model';

const PRODUCCION_PATH = process.env.PRODUCCION_PATH || 'D:/PRODUCCION';
const VALID_EXTENSIONS = ['.pdf', '.ai', '.cdr', '.psd', '.svg', '.png', '.jpg', '.eps', '.dxf', '.plt'];

export const startFolderWatcher = (io: SocketServer) => {
  logger.info(`📁 Iniciando monitoreo de carpeta: ${PRODUCCION_PATH}`);

  const watcher = chokidar.watch(PRODUCCION_PATH, {
    ignored: /(^|[\/\\])\../,
    persistent: true,
    ignoreInitial: true,
    // Observar subdirectorios recursivamente (Máquina/Mes/Día/archivos)
    depth: 99,
    awaitWriteFinish: {
      stabilityThreshold: 2000,
      pollInterval: 500,
    },
  });

  watcher.on('add', async (filePath: string) => {
    const ext = path.extname(filePath).toLowerCase();
    if (!VALID_EXTENSIONS.includes(ext)) return;

    // Ignorar archivos en la raíz de la carpeta de producción (solo procesar los de subcarpetas de máquina)
    const relativePath = filePath.replace(PRODUCCION_PATH, '').replace(/^[\/\\]/, '');
    const parts = relativePath.split(/[\/\\]/);
    if (parts.length < 2) {
      logger.info(`⚠️ Archivo en raíz ignorado (debe estar en carpeta de máquina): ${filePath}`);
      return;
    }

    logger.info(`📄 Nuevo archivo detectado: ${filePath}`);

    try {
      await processNewFile(filePath, io);
    } catch (error) {
      logger.error(`❌ Error procesando archivo ${filePath}:`, error);
    }
  });

  watcher.on('error', (error: Error) => logger.error('❌ Error en watcher:', error));
  watcher.on('ready', () => logger.info('✅ Watcher listo y monitoreando'));

  return watcher;
};

async function processNewFile(filePath: string, io: SocketServer) {
  const fileName = path.basename(filePath);
  const parsed = parseFileName(fileName);
  const { maquina, tipo, carpetaOrigen } = getMaquinaFromPath(filePath);

  // ── Resolución de cliente con fuzzy matching ──────────────────────────────
  let clienteId: string | null = null;
  let clienteNombre = 'SIN ASIGNAR';
  let esSinCliente = false;
  let clienteMatchScore = 0;
  let clienteAutoAsignado = false;

  const nombreParseado = parsed?.clienteNombre?.trim();

  if (nombreParseado && nombreParseado.length > 0) {
    try {
      // Primero intentar match exacto
      const matchResult = await findClienteSimilar(nombreParseado);

      if (matchResult && matchResult.score >= 0.75) {
        // Match suficientemente similar → asignar automáticamente
        clienteId = matchResult.cliente._id.toString();
        clienteNombre = matchResult.cliente.nombre;
        clienteMatchScore = matchResult.score;
        clienteAutoAsignado = matchResult.score >= 0.95; // match casi exacto
        logger.info(`👤 Cliente ${clienteAutoAsignado ? 'auto-asignado' : 'asignado (similar)'}: "${clienteNombre}" (score: ${matchResult.score.toFixed(2)}) para archivo "${fileName}"`);
      } else {
        // No hay match → dejar sin cliente para asignación manual
        logger.warn(`⚠️ Sin match de cliente para "${nombreParseado}" en "${fileName}" — marcando como SIN CLIENTE`);
        esSinCliente = true;
        clienteNombre = nombreParseado; // Guardar el nombre parseado como referencia
      }
    } catch (err) {
      logger.error('Error buscando cliente similar:', err);
      esSinCliente = true;
    }
  } else {
    logger.warn(`No se pudo parsear nombre de cliente en: ${fileName} — se creará como "sin cliente"`);
    esSinCliente = true;
  }

  // Si no hay cliente, buscar/crear el placeholder genérico
  if (esSinCliente || !clienteId) {
    const placeholder = await findOrCreateCliente('SIN ASIGNAR');
    clienteId = placeholder._id.toString();
    esSinCliente = true;
  }

  // ── Calcular valor con las fórmulas de PUBLIART (medidas en cm) ───────────
  let valor = 0;
  let valorFormula = '';

  if (parsed && (parsed.alto > 0 || parsed.ancho > 0)) {
    // Las medidas del parser ya están en cm
    const altoCm = parsed.unidad === 'm' ? parsed.alto * 100 : parsed.alto;
    const anchoCm = parsed.unidad === 'm' ? parsed.ancho * 100 : parsed.ancho;

    const result = calcularValorPorTipo(tipo, { alto: altoCm, ancho: anchoCm });
    valor = result.valor;
    valorFormula = result.formula + (result.aplicoMinimo ? ' → mínimo 10.000' : '');
  }

  // ── Crear trabajo en BD ───────────────────────────────────────────────────
  const trabajo = await TrabajoProduccion.create({
    archivo: {
      nombre: fileName,
      nombreOriginal: fileName,
      ruta: filePath,
      extension: parsed?.extension || path.extname(filePath).toLowerCase().slice(1),
      carpetaOrigen,
    },
    medidas: parsed && (parsed.alto > 0 || parsed.ancho > 0)
      ? {
          alto: parsed.alto,
          ancho: parsed.ancho,
          unidad: parsed.unidad,
          metrosCuadrados: parsed.metrosCuadrados,
        }
      : { alto: 0, ancho: 0, unidad: 'cm', metrosCuadrados: 0 },
    maquina,
    tipo,
    cliente: clienteId,
    estado: 'pendiente',
    valor,
    valorFormula,
    creadoAutomaticamente: true,
    sinCliente: esSinCliente,
    descripcion: esSinCliente && nombreParseado ? nombreParseado : undefined,
    historialEstados: [{ estado: 'pendiente', fecha: new Date() }],
  });

  const logMsg = `✅ Trabajo creado: ${trabajo._id} | ${maquina} | Cliente: ${clienteNombre} | Valor: $${valor.toLocaleString('es-CO')}${esSinCliente ? ' ⚠️ SIN CLIENTE' : clienteAutoAsignado ? ' ✓ Auto-asignado' : ' ~ Similar'}`;
  logger.info(logMsg);

  // ── Notificación en tiempo real ───────────────────────────────────────────
  io.emit('nuevo-trabajo', {
    trabajo: {
      ...trabajo.toObject(),
      clienteNombre,
      sinCliente: esSinCliente,
      matchScore: clienteMatchScore,
    },
  });

  // ── Notificación persistente ──────────────────────────────────────────────
  const tituloNotif = esSinCliente
    ? '⚠️ Nuevo archivo sin cliente asignado'
    : clienteAutoAsignado
    ? `📄 Nuevo trabajo — ${clienteNombre}`
    : `📄 Nuevo trabajo (cliente similar) — ${clienteNombre}`;

  await Notificacion.create({
    titulo: tituloNotif,
    mensaje: `${fileName} | ${carpetaOrigen}${valor > 0 ? ` | $${valor.toLocaleString('es-CO')}` : ''}${esSinCliente ? '\n📌 Nombre detectado: ' + (nombreParseado || 'desconocido') + ' — asignar cliente manualmente' : ''}`,
    tipo: esSinCliente ? 'warning' : 'info',
    global: true,
    accionUrl: `/produccion`,
  });
}
