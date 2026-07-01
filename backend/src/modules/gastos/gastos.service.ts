import { Gasto } from './gasto.model';
import { createError } from '../../middleware/error.middleware';

export const getGastos = async (query: Record<string, string>) => {
  const { categoria, page = '1', limit = '20', startDate, endDate } = query;
  
  const filter: any = {};
  if (categoria) filter.categoria = categoria;
  
  if (startDate || endDate) {
    filter.fecha = {};
    if (startDate) filter.fecha.$gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter.fecha.$lte = end;
    }
  }

  const total = await Gasto.countDocuments(filter);
  const gastos = await Gasto.find(filter)
    .populate('creadoPor', 'nombre')
    .sort({ fecha: -1, createdAt: -1 })
    .skip((parseInt(page) - 1) * parseInt(limit))
    .limit(parseInt(limit));

  return { gastos, total, page: parseInt(page), totalPages: Math.ceil(total / parseInt(limit)) };
};

export const createGasto = async (data: Record<string, unknown>, userId: string) => {
  return Gasto.create({
    ...data,
    creadoPor: userId,
  });
};

export const updateGasto = async (id: string, data: Record<string, unknown>) => {
  const gasto = await Gasto.findByIdAndUpdate(id, data, { new: true });
  if (!gasto) throw createError('Gasto no encontrado', 404);
  return gasto;
};

export const deleteGasto = async (id: string) => {
  const gasto = await Gasto.findByIdAndDelete(id);
  if (!gasto) throw createError('Gasto no encontrado', 404);
  return gasto;
};
