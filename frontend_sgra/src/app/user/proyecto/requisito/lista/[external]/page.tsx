"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  History,
  Edit,
  Trash2,
  FileText,
  Layers
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/SidebarProyecto";
import { useRouter, useParams } from "next/navigation"; 
import Swal from "sweetalert2";

// Importamos ambas funciones del servicio
import { listarVersiones, eliminarRequisito } from "@/hooks/ServiceVersiones"; 

// --------------------------------------------------
// Interfaces
// --------------------------------------------------

interface VersionData {
  nombre: string;
  descripcion: string;
  prioridad: string;
  tipo: string;
  estado: string;
  version: number;
  external: string;
  createdAt: string;
}

interface RequisitoUI {
  externalMaster: string;
  idProyecto: number;
  fechaCreacionMaster: string;
  versionActual: VersionData | null;
  versionesAnteriores: VersionData[];
}

export default function GestionRequisitos() {
  const [data, setData] = useState<RequisitoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const router = useRouter();
  const params = useParams(); 
  const externalProyecto = params?.external as string; 

  // --------------------------------------------------
  // Cargar datos
  // --------------------------------------------------
  const fetchData = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    if (!externalProyecto) return;

    try {
      setLoading(true);
      const resultado = await listarVersiones(externalProyecto, token);

      if (resultado && resultado.requisitos) {
        setData(resultado.requisitos);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error al cargar requisitos:", err);
      setData([]);
      Swal.fire({
        title: "Error",
        text: "No se pudieron cargar los requisitos del proyecto.",
        icon: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (externalProyecto) {
      fetchData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalProyecto]);

  // --------------------------------------------------
  // Eliminar Requisito (NUEVO)
  // --------------------------------------------------
  const handleEliminar = async (externalMaster: string) => {
    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    const result = await Swal.fire({
      title: "¿Estás seguro?",
      text: "Se eliminará el requisito actual y todo su historial de versiones. ¡No podrás revertir esto!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444", // Rojo Tailwind
      cancelButtonColor: "#6b7280", // Gris Tailwind
      confirmButtonText: "Sí, eliminar",
      cancelButtonText: "Cancelar",
      background: document.documentElement.classList.contains('dark') ? '#1f2937' : '#fff', // Adapta modo oscuro si lo usas
      color: document.documentElement.classList.contains('dark') ? '#fff' : '#000',
    });

    if (result.isConfirmed) {
      try {
        Swal.fire({
          title: "Procesando...",
          text: "Eliminando requisito",
          allowOutsideClick: false,
          didOpen: () => Swal.showLoading(),
        });

        const respuesta = await eliminarRequisito(externalMaster, token);

        if (respuesta && respuesta.code === 200) {
          // Éxito: Filtramos el estado local para remover el item
          setData((prev) => prev.filter((item) => item.externalMaster !== externalMaster));
          
          Swal.fire({
            title: "¡Eliminado!",
            text: "El requisito ha sido eliminado correctamente.",
            icon: "success",
            timer: 1500,
            showConfirmButton: false
          });
        } else {
          // Error controlado del backend
          Swal.fire({
            title: "Error",
            text: respuesta?.msg || "No se pudo completar la eliminación.",
            icon: "error",
          });
        }
      } catch (error) {
        // Error de red o código
        console.error(error);
        Swal.fire({
          title: "Error",
          text: "Ocurrió un error de conexión.",
          icon: "error",
        });
      }
    }
  };

  const toggleRow = (externalMaster: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(externalMaster)) {
      newExpanded.delete(externalMaster);
    } else {
      newExpanded.add(externalMaster);
    }
    setExpandedRows(newExpanded);
  };

  const getPriorityColor = (prioridad: string) => {
    const p = prioridad?.toLowerCase() || "";
    if (p.includes("alta")) return "text-red-600 bg-red-50 border-red-200";
    if (p.includes("media")) return "text-amber-600 bg-amber-50 border-amber-200";
    return "text-emerald-600 bg-emerald-50 border-emerald-200";
  };

  const filteredData = data.filter((item) =>
    item.versionActual?.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <main className="flex-1 w-full">
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
                <Layers className="text-blue-600" />
                Gestión de Requisitos
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Visualizando requisitos del proyecto: <span className="font-mono text-foreground bg-muted px-1 rounded">{externalProyecto}</span>
              </p>
            </div>
            <ThemeToggle />
          </div>

          <hr className="border-border" />

          {/* Barra de Búsqueda */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
            <div className="relative w-full max-w-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar requisito..."
                className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="text-sm text-muted-foreground">
               <strong>{data.length}</strong> Requisitos encontrados
            </div>
          </div>

          {/* TABLA PRINCIPAL */}
          <div className="overflow-hidden border border-border rounded-lg shadow-sm bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Versión Actual</th>
                    <th className="px-4 py-3">Prioridad / Tipo</th>
                    <th className="px-4 py-3">Versión</th>
                    <th className="px-4 py-3">Última Modificación</th>
                    <th className="px-4 py-3 text-center">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border">
                  {loading ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center text-muted-foreground">
                        Cargando requisitos...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="h-32 text-center text-muted-foreground">
                        No se encontraron requisitos para este proyecto.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const isExpanded = expandedRows.has(item.externalMaster);
                      const current = item.versionActual;
                      const hasHistory = item.versionesAnteriores.length > 0;

                      if (!current) return null;

                      return (
                        <React.Fragment key={item.externalMaster}>
                          {/* FILA DE VERSIÓN ACTUAL */}
                          <tr className={`hover:bg-muted/50 transition-colors ${isExpanded ? "bg-muted/30" : ""}`}>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleRow(item.externalMaster)}
                                disabled={!hasHistory}
                                className={`p-1 rounded transition-colors ${
                                  hasHistory 
                                    ? "text-muted-foreground hover:text-foreground hover:bg-muted" 
                                    : "text-muted-foreground/30 cursor-not-allowed"
                                }`}
                              >
                                {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                              </button>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-semibold text-foreground flex items-center gap-2">
                                <FileText size={14} className="text-blue-500" />
                                {current.nombre}
                              </div>
                              <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1 max-w-[200px]">
                                {current.descripcion}
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1 items-start">
                                <span className={`px-2 py-0.5 text-[10px] font-medium rounded border ${getPriorityColor(current.prioridad)}`}>
                                  {current.prioridad}
                                </span>
                                <span className="text-[10px] text-muted-foreground bg-muted px-1.5 rounded">
                                  {current.tipo}
                                </span>
                              </div>
                            </td>

                            <td className="px-4 py-3">
                              <span className="text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-600 text-white border border-sky-700 dark:bg-sky-600 dark:text-white">
                                v{current.version}.0
                              </span>
                            </td>

                            <td className="px-4 py-3 text-muted-foreground text-xs">
                              {new Date(current.createdAt).toLocaleDateString()}
                            </td>

                            <td className="px-4 py-3">
                              <div className="flex items-center justify-center gap-2">
                                <button 
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-md transition-colors dark:hover:bg-blue-900/20"
                                  title="Editar Versión Actual"
                                >
                                  <Edit size={16} />
                                </button>
                                
                                {/* BOTON ELIMINAR ACTUALIZADO */}
                                <button 
                                  className="p-1.5 text-red-600 hover:bg-red-50 rounded-md transition-colors dark:hover:bg-red-900/20"
                                  title="Eliminar Requisito"
                                  onClick={() => handleEliminar(item.externalMaster)}
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </td>
                          </tr>

                          {/* FILA EXPANDIDA: HISTORIAL */}
                          {isExpanded && (
                            <tr className="bg-muted/10 border-b border-border shadow-inner">
                              <td colSpan={6} className="px-0 py-0">
                                <div className="pl-12 pr-4 py-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                  <div className="bg-background border border-border rounded-md overflow-hidden">
                                    <div className="bg-muted/50 px-4 py-2 border-b border-border flex items-center gap-2">
                                      <History size={14} className="text-muted-foreground" />
                                      <span className="text-xs font-semibold text-foreground">Historial de Versiones Anteriores</span>
                                    </div>
                                    
                                    <table className="w-full text-xs">
                                      <thead className="bg-muted/30 text-muted-foreground">
                                        <tr>
                                          <th className="px-4 py-2 text-left font-medium">Versión</th>
                                          <th className="px-4 py-2 text-left font-medium">Nombre (Snapshot)</th>
                                          <th className="px-4 py-2 text-left font-medium">Descripción</th>
                                          <th className="px-4 py-2 text-left font-medium">Fecha Registro</th>
                                          <th className="px-4 py-2 text-left font-medium">Estado</th>
                                        </tr>
                                      </thead>
                                      <tbody className="divide-y divide-border/50">
                                        {item.versionesAnteriores.map((v, idx) => (
                                          <tr key={idx} className="hover:bg-muted/20">
                                            <td className="px-4 py-2 font-mono text-muted-foreground">
                                              v{v.version}.0
                                            </td>
                                            <td className="px-4 py-2 font-medium">
                                              {v.nombre}
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground max-w-md truncate">
                                              {v.descripcion}
                                            </td>
                                            <td className="px-4 py-2 text-muted-foreground">
                                              {new Date(v.createdAt).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2">
                                              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-700">
                                                Historico
                                              </span>
                                            </td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}