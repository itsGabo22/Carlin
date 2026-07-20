'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createBrowserClient } from '@supabase/ssr';
import { Eye, EyeOff } from 'lucide-react';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Generic error message for security
        setError('Credenciales incorrectas');
        setLoading(false);
        return;
      }

      if (data.user?.user_metadata?.role !== 'admin') {
        await supabase.auth.signOut();
        setError('No tienes permisos de administrador.');
        setLoading(false);
        return;
      }

      router.push('/admin');
      router.refresh();
    } catch (err) {
      setError('Error de conexión');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2d0a14] to-[#1a0008] flex items-center justify-center p-4">
      <div className="bg-white/[0.05] border border-brand-pink/20 p-8 rounded-2xl w-full max-w-md shadow-2xl backdrop-blur-md">
        <div className="text-center mb-8">
          <h1 className="font-pacifico text-5xl text-[#FFBDE1] mb-2">Carlin</h1>
          <p className="text-white/50 font-nunito text-sm">Panel de Administración</p>
          
          <div className="mx-auto w-[60px] h-px bg-brand-pink/30 my-6"></div>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-brand-pink-light font-medium text-sm block">Correo electrónico</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-black/20 border-brand-pink/30 text-white placeholder:text-white/50 h-12 outline-none focus-visible:ring-brand-pink/40"
                required
              />
            </div>
            <div className="space-y-2 relative">
              <label className="text-brand-pink-light font-medium text-sm block">Contraseña</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="bg-black/20 border-brand-pink/30 text-white placeholder:text-white/50 h-12 outline-none focus-visible:ring-brand-pink/40 pr-10"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          </div>

          {error && (
            <p className="text-red-400/90 text-sm text-center font-medium bg-red-950/30 py-2 rounded-lg border border-red-900/30">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-14 bg-brand-pink hover:bg-brand-pink-dark text-[#3D1020] text-lg font-bold transition-all mt-4"
          >
            {loading ? 'Verificando...' : 'Entrar al Panel'}
          </Button>
        </form>
      </div>
    </div>
  );
}
