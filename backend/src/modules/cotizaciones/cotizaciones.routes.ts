import { Router } from 'express';
import * as C from './cotizaciones.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.get('/:id/pdf', C.generarPDF);

router.use(authenticate);

router.get('/', C.getAll);
router.get('/:id', C.getById);
router.post('/', C.create);
router.put('/:id', C.update);
router.post('/:id/convertir', C.convertirAFactura);
router.post('/:id/duplicar', C.duplicar);

export default router;

