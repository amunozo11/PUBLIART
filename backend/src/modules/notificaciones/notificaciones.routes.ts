import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Notificacion } from './notificacion.model';
import mongoose from 'mongoose';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const notificaciones = await Notificacion.find({
      $or: [
        { global: true },
        { 'destinatarios.usuario': new mongoose.Types.ObjectId(userId) },
      ],
    }).sort({ createdAt: -1 }).limit(50);

    res.json({ success: true, notificaciones });
  } catch { res.status(500).json({ success: false, message: 'Error' }); }
});

router.patch('/:id/leer', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    await Notificacion.findByIdAndUpdate(req.params.id, {
      $set: { 'destinatarios.$[elem].leida': true, 'destinatarios.$[elem].leidaEn': new Date() },
    }, { arrayFilters: [{ 'elem.usuario': new mongoose.Types.ObjectId(userId) }] });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false, message: 'Error' }); }
});

export default router;
