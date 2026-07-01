import { Router } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { roles } from '../../middleware/roles.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Response } from 'express';
import { Usuario } from '../auth/auth.model';

const router = Router();
router.use(authenticate);

router.get('/', async (_req, res: Response) => {
  try {
    const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 });
    res.json({ success: true, usuarios });
  } catch { res.status(500).json({ success: false }); }
});

router.post('/', roles('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const u = await Usuario.create(req.body);
    res.status(201).json({ success: true, usuario: u });
  } catch (e: unknown) {
    const err = e as { message?: string };
    res.status(400).json({ success: false, message: err.message });
  }
});

router.put('/:id', roles('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const u = await Usuario.findByIdAndUpdate(req.params.id, req.body, { new: true }).select('-password');
    res.json({ success: true, usuario: u });
  } catch { res.status(500).json({ success: false }); }
});

router.delete('/:id', roles('admin'), async (req: AuthRequest, res: Response) => {
  try {
    await Usuario.findByIdAndUpdate(req.params.id, { activo: false });
    res.json({ success: true });
  } catch { res.status(500).json({ success: false }); }
});

export default router;
