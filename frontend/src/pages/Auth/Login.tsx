import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Palette, Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import api from '../../lib/api';
import { useAuthStore } from '../../store/auth.store';

interface LoginForm { email: string; password: string; }

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>();
  const [loading, setLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const onSubmit = async (data: LoginForm) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', data);
      const { user, accessToken, refreshToken } = res.data;
      setAuth(user, accessToken, refreshToken);
      toast.success(`¡Bienvenido, ${user.nombre}!`);
      navigate('/dashboard');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      toast.error(err.response?.data?.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-dark flex items-center justify-center relative overflow-hidden bg-mesh">
      {/* Background decorations */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-info/5 rounded-full blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="w-full max-w-md mx-4"
      >
        {/* Logo */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 shadow-glow-lg animate-float">
            <Palette className="w-8 h-8 text-dark" strokeWidth={2.5} />
          </div>
          <h1 className="text-3xl font-bold text-white">
            PUBLI<span className="text-primary">ART</span>
          </h1>
          <p className="text-text-muted text-sm mt-1">Studio ERP — Iniciar sesión</p>
        </motion.div>

        {/* Card */}
        <motion.div
          className="card-glass p-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="label">Correo electrónico</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  {...register('email', { required: 'Correo requerido' })}
                  type="email"
                  placeholder="admin@publiart.co"
                  className="input pl-10"
                  autoComplete="email"
                />
              </div>
              {errors.email && <p className="text-error text-xs mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="label">Contraseña</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-dim" />
                <input
                  {...register('password', { required: 'Contraseña requerida' })}
                  type="password"
                  placeholder="••••••••"
                  className="input pl-10"
                  autoComplete="current-password"
                />
              </div>
              {errors.password && <p className="text-error text-xs mt-1">{errors.password.message}</p>}
            </div>

            <motion.button
              type="submit"
              disabled={loading}
              className="btn-primary w-full justify-center mt-2"
              whileTap={{ scale: 0.97 }}
              whileHover={{ scale: 1.01 }}
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  Ingresar al sistema
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-6 pt-5 border-t border-border">
            <p className="text-xs text-text-dim text-center">
              Usuario inicial: <span className="text-primary">admin@publiart.co</span> / <span className="text-primary">publiart2024</span>
            </p>
          </div>
        </motion.div>

        <p className="text-center text-xs text-text-dim mt-4">
          Sistema privado PUBLIART © {new Date().getFullYear()}
        </p>
      </motion.div>
    </div>
  );
}
