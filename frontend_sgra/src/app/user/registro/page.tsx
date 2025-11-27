'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { User, Mail, Lock, CreditCard, ArrowRight, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';
import Swal from 'sweetalert2';

// IMPORTA TU COMPONENTE DE TEMA
import ThemeToggle from '@/components/ThemeToggle'; 

// IMPORTA TU SERVICIO
import { registroUsuario } from '@/hooks/ServiceCuenta'; 

export default function RegisterPage() {
  const router = useRouter();
  
  const [formData, setFormData] = useState({
    nombre: '',
    apellido: '',
    cedula: '',
    correo: '',
    contrasena: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    console.log("hola")
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const respuesta = await registroUsuario(formData);

if (respuesta && respuesta.cuenta_id) {
  Swal.fire({
    title: "¡Cuenta creada con éxito!",
    text: "Por favor inicia sesión.",
    icon: "success",
    confirmButtonText: "Aceptar"
  }).then(() => {
    router.push('/');
  });
}else {
        setError(respuesta.mensaje || "Error al registrar usuario.");
      }
    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/20 p-4 relative">
      
      {/* --- BOTÓN DE TEMA (Esquina Superior Derecha) --- */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Tarjeta del Formulario */}
      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 animate-in fade-in zoom-in duration-300">
        
        {/* Encabezado */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">Solicitud para nueva cuenta</h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresa tus datos para registrar tu peticion y pronto el administrador la aceptará
          </p>
        </div>

        {/* Mensaje de Error */}
        {error && (
            <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                {error}
            </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Nombre</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  name="nombre"
                  placeholder="Juan"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground ml-1">Apellido</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  name="apellido"
                  placeholder="Pérez"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Cédula */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Cédula</label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                name="cedula"
                placeholder="110XXXXXXX"
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Correo */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Correo Electrónico</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type="email"
                name="correo"
                placeholder="juan@ejemplo.com"
                className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1">
            <label className="text-xs font-medium text-muted-foreground ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type={showPassword ? "text" : "password"}
                name="contrasena"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                onChange={handleChange}
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Botón Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={18} className="animate-spin" /> Registrando...
              </>
            ) : (
              <>
                Crear Cuenta <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        {/* Footer / Login */}
        <div className="mt-6 text-center text-sm text-muted-foreground">
          ¿Ya tienes una cuenta?{' '}
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>

      </div>
    </div>
  );
}