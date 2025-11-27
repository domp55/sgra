'use client';

import { useState } from 'react';
import { Mail, Lock } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: any) => {
    e.preventDefault();
    console.log("Login:", email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">

      {/* Switch de Tema arriba a la derecha */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card del Login */}
      <div className="w-full max-w-md bg-card border border-border shadow-md rounded-xl p-8">

        {/* Títulos */}
        <h1 className="text-2xl font-bold text-center text-foreground">
          Iniciar Sesión
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Bienvenido al sistema SGRA
        </p>

        {/* FORM */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* CORREO */}
          <div>
            <label className="text-sm text-muted-foreground">Correo</label>
            <div className="relative mt-1">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                className="input-field pl-10"
                placeholder="correo@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          {/* CONTRASEÑA */}
          <div>
            <label className="text-sm text-muted-foreground">Contraseña</label>
            <div className="relative mt-1">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="password"
                className="input-field pl-10"
                placeholder="Ingresa tu contraseña"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          {/* BOTÓN */}
          <button 
            type="submit"
            className="btn-primary w-full py-2 flex justify-center"
          >
            Iniciar Sesión
          </button>
        </form>

        {/* Recuperar */}
<div className="mt-6 text-center text-sm text-muted-foreground">
  ¿Olvidaste tu contraseña?   
  <span className="text-green-600 font-medium">
     Contactate con el administrador
  </span>
</div>

        
<div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Aún no estas registrado?{' '}
          <Link href="/user/registro" className="text-blue-600 hover:underline font-medium">
            Envia una solicitud de registro
          </Link>
        </div>
      </div>
    </div>
  );
}
