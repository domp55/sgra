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

import Sidebar from "@/components/SidebarProyecto";
import ThemeToggle from "@/components/ThemeToggle"; // <--- IMPORTADO
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
  // 2. Manejar el Envío
  // --------------------------------------------
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!projectData?.external) {
      setError("Error: No se identificó el ID externo del proyecto.");
      setSaving(false);
      return;
    }

    try {
      const token = sessionStorage.getItem("token") || "";

      const dataToSend = {
        externalProyecto: projectData.external, 
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        prioridad,
        tipo,
      };

      console.log("Enviando datos:", dataToSend); 

      const response = await registrarRequisito(dataToSend, token);
      
      console.log("Respuesta recibida en Componente:", response);

      const esExitoso = response && (response.requisito || response.msg === "Requisito registrado exitosamente");

      if (esExitoso) {
        Swal.fire({
          title: "¡Requisito Guardado!",
          text: "El requisito se ha registrado correctamente en el proyecto.",
          icon: "success",
          confirmButtonText: "Aceptar",
          timer: 2000,
          customClass: {
            popup: 'dark:bg-zinc-900 dark:text-white', // Adaptar Swal al tema
          }
        }).then(() => {
          router.push(`/user/agregarRequisito/${external}`);
        });

      } else {
        const msg = response?.msg || "No se pudo guardar el requisito. Respuesta inesperada.";
        setError(msg);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: msg,
          customClass: {
            popup: 'dark:bg-zinc-900 dark:text-white',
          }
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
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-10 max-w-5xl mx-auto">
          
          {/* HEADER */}
          <div className="mb-8">
            {/* Fila superior: Botón Volver y Theme Toggle */}
            <div className="flex justify-between items-center mb-4">
                <button
                    onClick={() => router.back()}
                    className="flex items-center text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                    <ArrowLeft size={16} className="mr-2" />
                    Volver al proyecto
                </button>
                
                {/* AQUI ESTA EL TOGGLE */}
                <ThemeToggle />
            </div>

            {loadingProject ? (
              <div className="space-y-2">
                 <div className="h-6 w-20 bg-muted animate-pulse rounded"></div>
                 <div className="h-8 w-64 bg-muted animate-pulse rounded"></div>
              </div>
            ) : (
              <div>
                 <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 border border-blue-200 dark:bg-blue-900/40 dark:text-blue-200 dark:border-blue-800 mb-2 inline-block">
                    {projectData?.acronimo || "PROYECTO"}
                 </span>
                 <h1 className="text-3xl font-bold tracking-tight text-foreground">
                    Nuevo Requisito
                 </h1>
                 <p className="text-muted-foreground">
                    Agregando al proyecto: <span className="font-semibold text-foreground">{projectData?.nombre}</span>
                 </p>
              </div>
            )}
          </div>

          {/* FORMULARIO */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6 md:p-8">
            
            {error && (
                <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 rounded-lg flex items-center gap-3">
                    <AlertCircle size={20} />
                    <p className="text-sm font-medium">{error}</p>
                </div>
            )}

            <fieldset disabled={loadingProject || !projectData} className="group">
                <form onSubmit={handleSubmit} className="space-y-6 group-disabled:opacity-50">
                    
                    {/* NOMBRE */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-foreground">
                            <FileText size={16} className="text-blue-600" />
                            Nombre del Requisito <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            placeholder="Ej. Login de Usuarios"
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            required
                        />
                    </div>

                    {/* TIPO Y PRIORIDAD */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-foreground">
                                <Layers size={16} className="text-purple-600" />
                                Tipo de Requisito
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                                value={tipo}
                                onChange={(e) => setTipo(e.target.value)}
                            >
                                <option value="RF">Funcional (RF)</option>
                                <option value="RNF">No Funcional (RNF)</option>
                            </select>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium leading-none flex items-center gap-2 text-foreground">
                                <AlertTriangle size={16} className={
                                    prioridad === "Alta" ? "text-red-500" : 
                                    prioridad === "Media" ? "text-orange-500" : "text-green-500"
                                } />
                                Prioridad
                            </label>
                            <select
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
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
                        <label className="text-sm font-medium leading-none flex items-center gap-2 text-foreground">
                            <Briefcase size={16} className="text-muted-foreground" />
                            Descripción Detallada <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            className="flex min-h-[120px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 resize-y"
                            placeholder="Describa qué debe hacer el sistema..."
                            value={descripcion}
                            onChange={(e) => setDescripcion(e.target.value)}
                            required
                        />
                    </div>

                    {/* BOTONES */}
                    <div className="pt-4 flex items-center justify-end gap-4 border-t border-border">
                        <button
                            type="button"
                            onClick={() => router.back()}
                            className="px-4 py-2 text-sm font-medium text-foreground bg-background border border-input rounded-lg hover:bg-muted transition-colors"
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