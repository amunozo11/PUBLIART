import { Router } from 'express';
import * as P from './produccion.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/calcular-valor', P.calcularValor);
router.get('/', P.getAll);
router.get('/kanban', P.getKanban);
router.get('/:id', P.getById);
router.post('/', P.create);
router.put('/:id', P.update);
router.delete('/:id', P.remove);
router.patch('/:id/estado', P.cambiarEstado);
router.patch('/:id/cobrado', P.toggleCobrado);
router.patch('/:id/cliente', P.asignarCliente);
router.patch('/:id/whatsapp', P.marcarWhatsapp);
router.post('/:id/abrir-explorador', P.abrirEnExplorador);

export default router;
