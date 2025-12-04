"use client";

import React, { useState, useEffect } from "react";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Calendar,
  Clock,
  Users,
  Power,
  User,
  Mail,
  CheckCircle2,
  XCircle,
  Ban,
  ShieldCheck, // Nuevo
  Target,      // Nuevo
  ListChecks,  // Nuevo
  Percent      // Nuevo
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

// Importa tus servicios
import { listarProyectos, aceptarProyecto } from "@/hooks/ServiceProyecto";

// --------------------------------------------------
// 1. Interfaces Actualizadas
// --------------------------------------------------

interface Persona {
  nombre: string;
  apellido: string;
}

interface CuentaData {
  correo: string;
  persona?: Persona;
}

interface RolData {
  nombre: string;
}

interface ColaboradorRaw {
  external: string;
  estado: boolean;
  rol?: RolData;
  cuentum?: CuentaData;
  Cuenta?: CuentaData;
}

interface ProyectoRaw {
  external: string;
  nombre: string;
  acronimo: string;
  descripcion: string;
  tiempoSprint: number;
  nroSprints: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  estaActivo: boolean;
  // Nuevos campos del backend
  objetivosCalidad?: string;
  definicionDone?: string;
  criteriosEntradaQA?: string;
  coberturaPruebasMinima?: number;
  // Relaciones
  colaboradors?: ColaboradorRaw[];
  Colaboradors?: ColaboradorRaw[];
}

interface ProyectoUI {
  external: string;
  nombre: string;
  acronimo: string;
  descripcion: string;
  tiempoSprint: number;
  nroSprints: number;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  estaActivo: boolean;
  // Nuevos campos para la UI
  objetivosCalidad: string;
  definicionDone: string;
  criteriosEntradaQA: string;
  coberturaPruebasMinima: number;
  equipo: {
    nombre: string;
    apellido: string;
    correo: string;
    rol: string;
    estado: boolean;
  }[];
}

export default function GestionProyectos() {
  const [data, setData] = useState<ProyectoUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

  const router = useRouter();

  // --------------------------------------------------
  // Cargar y Normalizar datos
  // --------------------------------------------------
  const fetchData = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      setLoading(true);
      const resultado = await listarProyectos(token);

      if (resultado?.response?.status === 401) {
        sessionStorage.removeItem("token");
        router.push("/");
        return;
      }

      if (resultado.data && Array.isArray(resultado.data)) {
        const datosLimpios = resultado.data.map((item: ProyectoRaw) => {
          const listaColaboradores =
            item.colaboradors || item.Colaboradors || [];

          return {
            external: item.external,
            nombre: item.nombre,
            acronimo: item.acronimo,
            descripcion: item.descripcion,
            tiempoSprint: item.tiempoSprint,
            nroSprints: item.nroSprints,
            fechaInicio: item.fechaInicio,
            fechaFin: item.fechaFin,
            estado: item.estado,
            estaActivo: item.estaActivo,
            
            // Mapeo de campos nuevos con validación
            objetivosCalidad: item.objetivosCalidad || "No definidos",
            definicionDone: item.definicionDone || "No definida",
            criteriosEntradaQA: item.criteriosEntradaQA || "No definidos",
            coberturaPruebasMinima: item.coberturaPruebasMinima || 0,

            equipo: listaColaboradores.map((col) => {
              const cuenta = col.cuentum || col.Cuenta;
              const persona = cuenta?.persona;

              return {
                nombre: persona?.nombre || "Sin nombre",
                apellido: persona?.apellido || "",
                correo: cuenta?.correo || "Sin correo",
                rol: col.rol?.nombre || "Sin Rol",
                estado: col.estado,
              };
            }),
          };
        });

        setData(datosLimpios);
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

  const toggleRow = (external_id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(external_id)) {
      newExpanded.delete(external_id);
    } else {
      newExpanded.add(external_id);
    }
    setExpandedRows(newExpanded);
  };

  // --------------------------------------------------
  // Cambio de estado
  // --------------------------------------------------
  const handleCambiarEstado = async (item: ProyectoUI) => {
    const accion = item.estaActivo ? "Desactivar" : "Activar";
    const textoAccion = item.estaActivo
      ? "El proyecto dejará de estar visible."
      : "El proyecto volverá a estar activo.";
    const colorBoton = item.estaActivo ? "#d33" : "#10b981";

    const confirmacion = await Swal.fire({
      title: `¿${accion} el proyecto?`,
      text: textoAccion,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: `Sí, ${accion.toLowerCase()}`,
      cancelButtonText: "Cancelar",
      confirmButtonColor: colorBoton,
      cancelButtonColor: "#3085d6",
    });

    if (!confirmacion.isConfirmed) return;

    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      const resp = await aceptarProyecto(item.external, token);

      if (resp?.code === 200) {
        await Swal.fire({
          title: "¡Éxito!",
          text:
            resp.msg ||
            `Proyecto ${
              item.estaActivo ? "desactivado" : "activado"
            } correctamente`,
          icon: "success",
          confirmButtonText: "Aceptar",
        });
        fetchData();
      } else {
        throw new Error(resp?.msg || "Error desconocido");
      }
    } catch (err) {
      console.error("Error al cambiar estado:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudo actualizar el estado del proyecto.",
        icon: "error",
      });
    }
  };

  const filteredData = data.filter(
    (item) =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.acronimo.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <main className="flex-1 w-full">
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Solicitudes de Proyectos
              </h1>
            </div>
            <ThemeToggle />
          </div>

          <hr className="border-border" />

          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
            <div className="relative w-full max-w-sm">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
              </div>
              <input
                type="text"
                placeholder="Buscar por nombre o acrónimo..."
                className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="text-sm text-muted-foreground">
              Total: <strong>{data.length}</strong> proyectos
            </div>
          </div>

          <div className="overflow-hidden border border-border rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3 w-10"></th>
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="px-4 py-3">Fechas</th>
                    <th className="px-4 py-3">Sprints</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Cargando proyectos...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No se encontraron registros.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => {
                      const isExpanded = expandedRows.has(item.external);

                      return (
                        <React.Fragment key={item.external}>
                          {/* FILA PRINCIPAL */}
                          <tr
                            className={`hover:bg-muted/50 transition-colors ${
                              isExpanded ? "bg-muted/30" : ""
                            }`}
                          >
                            <td className="px-4 py-3">
                              <button
                                onClick={() => toggleRow(item.external)}
                                className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors"
                              >
                                {isExpanded ? (
                                  <ChevronUp size={16} />
                                ) : (
                                  <ChevronDown size={16} />
                                )}
                              </button>
                            </td>

                            <td className="px-4 py-3">
                              <div className="font-medium">{item.nombre}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                {item.acronimo}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-muted-foreground text-xs space-y-1">
                              <div className="flex items-center gap-1">
                                <Calendar
                                  size={12}
                                  className="text-emerald-600"
                                />
                                {new Date(
                                  item.fechaInicio
                                ).toLocaleDateString()}
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar size={12} className="text-red-600" />
                                {new Date(item.fechaFin).toLocaleDateString()}
                              </div>
                            </td>

                            <td className="px-4 py-3 text-muted-foreground">
                              <span className="inline-flex items-center gap-1 bg-muted px-2 py-0.5 rounded text-xs">
                                <Clock size={12} />
                                {item.nroSprints} x {item.tiempoSprint} días
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border
                                ${item.estado === "En Planificación" ? "bg-blue-50 text-blue-700 border-blue-200" : 
                                  item.estado === "En Ejecución" ? "bg-amber-50 text-amber-700 border-amber-200" :
                                  "bg-gray-50 text-gray-700 border-gray-200"
                                }`}>
                                {item.estado}
                              </span>
                            </td>

                            <td className="px-4 py-3">
                              <button
                                onClick={() => handleCambiarEstado(item)}
                                className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-colors
                                  ${
                                    item.estaActivo
                                      ? "bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-700"
                                      : "bg-red-600 hover:bg-red-700 text-white border border-red-700"
                                  }`}
                              >
                                {item.estaActivo ? <>Activo</> : <>Inactivo</>}
                              </button>
                            </td>
                          </tr>

                          {/* FILA EXPANDIDA (DETALLES COMPLETOS) */}
                          {isExpanded && (
                            <tr className="bg-muted/10 border-b border-border">
                              <td colSpan={6} className="px-4 py-4">
                                <div className="flex flex-col gap-6 pl-8 animate-in fade-in slide-in-from-top-1 duration-200">
                                  
                                  {/* SECCIÓN SUPERIOR: DESCRIPCIÓN Y EQUIPO */}
                                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Columna Izquierda: Descripción */}
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                        Descripción General
                                      </h4>
                                      <p className="text-sm text-muted-foreground leading-relaxed bg-background p-3 rounded border border-border shadow-sm whitespace-pre-wrap">
                                        {item.descripcion || "Sin descripción."}
                                      </p>
                                    </div>

                                    {/* Columna Derecha: Equipo */}
                                    <div>
                                      <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                                        <Users size={16} className="text-blue-500" />
                                        Equipo Asignado
                                      </h4>
                                      <div className="bg-background rounded border border-border shadow-sm overflow-hidden max-h-40 overflow-y-auto">
                                        {item.equipo.length > 0 ? (
                                          <ul className="divide-y divide-border">
                                            {item.equipo.map((col, idx) => (
                                              <li key={idx} className="px-3 py-2 flex items-center justify-between hover:bg-muted/30">
                                                <div className="flex items-center gap-3">
                                                  <div className="p-1.5 bg-blue-50 text-blue-600 rounded-full dark:bg-blue-900/20 dark:text-blue-400">
                                                    <User size={14} />
                                                  </div>
                                                  <div>
                                                    <p className="text-xs font-semibold text-foreground">
                                                      {col.nombre} {col.apellido}
                                                    </p>
                                                    <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                                                      <Mail size={10} />
                                                      {col.correo}
                                                    </div>
                                                  </div>
                                                </div>
                                                <span className="text-[10px] font-medium px-2 py-0.5 bg-muted rounded border border-border">
                                                  {col.rol}
                                                </span>
                                              </li>
                                            ))}
                                          </ul>
                                        ) : (
                                          <div className="p-4 text-center text-xs text-muted-foreground">
                                            No hay colaboradores asignados.
                                          </div>
                                        )}
                                      </div>
                                    </div>
                                  </div>

                                  {/* SECCIÓN INFERIOR: ESTÁNDARES DE CALIDAD Y QA */}
                                  <div className="mt-2">
                                    <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 pb-2 border-b border-border">
                                      <ShieldCheck size={16} className="text-emerald-500" />
                                      Estándares de Calidad y QA
                                    </h4>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                      
                                      {/* Objetivos de Calidad */}
                                      <div className="bg-background p-3 rounded border border-border shadow-sm">
                                        <h5 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
                                          <Target size={14} className="text-indigo-500" /> Objetivos de Calidad
                                        </h5>
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                          {item.objetivosCalidad}
                                        </p>
                                      </div>

                                      {/* Definición de Done */}
                                      <div className="bg-background p-3 rounded border border-border shadow-sm">
                                        <h5 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
                                          <CheckCircle2 size={14} className="text-indigo-500" /> Definición de Done (DoD)
                                        </h5>
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                          {item.definicionDone}
                                        </p>
                                      </div>

                                      {/* Criterios de Entrada QA */}
                                      <div className="bg-background p-3 rounded border border-border shadow-sm">
                                        <h5 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
                                          <ListChecks size={14} className="text-indigo-500" /> Criterios Entrada QA
                                        </h5>
                                        <p className="text-xs text-muted-foreground whitespace-pre-wrap">
                                          {item.criteriosEntradaQA}
                                        </p>
                                      </div>

                                      {/* Cobertura de Pruebas */}
                                      <div className="bg-background p-3 rounded border border-border shadow-sm flex items-center justify-between">
                                        <div>
                                          <h5 className="text-xs font-bold text-foreground mb-1 flex items-center gap-2">
                                            <Percent size={14} className="text-indigo-500" /> Cobertura Mínima de Pruebas
                                          </h5>
                                          <p className="text-xs text-muted-foreground">
                                            Porcentaje requerido para aprobar despliegue.
                                          </p>
                                        </div>
                                        <div className="text-xl font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-3 py-1 rounded-md">
                                          {item.coberturaPruebasMinima}%
                                        </div>
                                      </div>

                                    </div>
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

          <div className="text-sm text-muted-foreground pt-2">
            Mostrando {filteredData.length} proyectos
          </div>
        </div>
      </main>
    </div>
  );
}