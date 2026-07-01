import { Router } from 'express';
import * as F from './facturas.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();
router.use(authenticate);
router.get('/', F.getAll);
router.get('/:id', F.getById);
router.post('/', F.create);
router.get('/:id/pdf', F.generarPDF);
router.post('/:id/pago', F.registrarPago);

export default router;
