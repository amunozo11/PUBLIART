import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Configuracion } from './configuracion.model';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res: Response) => {
  try {
    let config = await Configuracion.findOne();
    if (!config) config = await Configuracion.create({});
    res.json({ success: true, configuracion: config });
  } catch { res.status(500).json({ success: false, message: 'Error' }); }
});

router.put('/', async (req: AuthRequest, res: Response) => {
  try {
    let config = await Configuracion.findOne();
    if (!config) config = await Configuracion.create(req.body);
    else {
      Object.assign(config, req.body);
      await config.save();
    }
    res.json({ success: true, configuracion: config });
  } catch { res.status(500).json({ success: false, message: 'Error' }); }
});

export default router;
