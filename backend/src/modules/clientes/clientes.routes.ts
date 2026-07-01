import { Router } from 'express';
import * as ClientesController from './clientes.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);

router.get('/', ClientesController.getClientes);
router.get('/:id/resumen', ClientesController.getResumenCliente);
router.get('/:id/historial', ClientesController.getHistorialCliente);
router.get('/:id', ClientesController.getClienteById);
router.post('/', ClientesController.createCliente);
router.post('/:id/trabajo', ClientesController.createTrabajoParaCliente);
router.post('/:id/foto', ClientesController.upload.single('foto'), ClientesController.uploadFoto);
router.put('/:id', ClientesController.updateCliente);
router.delete('/:id', ClientesController.deleteCliente);

export default router;

