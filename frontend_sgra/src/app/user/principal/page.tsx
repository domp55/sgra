"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Users, FolderGit2, ArrowRight, LayoutGrid, List } from "lucide-react"; 
import ThemeToggle from "@/components/ThemeToggle";
import SidebarUser from "@/components/SidebarUser";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";
import { GET, POST } from "@/hooks/Connection";

// --- INTERFACES ---
interface ColaboradorType {
  rolID: number;
  proyectoId: number;
  cuentaID: number;
  fechaAsignacion: string;
  estado: boolean;
  external: string;
  rol: {
    nombre: "PRODUCT_OWNER" | "Member" | "SCRUM_MASTER";
  };
}

interface ProjectType {
  // Datos Generales
  nombre: string;
  acronimo?: string;
  descripcion: string;
  
  // Cronograma
  tiempoSprint: number;
  nroSprints: number;
  fechaInicio: string;
  fechaFin: string;
  
  // Estado
  estado: string;
  estaActivo: boolean;
  external: string;
  
  // Calidad (Datos agregados del formato anterior)
  objetivosCalidad?: string;
  definicionDone?: string;
  criteriosEntradaQA?: string;
  coberturaPruebasMinima?: number;

  // Relaciones
  colaboradors: ColaboradorType[];
  requisitomasters: any[];
}

export default function MisProyectos() {
  const [data, setData] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const router = useRouter();

  // --------------------------------------------------
  // Cargar proyectos
  // --------------------------------------------------
  const fetchData = async () => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    const externalCuenta = sessionStorage.getItem("external_cuenta");

    if (!token) return router.push("/");
    if (!externalCuenta) {
      console.error("No se encontró external_cuenta");
      setData([]);
      return;
    }

    try {
      setLoading(true);
      const response = await GET(`/api/proyecto/listar/${encodeURIComponent(externalCuenta!)}`, token);

      if (response.data.code === 200 && Array.isArray(response.data.data)) {
        setData(response.data.data);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error al cargar proyectos:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------
  // Crear Nuevo Proyecto (FUSIONADO)
  // --------------------------------------------------
  const handleCreateProject = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    const cuentaID = sessionStorage.getItem("external_cuenta");
    if (!cuentaID) return Swal.fire("Error", "No se encontró la cuenta del usuario", "error");

    // Estilos reutilizables para el modal
    const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm text-gray-700 bg-white placeholder-gray-400";
    const labelClass = "block text-left text-sm font-semibold text-gray-700 mb-1";
    const textAreaClass = `${inputClass} resize-y min-h-[60px]`;

    const { value: formValues } = await Swal.fire({
      title: '<h2 class="text-xl font-bold text-gray-800">Crear Nuevo Proyecto</h2>',
      width: '750px', // Aumentado un poco el ancho para acomodar más campos
      html: `
        <div class="flex flex-col gap-3 mt-2 text-left max-h-[70vh] overflow-y-auto px-1">
          
          <div class="grid grid-cols-4 gap-4">
            <div class="col-span-3">
              <label class="${labelClass}">Nombre del Proyecto <span class="text-red-500">*</span></label>
              <input id="swal-nombre" class="${inputClass}" placeholder="Ej: Sistema de Gestión">
            </div>
            <div class="col-span-1">
              <label class="${labelClass}">Acrónimo</label>
              <input id="swal-acronimo" class="${inputClass}" placeholder="Ej: SGRA">
            </div>
          </div>
          
          <div>
            <label class="${labelClass}">Descripción <span class="text-red-500">*</span></label>
            <textarea id="swal-descripcion" class="${textAreaClass}" rows="2" placeholder="Describe brevemente..."></textarea>
          </div>

          <hr class="border-gray-200 my-1"/>

          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="${labelClass}">Duración Sprint (días)</label>
              <input id="swal-tiempoSprint" type="number" class="${inputClass}" placeholder="15" value="15">
            </div>
            <div>
              <label class="${labelClass}">Nro. Sprints estimados</label>
              <input id="swal-nroSprints" type="number" class="${inputClass}" placeholder="4" value="4">
            </div>
          </div>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="${labelClass}">Fecha Inicio <span class="text-red-500">*</span></label>
              <input id="swal-fechaInicio" type="date" class="${inputClass}">
            </div>
            <div>
              <label class="${labelClass}">Fecha Fin <span class="text-red-500">*</span></label>
              <input id="swal-fechaFin" type="date" class="${inputClass}">
            </div>
          </div>

          <hr class="border-gray-200 my-1"/>
          <h3 class="text-sm font-bold text-gray-500 uppercase tracking-wide">Parámetros de Calidad</h3>

          <div>
            <label class="${labelClass}">Objetivos de Calidad</label>
            <textarea id="swal-objetivosCalidad" class="${textAreaClass}" placeholder="Objetivos de calidad del proyecto"></textarea>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
             <div>
              <label class="${labelClass}">Definición de Done</label>
              <textarea id="swal-definicionDone" class="${textAreaClass}" placeholder="Criterios de finalización"></textarea>
            </div>
            <div>
              <label class="${labelClass}">Criterios de Entrada QA</label>
              <textarea id="swal-criteriosEntradaQA" class="${textAreaClass}" placeholder="Criterios para QA"></textarea>
            </div>
          </div>

          <div>
            <label class="${labelClass}">Cobertura de Pruebas Mínima (%)</label>
            <input id="swal-coberturaPruebasMinima" type="number" class="${inputClass}" placeholder="80">
          </div>

        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Crear Proyecto',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#2563EB',
      focusConfirm: false,
      preConfirm: () => {
        // Recolección de valores
        const nombre = (document.getElementById("swal-nombre")! as HTMLInputElement).value.trim();
        const acronimo = (document.getElementById("swal-acronimo")! as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById("swal-descripcion")! as HTMLInputElement).value.trim();
        const tiempoSprint = (document.getElementById("swal-tiempoSprint")! as HTMLInputElement).value;
        const nroSprints = (document.getElementById("swal-nroSprints")! as HTMLInputElement).value;
        const fechaInicio = (document.getElementById("swal-fechaInicio")! as HTMLInputElement).value;
        const fechaFin = (document.getElementById("swal-fechaFin")! as HTMLInputElement).value;
        
        // Nuevos campos
        const objetivosCalidad = (document.getElementById("swal-objetivosCalidad")! as HTMLTextAreaElement).value.trim();
        const definicionDone = (document.getElementById("swal-definicionDone")! as HTMLTextAreaElement).value.trim();
        const criteriosEntradaQA = (document.getElementById("swal-criteriosEntradaQA")! as HTMLTextAreaElement).value.trim();
        const coberturaPruebasMinima = (document.getElementById("swal-coberturaPruebasMinima")! as HTMLInputElement).value;

        return {
          nombre,
          acronimo,
          descripcion,
          tiempoSprint,
          nroSprints,
          fechaInicio,
          fechaFin,
          objetivosCalidad,
          definicionDone,
          criteriosEntradaQA,
          coberturaPruebasMinima
        };
      }
    });

    if (!formValues) return;

    // --- VALIDACIONES ---
    const { 
      nombre, acronimo, descripcion, tiempoSprint, nroSprints, fechaInicio, fechaFin,
      objetivosCalidad, definicionDone, criteriosEntradaQA, coberturaPruebasMinima 
    } = formValues;

    if (!nombre || !descripcion || !fechaInicio || !fechaFin) 
      return Swal.fire("Atención", "Todos los campos marcados con * son obligatorios", "warning");

    const sprintDur = Number(tiempoSprint);
    const sprintNum = Number(nroSprints);
    const coberturaMin = Number(coberturaPruebasMinima);

    if (isNaN(sprintDur) || sprintDur <= 0 || isNaN(sprintNum) || sprintNum <= 0) 
      return Swal.fire("Error", "Los valores de sprint deben ser positivos", "warning");

    const fechaInicioDate = new Date(fechaInicio);
    const fechaFinDate = new Date(fechaFin);
    if (fechaFinDate <= fechaInicioDate) 
      return Swal.fire("Error", "La fecha fin debe ser posterior a la de inicio", "warning");

    // --- ENVÍO AL BACKEND ---
    const dataToSend = {
      nombre,
      acronimo: acronimo || undefined,
      descripcion,
      tiempoSprint: sprintDur,
      nroSprints: sprintNum,
      fechaInicio,
      fechaFin,
      // Mapeo de campos extra
      objetivosCalidad: objetivosCalidad || undefined,
      definicionDone: definicionDone || undefined,
      criteriosEntradaQA: criteriosEntradaQA || undefined,
      coberturaPruebasMinima: isNaN(coberturaMin) ? undefined : coberturaMin,
      externalCuenta: cuentaID
    };

    try {
      const response = await POST("/api/proyecto/registrar", dataToSend, token);
      
      console.log("Respuesta Backend:", response);

      if (response && (response.code === 201 || response.data?.code === 201)) {
        Swal.fire({
          title: "¡Creado!",
          text: `El proyecto "${nombre}" ha sido creado correctamente, pendiente de aprobación.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        setViewMode("list"); // Cambiar a vista de lista
        fetchData();
      } else {
        const errorMsg = response.msg || response.data?.msg || "Error desconocido al crear el proyecto";
        Swal.fire("Error", errorMsg, "error");
      }
    } catch (error: any) {
      console.error("Error completo:", error);
      let mensajeMostrar = "No se pudo conectar con el servidor";
      if (error.response && error.response.data) {
          mensajeMostrar = error.response.data.msg || error.response.data.message || JSON.stringify(error.response.data);
      }
      Swal.fire("Error al crear", mensajeMostrar, "error");
    }
  };

  // --------------------------------------------------
  // Unirse a Proyecto
  // --------------------------------------------------
  const handleJoinProject = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    const { value: codigo } = await Swal.fire({
      title: 'Unirse a un Proyecto',
      input: 'text',
      inputLabel: 'Ingresa el código de invitación',
      showCancelButton: true,
      confirmButtonText: 'Unirse',
      confirmButtonColor: '#2563EB'
    });
    
    if(codigo) Swal.fire("Info", "Funcionalidad pendiente de conectar", "info");
  };

  // --------------------------------------------------
  // Helpers UI
  // --------------------------------------------------
  const filteredData = data.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRolUsuario = (proyecto: ProjectType) => {
    if (proyecto.colaboradors && proyecto.colaboradors.length > 0) {
      // Ajustado para manejar roles más genéricos o específicos si es necesario
      const rol = proyecto.colaboradors[0].rol.nombre;
      if (rol === 'PRODUCT_OWNER' || rol === 'SCRUM_MASTER') return 'Dueño';
      return 'Miembro';
    }
    return 'Miembro';
  };

  const isOwner = (proyecto: ProjectType) => {
    if (!proyecto.colaboradors || proyecto.colaboradors.length === 0) return false;
    const rol = proyecto.colaboradors[0].rol.nombre;
    return rol === 'PRODUCT_OWNER' || rol === 'SCRUM_MASTER';
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <SidebarUser />

      <main className="flex-1 w-full">
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Mis Proyectos
              </h1>
              <p className="text-muted-foreground">
                Administra tus proyectos o únete a uno existente.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <hr className="border-border" />

          {/* BARRA DE HERRAMIENTAS */}
          <div className="flex flex-col lg:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
            
            {/* Buscador */}
            <div className="relative w-full lg:max-w-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Controles de Vista y Botones */}
            <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
              
              {/* Toggle Vista */}
              <div className="flex items-center bg-background border border-input rounded-md p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Vista en Cuadrícula"
                >
                  <LayoutGrid size={18} />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-muted text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                  title="Vista en Lista"
                >
                  <List size={18} />
                </button>
              </div>

              <div className="h-6 w-px bg-border hidden sm:block"></div>

              {/* Botones */}
              <div className="flex gap-2 w-full sm:w-auto">
                
                <button onClick={handleCreateProject} className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 transition-colors">
                  <Plus size={16} /> Nuevo
                </button>
              </div>
            </div>
          </div>

          {/* CONTENIDO: GRID vs LIST */}
          {loading ? (
             <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4"></div>
                <div className="text-muted-foreground">Cargando proyectos...</div>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg bg-card/50">
              <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium text-foreground">No tienes proyectos</h3>
              <p className="text-muted-foreground text-sm">Crea uno nuevo para comenzar.</p>
            </div>
          ) : (
            <>
              {/* --- VISTA CUADRÍCULA (GRID) --- */}
              {viewMode === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredData.map((project) => (
                    <div key={project.external} className="group bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                            isOwner(project) 
                              ? 'bg-purple-100 text-purple-700 border-purple-200' 
                              : 'bg-blue-100 text-blue-700 border-blue-200'
                          }`}>
                            {getRolUsuario(project)}
                          </span>
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                            {new Date(project.fechaInicio).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-lg font-bold text-foreground mb-1 truncate">{project.nombre}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 h-10 mb-4">{project.descripcion}</p>
                      </div>
                      <button 
                        onClick={() => router.push(`/user/proyecto/${project.external}`)}
                        className="w-full mt-2 inline-flex items-center justify-center gap-2 text-sm font-medium text-white bg-primary hover:bg-primary/90 py-2 rounded-lg transition-all"
                      >
                        Ver Tablero <ArrowRight size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* --- VISTA LISTA (TABLE) --- */}
              {viewMode === "list" && (
                <div className="overflow-hidden border border-border rounded-lg shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                                <tr>
                                    <th className="px-4 py-3">Nombre</th>
                                    <th className="px-4 py-3">Acrónimo</th>
                                    <th className="px-4 py-3">Fechas</th>
                                    <th className="px-4 py-3">Sprints</th>
                                    <th className="px-4 py-3">Rol</th>
                                    <th className="px-4 py-3 text-right">Acción</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border bg-card">
                                {filteredData.map((project) => (
                                    <tr key={project.external} className="hover:bg-muted/50 transition-colors">
                                        <td className="px-4 py-3 font-medium">
                                            {project.nombre}
                                            <div className="text-xs text-muted-foreground font-normal truncate max-w-[200px]">{project.descripcion}</div>
                                        </td>
                                        <td className="px-4 py-3">{project.acronimo || "-"}</td>
                                        <td className="px-4 py-3 text-muted-foreground text-xs">
                                            <div>In: {new Date(project.fechaInicio).toLocaleDateString()}</div>
                                            <div>Fn: {new Date(project.fechaFin).toLocaleDateString()}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            {project.nroSprints} <span className="text-xs text-muted-foreground">({project.tiempoSprint}d)</span>
                                        </td>
                                        <td className="px-4 py-3">
                                              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${
                                                isOwner(project) 
                                                ? 'bg-purple-100 text-purple-700 border-purple-200' 
                                                : 'bg-blue-100 text-blue-700 border-blue-200'
                                            }`}>
                                                {getRolUsuario(project)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button 
                                                onClick={() => router.push(`/user/proyecto/${project.external}`)}
                                                className="inline-flex items-center gap-1 text-primary hover:underline font-medium text-xs"
                                            >
                                                Ver <ArrowRight size={12} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
              )}
            </>
          )}

          <div className="text-sm text-muted-foreground pt-2">
            Mostrando {filteredData.length} proyectos
          </div>
        </div>
      </main>
    </div>
  );
}