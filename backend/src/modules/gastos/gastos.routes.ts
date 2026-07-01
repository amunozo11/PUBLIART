import { Router } from 'express';
import * as GastosController from './gastos.controller';
import { authenticate } from '../../middleware/auth.middleware';

const router = Router();

router.use(authenticate);

router.get('/', GastosController.getAll);
router.post('/', GastosController.create);
router.put('/:id', GastosController.update);
router.delete('/:id', GastosController.remove);

export default router;
