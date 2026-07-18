'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

export default function AdminLoginPage() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin }),
      });

      if (res.ok) {
        router.push('/admin');
        router.refresh();
      } else {
        const data = await res.json();
        setError(data.error || 'Error al iniciar sesión');
      }
    } catch (err) {
      setError('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#3D1020] to-[#1a0510] flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md border border-white/20 p-8 rounded-2xl w-full max-w-sm shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="font-pacifico text-4xl text-brand-pink-light mb-2">Carlin</h1>
          <p className="text-white/70 font-nunito text-sm">Panel de Administración</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <Input
              type="password"
              placeholder="PIN de acceso"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="bg-white/5 border-white/20 text-white placeholder:text-white/50 text-center text-xl tracking-[0.5em] h-14"
              required
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm text-center font-medium bg-red-950/50 py-2 rounded-lg border border-red-900/50">
              {error}
            </p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-brand-pink hover:bg-brand-pink-dark text-white text-lg font-bold transition-all shadow-[0_0_20px_rgba(251,156,208,0.3)] hover:shadow-[0_0_30px_rgba(251,156,208,0.5)]"
          >
            {loading ? 'Entrando...' : 'Entrar al Panel'}
          </Button>
        </form>
      </div>
    </div>
  );
}
