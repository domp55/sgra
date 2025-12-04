"use client";

import React, { useState, useEffect } from "react";
import { Search, Plus, Users, FolderGit2, ArrowRight } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import SidebarUser from "@/components/SidebarUser"; // Sidebar específico de usuario
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
// Asegúrate de tener estos servicios o créalos basándote en la lógica
// import { listarMisProyectos, crearProyecto, unirseProyecto } from "@/hooks/ServiceProyecto";
import Swal from "sweetalert2";

// Definición de la interfaz del Proyecto
interface ProjectType {
  id: string; // o external
  nombre: string;
  descripcion: string;
  rol: "Owner" | "Member"; // Para saber si es dueño o invitado
  fechaCreacion: string;
}

export default function MisProyectos() {
  const [data, setData] = useState<ProjectType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // --------------------------------------------------
  // Cargar proyectos (Simulación de Fetch)
  // --------------------------------------------------
  const fetchData = async () => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      setLoading(true);
      
      // AQUI DEBES LLAMAR A TU SERVICIO REAL
      // const resultado = await listarMisProyectos(token);
      
      // --- SIMULACIÓN DE DATOS (Eliminar al conectar backend) ---
      const resultado = {
        code: 200,
        proyectos: [
          { id: "1", nombre: "Sistema de Ventas", descripcion: "Proyecto final de ciclo", rol: "Owner", fechaCreacion: "2024-01-15" },
          { id: "2", nombre: "App Móvil", descripcion: "Aplicación en Flutter", rol: "Member", fechaCreacion: "2024-02-20" },
        ]
      };
      // --------------------------------------------------------

      // Validación de sesión expirada (igual que en tu ejemplo)
      // if (resultado?.response?.status === 401) { ... }

      if (resultado && Array.isArray(resultado.proyectos)) {
        // @ts-ignore (Ignorar ts si los tipos simulados no coinciden perfecto)
        setData(resultado.proyectos);
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
    item.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --------------------------------------------------
  // Crear Nuevo Proyecto
  // --------------------------------------------------
  const handleCreateProject = async () => {
    const token = Cookies.get("token");
    if (!token) return;

    const { value: formValues } = await Swal.fire({
      title: 'Crear Nuevo Proyecto',
      html:
        '<input id="swal-input1" class="swal2-input" placeholder="Nombre del proyecto">' +
        '<input id="swal-input2" class="swal2-input" placeholder="Descripción breve">',
      focusConfirm: false,
      showCancelButton: true,
      confirmButtonText: 'Crear',
      cancelButtonText: 'Cancelar',
      preConfirm: () => {
        return [
          (document.getElementById('swal-input1') as HTMLInputElement).value,
          (document.getElementById('swal-input2') as HTMLInputElement).value
        ]
      }
    });

    if (formValues) {
      const [nombre, descripcion] = formValues;
      if(!nombre) return Swal.fire("Error", "El nombre es obligatorio", "error");

      try {
        // AWAIT TU SERVICIO DE CREAR
        // await crearProyecto({ nombre, descripcion }, token);
        
        Swal.fire("Creado", `El proyecto "${nombre}" ha sido creado.`, "success");
        fetchData(); // Recargar lista
      } catch (error) {
        Swal.fire("Error", "No se pudo crear el proyecto", "error");
      }
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
                  key={project.id} 
                  className="group relative bg-card border border-border rounded-xl p-5 shadow-sm 
                             hover:shadow-md transition-all hover:border-blue-500/50 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <div className={`text-xs font-semibold px-2 py-1 rounded-full border ${
                        project.rol === 'Owner' 
                          ? 'bg-purple-100 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800' 
                          : 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800'
                      }`}>
                        {project.rol === 'Owner' ? 'Dueño' : 'Miembro'}
                      </div>
                      <span className="text-xs text-muted-foreground">{project.fechaCreacion}</span>
                    </div>

                    <h3 className="text-lg font-semibold text-foreground mb-1 group-hover:text-blue-600 transition-colors">
                      {project.nombre}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {project.descripcion || "Sin descripción disponible."}
                    </p>
                  </div>

                  <button 
                    onClick={() => router.push(`/user/proyecto/${project.id}`)}
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