import { Router } from 'express';
import { Response } from 'express';
import { authenticate } from '../../middleware/auth.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import { Auditoria } from './auditoria.model';

const router = Router();
router.use(authenticate);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { modulo, accion, usuario, startDate, endDate, search, page = '1', limit = '50' } = req.query as Record<string, string>;
    const filter: Record<string, any> = {};
    if (modulo) filter.modulo = modulo;
    if (accion) filter.accion = accion;
    if (usuario) filter.usuario = usuario;
    
    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.createdAt.$lte = end;
      }
    }
    
    if (search) {
      filter.$or = [
        { accion: { $regex: search, $options: 'i' } },
        { modulo: { $regex: search, $options: 'i' } },
        { entidadId: { $regex: search, $options: 'i' } }
      ];
    }

    const total = await Auditoria.countDocuments(filter);
    const registros = await Auditoria.find(filter)
      .populate('usuario', 'nombre email')
      .sort({ createdAt: -1 })
      .skip((parseInt(page) - 1) * parseInt(limit))
      .limit(parseInt(limit));

    res.json({ success: true, registros, total });
  } catch { res.status(500).json({ success: false, message: 'Error' }); }
});

export default router;
