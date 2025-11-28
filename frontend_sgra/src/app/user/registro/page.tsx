"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Lock,
  CreditCard,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import Swal from "sweetalert2";

import ThemeToggle from "@/components/ThemeToggle";
import { registroUsuario } from "@/hooks/ServiceCuenta";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    cedula: "",
    correo: "",
    contrasena: "",
  });

  const [errors, setErrors] = useState({
    cedula: "",
    correo: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // VALIDACIONES EN TIEMPO REAL
  const validateField = (name: string, value: string) => {
    const newErrors: any = { ...errors };

    if (name === "cedula") {
      if (!/^\d{10}$/.test(value)) {
        newErrors.cedula = "La cédula debe tener exactamente 10 números.";
      } else {
        newErrors.cedula = "";
      }
    }

    if (name === "correo") {
      const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!correoRegex.test(value)) {
        newErrors.correo = "Formato de correo inválido.";
      } else {
        newErrors.correo = "";
      }
    }

    setErrors(newErrors);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;

    if (e.target.name === "cedula") {
      value = value.replace(/\D/g, ""); // solo números
      if (value.length > 10) value = value.slice(0, 10);
    }

    validateField(e.target.name, value);

    setFormData({
      ...formData,
      [e.target.name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // VALIDACIONES FINALES
    if (errors.cedula || errors.correo) {
      setError("Por favor corrige los errores antes de continuar.");
      return;
    }

    if (!/^\d{10}$/.test(formData.cedula)) {
      setError("La cédula debe tener exactamente 10 números.");
      return;
    }

    const correoRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!correoRegex.test(formData.correo)) {
      setError("Por favor ingresa un correo electrónico válido.");
      return;
    }

    try {
      setLoading(true);
      const respuesta = await registroUsuario(formData);

      if (respuesta && respuesta.cuenta_id) {
        Swal.fire({
          title: "¡Cuenta creada con éxito!",
          text: "Por favor inicia sesión.",
          icon: "success",
          confirmButtonText: "Aceptar",
        }).then(() => {
          router.push("/");
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            respuesta.response?.data?.mensaje ||
            "Error al registrar usuario.",
          confirmButtonText: "Aceptar",
        });
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
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-md bg-card border border-border rounded-xl shadow-lg p-8 animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-foreground">
            Solicitud para nueva cuenta
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Ingresa tus datos para registrar tu petición y pronto el
            administrador la aceptará
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-md bg-red-50 text-red-600 text-sm border border-red-200 dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nombres y Apellidos */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium ml-1">Nombre</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  name="nombre"
                  placeholder="Juan"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg"
                  onChange={handleChange}
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium ml-1">Apellido</label>
              <div className="relative">
                <User size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  required
                  name="apellido"
                  placeholder="Pérez"
                  className="w-full pl-10 pr-4 py-2 bg-background border border-input rounded-lg"
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>

          {/* Cédula */}
          <div>
            <label className="text-xs font-medium ml-1">Cédula</label>
            <div className="relative">
              <CreditCard size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                name="cedula"
                inputMode="numeric"
                placeholder="110XXXXXXX"
                className={`w-full pl-10 pr-4 py-2 bg-background border ${
                  errors.cedula ? "border-red-500" : "border-input"
                } rounded-lg`}
                value={formData.cedula}
                onChange={handleChange}
              />
            </div>
            {errors.cedula && (
              <p className="text-red-500 text-xs mt-1">{errors.cedula}</p>
            )}
          </div>

          {/* Correo */}
          <div>
            <label className="text-xs font-medium ml-1">Correo</label>
            <div className="relative">
              <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                name="correo"
                type="email"
                placeholder="juan@ejemplo.com"
                className={`w-full pl-10 pr-4 py-2 bg-background border ${
                  errors.correo ? "border-red-500" : "border-input"
                } rounded-lg`}
                onChange={handleChange}
              />
            </div>
            {errors.correo && (
              <p className="text-red-500 text-xs mt-1">{errors.correo}</p>
            )}
          </div>

          {/* Contraseña */}
          <div>
            <label className="text-xs font-medium ml-1">Contraseña</label>
            <div className="relative">
              <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                required
                type={showPassword ? "text" : "password"}
                name="contrasena"
                placeholder="••••••••"
                className="w-full pl-10 pr-10 py-2 bg-background border border-input rounded-lg"
                onChange={handleChange}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-lg flex items-center justify-center gap-2 mt-6 disabled:opacity-50"
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

        <div className="mt-6 text-center text-sm">
          ¿Ya tienes una cuenta?{" "}
          <Link href="/" className="text-blue-600 hover:underline font-medium">
            Inicia sesión
          </Link>
        </div>
      </div>
    </div>
  );
}
