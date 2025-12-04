"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Users, FolderGit2, ArrowRight, Calendar, FileText, Hash, User, ListChecks, Layers } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarUser from "@/components/SidebarUser"; // Sidebar específico de usuario
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
// Asegúrate de tener estos servicios o créalos basándote en la lógica
// import { listarMisProyectos, crearProyecto, unirseProyecto } from "@/hooks/ServiceProyecto";
import Swal from "sweetalert2";
import { GET, POST } from "@/hooks/Connection";

// Definición de la interfaz del Proyecto
interface ColaboradorType {
  rolID: number;
  proyectoId: number;
  cuentaID: number;
  fechaAsignacion: string;
  estado: boolean;
  external: string;
  rol: {
    nombre: "SCRUM_MASTER" | "Member";
  };
}


interface ProjectType {
  // General
  nombre: string;
  acronimo?: string;
  descripcion?: string;

  // Cronograma
  fechaInicio?: string; // Sequelize DATE se puede mapear a string en TS
  fechaFin?: string;
  estado?: "En Planificación" | "En Ejecución" | "En Pausa" | "Finalizado";
  tiempoSprint?: number;
  nroSprints?: number;

  // Calidad
  objetivosCalidad?: string;
  definicionDone?: string;
  criteriosEntradaQA?: string;
  coberturaPruebasMinima?: number;

  // Estado del proyecto
  estaActivo?: boolean;
  external?: string; // UUID

  // Relaciones
  colaboradors?: ColaboradorType[];
}

export default function MisProyectos() {
  const [data, setData] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
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

      //const response = await GET("/api/proyecto/listar", token);
      const response = await GET(`/api/proyecto/listar/${encodeURIComponent(externalCuenta!)}`, token);

      console.log("Response:", response.data);

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
  // Filtrado
  // --------------------------------------------------
  const filteredData = data.filter((item) =>
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.descripcion!.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --------------------------------------------------
  // Crear Nuevo Proyecto
  // --------------------------------------------------
  const handleCreateProject = async () => {
    const token = Cookies.get("token");
    if (!token) return;
    const cuentaID = sessionStorage.getItem("external_cuenta");
    if (!cuentaID) {
      return Swal.fire("Error", "No se encontró la cuenta del usuario", "error");
    }

    const { value: formValues } = await Swal.fire({
      title: "Crear Nuevo Proyecto",
      html: `
      <style>
        .swal2-popup { width: 700px !important; max-height: 90vh !important; overflow-y: auto !important; }
        .swal2-html-container { overflow: visible !important; max-height: none !important; }
        .swal2-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 10px; }
        .swal2-label { font-size: 14px; font-weight: 600; margin-bottom: 4px; color: #4a4a4a; display: block; text-align: left; }
        input, textarea { font-size: 13px; padding: 6px 8px; height: 32px; width: 100%; box-sizing: border-box; }
        textarea { min-height: 70px; max-height: 200px; width: 100%; box-sizing: border-box; resize: vertical; }
        .swal2-col-span-2 { grid-column: span 2; }
      </style>
      <div class="swal2-grid">
        <div class="swal2-col-span-2">
          <label class="swal2-label">Nombre del Proyecto *</label>
          <input id="swal-nombre" placeholder="Proyecto X">
        </div>
        <div>
          <label class="swal2-label">Acrónimo</label>
          <input id="swal-acronimo" placeholder="PX (opcional)">
        </div>
        <div>
          <label class="swal2-label">Duración Sprint (semanas)</label>
          <input id="swal-tiempoSprint" type="number" placeholder="14">
        </div>
        <div>
          <label class="swal2-label">Número de Sprints</label>
          <input id="swal-nroSprints" type="number" placeholder="5">
        </div>
        <div>
          <label class="swal2-label">Fecha Inicio</label>
          <input id="swal-fechaInicio" type="date">
        </div>
        <div>
          <label class="swal2-label">Fecha Fin</label>
          <input id="swal-fechaFin" type="date">
        </div>
        <div class="swal2-col-span-2">
          <label class="swal2-label">Descripción</label>
          <textarea id="swal-descripcion" placeholder="Descripción breve"></textarea>
        </div>
        <div class="swal2-col-span-2">
          <label class="swal2-label">Objetivos de Calidad</label>
          <textarea id="swal-objetivosCalidad" placeholder="Objetivos de calidad del proyecto"></textarea>
        </div>
        <div class="swal2-col-span-2">
          <label class="swal2-label">Definición de Done</label>
          <textarea id="swal-definicionDone" placeholder="Criterios de finalización"></textarea>
        </div>
        <div class="swal2-col-span-2">
          <label class="swal2-label">Criterios de Entrada QA</label>
          <textarea id="swal-criteriosEntradaQA" placeholder="Criterios de entrada para QA"></textarea>
        </div>
        <div>
          <label class="swal2-label">Cobertura de Pruebas Mínima (%)</label>
          <input id="swal-coberturaPruebasMinima" type="number" placeholder="80">
        </div>
      </div>
    `,
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: "Crear",
      cancelButtonText: "Cancelar",
      preConfirm: () => {
        // Leer valores
        const nombre = (document.getElementById("swal-nombre") as HTMLInputElement).value.trim();
        const acronimo = (document.getElementById("swal-acronimo") as HTMLInputElement).value.trim();
        const descripcion = (document.getElementById("swal-descripcion") as HTMLInputElement).value.trim();
        const tiempoSprint = parseInt((document.getElementById("swal-tiempoSprint") as HTMLInputElement).value);
        const nroSprints = parseInt((document.getElementById("swal-nroSprints") as HTMLInputElement).value);
        const fechaInicio = (document.getElementById("swal-fechaInicio") as HTMLInputElement).value;
        const fechaFin = (document.getElementById("swal-fechaFin") as HTMLInputElement).value;
        const coberturaMin = parseInt((document.getElementById("swal-coberturaPruebasMinima") as HTMLInputElement).value);

        // Validaciones
        if (!nombre) return Swal.showValidationMessage("El nombre del proyecto es obligatorio");
        if (!descripcion) return Swal.showValidationMessage("La descripción es obligatoria");
        if (!fechaInicio) return Swal.showValidationMessage("La fecha de inicio es obligatoria");
        if (!fechaFin) return Swal.showValidationMessage("La fecha fin es obligatoria");
        if (!/^[a-zA-Z0-9\sáéíóúÁÉÍÓÚñÑ.,-]{3,100}$/.test(nombre)) return Swal.showValidationMessage("El nombre contiene caracteres inválidos");
        if (acronimo && !/^[a-zA-Z0-9]{2,10}$/.test(acronimo)) return Swal.showValidationMessage("El acrónimo debe ser alfanumérico y de 2 a 10 caracteres");
        if (isNaN(tiempoSprint) || tiempoSprint <= 0) return Swal.showValidationMessage("El tiempo del sprint debe ser un número positivo");
        if (isNaN(nroSprints) || nroSprints <= 0) return Swal.showValidationMessage("La cantidad de sprints debe ser un número positivo");
        const hoy = new Date(); hoy.setHours(0, 0, 0, 0);
        if (new Date(fechaInicio) < hoy) return Swal.showValidationMessage("La fecha de inicio no puede ser anterior a hoy");
        if (new Date(fechaFin) < hoy) return Swal.showValidationMessage("La fecha fin no puede ser anterior a hoy");
        if (new Date(fechaFin) < new Date(fechaInicio)) return Swal.showValidationMessage("La fecha fin no puede ser menor que la fecha de inicio");

        // Si pasa todo, retornar valores
        return { nombre, acronimo: acronimo || undefined, descripcion, tiempoSprint, nroSprints, fechaInicio, fechaFin, coberturaPruebasMinima: isNaN(coberturaMin) ? undefined : coberturaMin };
      }
    });

    if (!formValues) return; // si canceló, sale

    try {
      const response = await POST("/api/proyecto/registrar", { ...formValues, externalCuenta: cuentaID }, token);
      Swal.fire("Registro Creado", response.msg, "success");
      fetchData(); // refrescar lista
    } catch (error) {
      console.error(error);
      Swal.fire("Error", "No se pudo registrar el proyecto", "error");
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
      inputPlaceholder: 'Ej: PROJ-12345',
      showCancelButton: true,
      confirmButtonText: 'Unirse',
      cancelButtonText: 'Cancelar',
      inputValidator: (value) => {
        if (!value) {
          return '¡Necesitas escribir un código!'
        }
      }
    });

    if (codigo) {
      try {
        // AWAIT TU SERVICIO DE UNIRSE
        // await unirseProyecto(codigo, token);

        Swal.fire("Éxito", "Te has unido al proyecto correctamente.", "success");
        fetchData(); // Recargar lista
      } catch (error) {
        Swal.fire("Error", "Código inválido o error de conexión", "error");
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* SIDEBAR DE USUARIO */}
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
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">

            {/* Buscador */}
            <div className="relative w-full md:max-w-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar en mis proyectos..."
                className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm
                           focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Botones de Acción */}
            <div className="flex gap-3 w-full md:w-auto">
              <button
                onClick={handleJoinProject}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 
                           text-sm font-medium text-foreground bg-background border border-input 
                           rounded-md hover:bg-muted transition-colors shadow-sm"
              >
                <Users size={16} />
                Unirse
              </button>

              <button
                onClick={handleCreateProject}
                className="flex-1 md:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 
                           text-sm font-medium text-white bg-blue-600 border border-blue-700 
                           rounded-md hover:bg-blue-700 transition-colors shadow-sm"
              >
                <Plus size={16} />
                Nuevo Proyecto
              </button>
            </div>
          </div>

          {/* LISTA DE PROYECTOS (GRID) */}
          {loading ? (
            <div className="text-center py-20 text-muted-foreground">Cargando proyectos...</div>
          ) : filteredData.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-border rounded-lg">
              <FolderGit2 className="mx-auto h-12 w-12 text-muted-foreground/50 mb-3" />
              <h3 className="text-lg font-medium text-foreground">No tienes proyectos</h3>
              <p className="text-muted-foreground text-sm">Crea uno nuevo o únete mediante un código.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredData.map((project) => (
                <div
                  key={project.external}
                  className="group relative bg-card border border-border rounded-xl p-5 shadow-sm 
                             hover:shadow-md transition-all hover:border-blue-500/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${project.colaboradors![0]?.rol.nombre === 'SCRUM_MASTER'}
                        ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800'
                        : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                        }`}>
                        {project.colaboradors![0].rol.nombre === 'SCRUM_MASTER' ? 'Dueño' : 'Miembro'}
                      </div>
                      <span className="text-xs text-muted-foreground">{new Date(project.fechaInicio!).toLocaleDateString()}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                      {project.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.descripcion || "Sin descripción disponible."}
                    </p>
                  </div>

                  <button
                    onClick={() => router.push(`/user/proyecto/${project.external}`)}
                    className="w-full mt-4 inline-flex items-center justify-center gap-2 text-sm font-medium 
                               text-primary bg-muted/50 hover:bg-muted py-2 rounded-lg transition-colors"
                  >
                    Ver Tablero <ArrowRight size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className="text-sm text-muted-foreground pt-2">
            Mostrando {filteredData.length} proyectos
          </div>
        </div>
      </main>
    </div>
  );
}