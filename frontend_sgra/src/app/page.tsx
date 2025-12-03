'use client';

import { useState, useCallback } from 'react';
import { Mail, Lock, LucideIcon } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { inicio_sesion } from '../hooks/Autenticacion'; // Asume que devuelve Promise<LoginResponse>
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import mensajes from '../components/Mensajes'; // Función para mostrar notificaciones (toasts/alerts)
import type { FormEvent, ChangeEvent } from 'react';

// --- 1. DEFINICIÓN DE TIPOS ---

/**
 * Define la estructura de la respuesta esperada del backend tras el login.
 */
interface LoginResponse {
  code: number;
  msg: string;
  role?: "ADMIN" | "USER"; // Tipado estricto para los roles
}

/**
 * Define los props para el componente de campo de entrada reutilizable.
 */
interface InputFieldProps {
  label: string;
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  Icon: LucideIcon;
  required?: boolean;
  maxLength?: number; // Límite de caracteres para seguridad y UX
}

// --- 2. COMPONENTE REUTILIZABLE: InputField ---

const InputField: React.FC<InputFieldProps> = ({ 
  label, 
  type, 
  placeholder, 
  value, 
  onChange, 
  Icon, 
  required = false,
  maxLength 
}) => {
  // Manejo de la validación nativa del navegador (UX)
  const handleInvalid = (e: FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity(`Por favor ingresa tu ${label.toLowerCase()}`);
  };

  const handleInput = (e: FormEvent<HTMLInputElement>) => {
    (e.target as HTMLInputElement).setCustomValidity("");
  };

  return (
    <div>
      <label className="text-sm text-muted-foreground">{label}</label>
      <div className="relative mt-1">
        <Icon size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type={type}
          className="input-field pl-10"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required={required}
          onInvalid={handleInvalid}
          onInput={handleInput}
          maxLength={maxLength} // Aplicación del límite de caracteres
          // Mejoras de Accesibilidad y Autocompletado (seguridad y UX)
          autoComplete={type === 'email' ? 'email' : (type === 'password' ? 'current-password' : 'off')}
        />
      </div>
    </div>
  );
};

// --- 3. COMPONENTE PRINCIPAL: LoginPage ---

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = useCallback(async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isLoading) return; 

    setIsLoading(true);
    
    const data = { correo: email, contrasena: contrasena };

    try {
      const info: LoginResponse = await inicio_sesion(data);

      if (info.code === 200) {
        mensajes(info.msg, "Has Ingresado al Sistema", "success");
        
        const path = info.role === "ADMIN" ? "/admin/lista" : "/user/principal";
        router.push(path);
      } else {
        // CAMBIO CLAVE: Mensaje de error genérico
        mensajes("Usuario o contraseña inválidos. Por favor, verifica tus credenciales.", "Error de Inicio de Sesión", "error");
        // Aunque la respuesta 'info.msg' del backend contenga el error específico,
        // el frontend solo muestra este mensaje genérico.
      }
    } catch (err) {
      // ... (Manejo de error de conexión/red)
      if (process.env.NEXT_PUBLIC_DEBUG_MODE === 'true') {
        console.error("Error en inicio_sesion:", err); 
      }
      mensajes("Error de conexión al servidor. Intenta de nuevo.", "Error de Conexión", "error");
    } finally {
      setIsLoading(false);
    }
  }, [email, contrasena, isLoading, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      
      {/* Switch de Tema */}
      <div className="absolute top-4 right-4 z-10">
        <ThemeToggle />
      </div>

      {/* Card del Login */}
      <div className="w-full max-w-md bg-card border border-border shadow-2xl rounded-xl p-8">

        {/* Títulos */}
        <h1 className="text-3xl font-extrabold text-center text-foreground mb-1">
          Iniciar Sesión
        </h1>
        <p className="text-center text-muted-foreground mb-6">
          Bienvenido al sistema SGRA
        </p>

        {/* FORMULARIO */}
        <form onSubmit={handleLogin} className="space-y-5">

          {/* CORREO (Límite: 254) */}
          <InputField 
            label="Correo" 
            type="email" 
            placeholder="correo@ejemplo.com" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            Icon={Mail} 
            required={true}
            maxLength={254}
          />

          {/* CONTRASEÑA (Límite: 100) */}
          <InputField 
            label="Contraseña" 
            type="password" 
            placeholder="Ingresa tu contraseña" 
            value={contrasena} 
            onChange={(e) => setContrasena(e.target.value)} 
            Icon={Lock} 
            required={true}
            maxLength={100}
          />

          {/* BOTÓN (con estado de carga) */}
          <button
            type="submit"
            className="btn-primary w-full py-2 flex justify-center items-center text-lg font-semibold transition duration-200"
            disabled={isLoading} 
          >
            {/* Indicador de carga */}
            {isLoading ? (
              <svg className="animate-spin h-5 w-5 mr-3 text-white" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Iniciar Sesión'}
          </button>
        </form>

        {/* ENLACES ADICIONALES */}
        <div className="mt-8 text-center text-sm text-muted-foreground space-y-3">
          
          <div>
            ¿Olvidaste tu contraseña?{' '}
            <span className="text-green-600 font-medium cursor-pointer hover:text-green-500 transition-colors">
              Contactate con el administrador
            </span>
          </div>

          <div>
            ¿Aún no estas registrado?{' '}
            <Link href="/user/registro" className="text-blue-600 hover:underline font-medium transition-colors">
              Envia una solicitud de registro
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}