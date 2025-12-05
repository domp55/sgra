"use client";

import React, { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  FileText,
  AlertCircle,
  Briefcase,
  Layers,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import Swal from "sweetalert2"; 

import Sidebar from "@/components/SidebarUser";
// Verifica que estas rutas sean las correctas en tu proyecto
import { proyecto } from "@/hooks/ServiceProyecto";
import { registrarRequisito } from "@/hooks/ServiceReq";

interface ProyectoSimple {
  id: number;
  nombre: string;
  acronimo: string;
  external: string;
}

export default function AgregarRequisitoPage({
  params,
}: {
  params: Promise<{ external: string }>;
}) {
  // Desempaquetamos los params (Next.js 15+)
  const { external } = use(params);
  const router = useRouter();

  // Estados del Formulario
  const [nombre, setNombre] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [prioridad, setPrioridad] = useState("Media");
  const [tipo, setTipo] = useState("RF");

  // Estados de UI
  const [projectData, setProjectData] = useState<ProyectoSimple | null>(null);
  const [loadingProject, setLoadingProject] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // --------------------------------------------
  // 1. Cargar datos del proyecto al iniciar
  // --------------------------------------------
  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = sessionStorage.getItem("token") || "";
        // Usamos el external de la URL
        const response = await proyecto(external, token);

        if (response.code === 200 && response.data) {
          setProjectData(response.data);
        } else {
          setError("No se pudo cargar la información del proyecto.");
        }
      } catch (err) {
        console.error(err);
        setError("Error de conexión al cargar el proyecto.");
      } finally {
        setLoadingProject(false);
      }
    };

    if (external) {
      fetchProject();
    }
  }, [external]);

  // --------------------------------------------
  // 2. Manejar el Envío (LOGICA CORREGIDA)
  // --------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    // Validación de seguridad
    if (!projectData?.external) {
      setError("Error: No se identificó el ID externo del proyecto.");
      setSaving(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("token") || "";

      // Datos a enviar (Usando External)
      const dataToSend = {
        externalProyecto: projectData.external, 
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        tipo,
      };

      console.log("Enviando datos:", dataToSend); // Para depuración

      // Llamada al servicio
      const response = await registrarRequisito(dataToSend, token);
      
      console.log("Respuesta recibida en Componente:", response); // Verificación final

      // --- CONDICIÓN CORREGIDA ---
      // Aceptamos el éxito si:
      // 1. Existe 'response.requisito' (el objeto creado)
      // 2. O el mensaje es exactamente el esperado
      const esExitoso = response && (response.requisito || response.msg === "Requisito registrado exitosamente");

      if (esExitoso) {
        // Mensaje de éxito
        Swal.fire({
          title: "¡Requisito Guardado!",
          text: "El requisito se ha registrado correctamente en el proyecto.",
          icon: "success",
          confirmButtonText: "Aceptar",
          timer: 2000,
        }).then(() => {
          // Redireccionar
          router.push(`/user/agregarRequisito/${external}`);
        });

      } else {
        // Manejo de error del backend
        const msg = response?.msg || "No se pudo guardar el requisito. Respuesta inesperada.";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: msg,
        });
      }

    } catch (err) {
      console.error(err);
      setError("Error de conexión con el servidor.");
    } finally {
      setSaving(false);
    }
  };

  // --------------------------------------------
  // RENDER
  // --------------------------------------------
  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          
          {/* HEADER */}
          <div className="mb-8">
            <button
              onClick={() => router.back()}
              className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors mb-4"
            >
              <ArrowLeft size={16} className="mr-2" />
              Volver al proyecto
            </button>

            {loadingProject ? (
              <div className="space-y-2">
                 <div className="h-6 w-20 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded"></div>
                 <div className="h-8 w-64 bg-gray-200 dark:bg-zinc-800 animate-pulse rounded"></div>
              </div>
            ) : (
              <div>
                 <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-800 mb-2 inline-block">
                    {projectData?.acronimo || "PROYECTO"}
                 </span>
                 <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
                    Nuevo Requisito
                 </h1>
                 <p className="text-gray-500 dark:text-gray-400">
                    Agregando al proyecto: <span className="font-semibold text-gray-700 dark:text-gray-300">{projectData?.nombre}</span>
                 </p>
              </div>
            )}
          </div>

          {/* FORMULARIO */}
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6 md:p-8">
            
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <fieldset disabled={loadingProject || !projectData} className="group">
                <form onSubmit={handleSubmit} className="space-y-6 group-disabled:opacity-50">
                    
                    {/* NOMBRE */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                            <FileText size={16} className="text-blue-600" />
                            Nombre del Requisito <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Login de Usuarios"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>

                    {/* TIPO Y PRIORIDAD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                <Layers size={16} className="text-purple-600" />
                                Tipo de Requisito
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                <option value="RF">Funcional (RF)</option>
                                <option value="RNF">No Funcional (RNF)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2">
                                <AlertTriangle size={16} className={
                                    prioridad === "Alta" ? "text-red-500" : 
                                    prioridad === "Media" ? "text-orange-500" : "text-green-500"
                                } />
                                Prioridad
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                value={prioridad}
                                onChange={(e) => setPrioridad(e.target.value)}
                            >
                                <option value="Alta">Alta</option>
                                <option value="Media">Media</option>
                                <option value="Baja">Baja</option>
                            </select>
                        </div>
                    </div>

                    {/* DESCRIPCIÓN */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2">
                            <Briefcase size={16} className="text-gray-500" />
                            Descripción Detallada <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-y"
                            placeholder="Describa qué debe hacer el sistema..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            required
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-gray-100 dark:border-zinc-800">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                            disabled={saving}
                        >
                            Cancelar
                        </button>
                        
                        <button
                            type="submit"
                            disabled={saving || !projectData}
                            className={`
                                flex items-center gap-2 px-6 py-2 text-sm font-medium text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all
                                ${saving ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow"}
                            `}
                        >
                            {saving ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save size={18} />
                                    Guardar Requisito
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </fieldset>
          </div>
        </div>
      </main>
    </div>
  );
}