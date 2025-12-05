"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  Calendar,
  Clock,
  CheckCircle2,
  Users,
  Target,
  ShieldCheck,
  FileText,
  Activity,
  ArrowLeft,
  MoreVertical,
  Plus,
  Briefcase,
  ListFilter,
  Search,
} from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/SidebarProyecto";

import { proyecto } from "@/hooks/ServiceProyecto";
import { listarRequisitos } from "@/hooks/ServiceReq";

// =======================
// INTERFACES (Sin cambios)
// =======================
interface Persona {
  nombre: string;
  apellido: string;
}

interface Cuenta {
  correo: string;
  external: string;
  Persona: Persona;
}

interface Rol {
  nombre: string;
}

interface Colaborador {
  rolID: number;
  estado: string;
  fechaAsignacion: string;
  Rol: Rol;
  Cuenta: Cuenta;
}

interface Requisito {
  externalMaster: string;
  nombre: string;
  descripcion: string;
  prioridad: "Alta" | "Media" | "Baja";
  tipo: "RF" | "RNF";
  version: number;
  estado: number;
}

interface ProyectoData {
  nombre: string;
  acronimo: string;
  descripcion: string;
  fechaInicio: string;
  fechaFin: string;
  estado: string;
  tiempoSprint: number;
  nroSprints: number;
  objetivosCalidad: string;
  definicionDone: string;
  criteriosEntradaQA: string;
  coberturaPruebasMinima: number;
  estaActivo: boolean;
  external: string;
  Colaboradors: Colaborador[];
}

// =======================
// COMPONENTE PRINCIPAL
// =======================
export default function DetalleProyectoPage({
  params,
}: {
  params: Promise<{ external: string }>;
}) {
  const { external } = React.use(params);
  const router = useRouter();

  // Estados
  const [projectData, setProjectData] = useState<ProyectoData | null>(null);
  const [requisitos, setRequisitos] = useState<Requisito[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Fetch Data (Sin cambios en lógica)
  const fetchData = async () => {
    if (!external) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");

      const projectResponse = await proyecto(external, token);

      if (projectResponse.data && projectResponse.code !== 500) {
        const raw = projectResponse.data;
        const cleanedProject = {
          ...raw,
          Colaboradors:
            raw.colaboradors?.map((c: any) => ({
              rolID: c.rolID,
              estado: c.estado,
              fechaAsignacion: c.fechaAsignacion,
              Rol: { nombre: c.rol?.nombre || "SIN ROL" },
              Cuenta: {
                correo: c.cuentum?.correo,
                external: c.cuentum?.external,
                Persona: {
                  nombre: c.cuentum?.persona?.nombre,
                  apellido: c.cuentum?.persona?.apellido,
                },
              },
            })) || [],
        };
        setProjectData(cleanedProject);
      }

      const reqResponse = await listarRequisitos(external, token);
      if (reqResponse && reqResponse.requisitos) {
        setRequisitos(reqResponse.requisitos);
      } else {
        setRequisitos([]);
      }
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (external) {
      fetchData();
    }
  }, [external]);

  // Filtrado para el buscador
  const filteredRequisitos = useMemo(() => {
    return requisitos.filter(
      (req) =>
        req.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        req.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requisitos, searchTerm]);

  // Helpers UI
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // ==========================================
  // CAMBIO: Colores Sólidos / Mate (Sin transparencia)
  // ==========================================
  const getPriorityColor = (prioridad: string) => {
    const p = prioridad ? prioridad.toLowerCase() : "";

    // Estilo Mate: Fondos sólidos, texto con alto contraste, bordes definidos.
    // Light: bg-color-100 (más fuerte que 50)
    // Dark: bg-color-600/700 (Sólido) con texto blanco

    if (p === "alta")
      return "text-red-800 bg-red-100 border-red-300 dark:bg-red-700 dark:text-white dark:border-red-500";

    if (p === "media")
      return "text-orange-800 bg-orange-100 border-orange-300 dark:bg-orange-600 dark:text-white dark:border-orange-500";

    return "text-emerald-800 bg-emerald-100 border-emerald-300 dark:bg-emerald-600 dark:text-white dark:border-emerald-500";
  };

  const StatCard = ({ icon: Icon, label, value, subtext, colorClass }: any) => (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
      {/* Icono con fondo sólido mate */}
      <div
        className={`p-3 rounded-lg shadow-sm ${
          colorClass ||
          "bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white"
        }`}
      >
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          {label}
        </p>
        <h3 className="text-lg font-bold text-foreground">{value}</h3>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-background text-foreground overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !projectData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <Briefcase size={48} className="text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold text-foreground">
                Proyecto no encontrado
              </h2>
              <button
                onClick={() => router.back()}
                className="mt-4 text-primary hover:underline font-medium"
              >
                Volver
              </button>
            </div>
          ) : (
            <>
              {/* HEADER */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-card p-6 rounded-xl border border-border shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button
                      onClick={() => router.back()}
                      className="text-muted-foreground hover:text-foreground transition"
                    >
                      <ArrowLeft size={20} />
                    </button>
                    {/* Acrónimo: Azul Sólido */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded shadow-sm bg-blue-100 text-blue-900 border border-blue-200 dark:bg-blue-600 dark:text-white dark:border-blue-500">
                      {projectData.acronimo}
                    </span>
                    {/* Estado: Gris Sólido */}
                    <span className="text-xs font-bold px-2 py-0.5 rounded shadow-sm bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-600">
                      {projectData.estado}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {projectData.nombre}
                  </h1>
                  <p className="text-sm text-muted-foreground line-clamp-1">
                    {projectData.descripcion}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm text-sm font-medium"
                    onClick={() =>
                      router.push(
                        `/user/agregarRequisito/${projectData.external}`
                      )
                    }
                  >
                    <Plus size={16} />
                    Nuevo Requisito
                  </button>

                  <ThemeToggle />
                </div>
              </div>

              {/* KPIS - Colores actualizados a sólidos */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                  icon={Clock}
                  label="Sprints"
                  value={projectData.nroSprints}
                  subtext={`${projectData.tiempoSprint} días/sprint`}
                  colorClass="bg-orange-100 text-orange-800 dark:bg-orange-600 dark:text-white"
                />
                <StatCard
                  icon={Calendar}
                  label="Fecha Fin"
                  value={formatDate(projectData.fechaFin)}
                  subtext={`Inicio: ${formatDate(projectData.fechaInicio)}`}
                  colorClass="bg-purple-100 text-purple-800 dark:bg-purple-600 dark:text-white"
                />
                <StatCard
                  icon={ShieldCheck}
                  label="Calidad Min"
                  value={`${projectData.coberturaPruebasMinima}%`}
                  subtext="Cobertura"
                  colorClass="bg-emerald-100 text-emerald-800 dark:bg-emerald-600 dark:text-white"
                />
                <StatCard
                  icon={FileText}
                  label="Total Requisitos"
                  value={requisitos.length}
                  subtext="En Backlog"
                  colorClass="bg-blue-100 text-blue-800 dark:bg-blue-600 dark:text-white"
                />
              </div>

              {/* GRID PRINCIPAL */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* COLUMNA IZQUIERDA (2/3): REQUISITOS */}
                <div className="xl:col-span-2 space-y-6">
                  <div className="bg-card rounded-xl border border-border shadow-sm flex flex-col">
                    <div className="p-4 border-b border-border flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/40">
                      <div className="flex items-center gap-2">
                        <ListFilter className="text-primary" size={20} />
                        <h3 className="font-semibold text-foreground">
                          Backlog de Requisitos
                        </h3>

                        <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full border border-border font-bold">
                          {filteredRequisitos.length}
                        </span>
                        <button
                          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm text-sm font-medium"
                          onClick={() =>
                            router.push(
                              `/user/proyecto/requisito/lista/${projectData.external}`
                            )
                          }
                        >
                          Lista detallada de requisitos y versiones
                        </button>
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search
                          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground"
                          size={16}
                        />
                        <input
                          type="text"
                          placeholder="Buscar requisito..."
                          className="w-full pl-9 pr-4 py-1.5 text-sm border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 max-h-[600px]">
                      {filteredRequisitos.length > 0 ? (
                        filteredRequisitos.map((req) => (
                          <div
                            key={req.externalMaster}
                            className="group p-3 rounded-lg border border-border hover:border-primary/50 hover:bg-muted/50 transition-all cursor-default bg-background/50"
                          >
                            <div className="flex justify-between items-start gap-4">
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {/* TIPO DE REQUISITO (RF/RNF): Colores Sólidos */}
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                                      req.tipo === "RF"
                                        ? "bg-blue-100 text-blue-900 border-blue-200 dark:bg-blue-600 dark:text-white dark:border-blue-500"
                                        : "bg-purple-100 text-purple-900 border-purple-200 dark:bg-purple-600 dark:text-white dark:border-purple-500"
                                    }`}
                                  >
                                    {req.tipo}
                                  </span>
                                  <h4 className="text-sm font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                                    {req.nombre}
                                  </h4>
                                </div>
                                <p className="text-xs text-muted-foreground line-clamp-2">
                                  {req.descripcion}
                                </p>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                {/* PRIORIDAD: Usa la nueva función con colores sólidos */}
                                <span
                                  className={`text-[10px] font-bold px-2 py-0.5 rounded shadow-sm border ${getPriorityColor(
                                    req.prioridad
                                  )}`}
                                >
                                  {req.prioridad}
                                </span>
                                <span className="text-[10px] text-muted-foreground font-medium">
                                  v{req.version}
                                </span>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                          <ListFilter className="h-10 w-10 text-muted-foreground mb-2" />
                          <p className="text-sm text-muted-foreground">
                            {searchTerm
                              ? "No se encontraron resultados"
                              : "No hay requisitos registrados"}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA (1/3): INFO TECNICA */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Calidad y DoD */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-foreground">
                      <Target className="text-red-600" size={20} />
                      Objetivos de Calidad
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground leading-relaxed whitespace-pre-line border border-border max-h-40 overflow-y-auto custom-scrollbar">
                      {projectData.objetivosCalidad ||
                        "No se han definido objetivos de calidad."}
                    </div>
                  </div>

                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-foreground">
                      <CheckCircle2 className="text-emerald-600" size={20} />
                      Definition of Done
                    </h3>
                    <div className="bg-muted/50 p-4 rounded-lg text-sm text-muted-foreground leading-relaxed whitespace-pre-line border border-border max-h-40 overflow-y-auto custom-scrollbar">
                      {projectData.definicionDone || "No definido."}
                    </div>
                  </div>

                  {/* Equipo */}
                  <div className="bg-card rounded-xl border border-border shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-border bg-muted/40">
                      <h3 className="flex items-center gap-2 font-semibold text-sm text-foreground">
                        <Users className="text-primary" size={18} /> Equipo (
                        {projectData.Colaboradors.length})
                        <button
                          className="flex items-center gap-1 px-2 py-0 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition shadow-sm text-sm font-medium"
                          onClick={() =>
                            router.push(
                              `/user/proyecto/requisito/lista/${projectData.external}`
                            )
                          }
                        >
                          Agregar miembros
                        </button>
                      </h3>
                    </div>
                    <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                      {projectData.Colaboradors.map((colab, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-3 p-2 rounded-md hover:bg-muted transition"
                        >
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs shadow-sm">
                            {colab.Cuenta?.Persona?.nombre?.[0]}
                            {colab.Cuenta?.Persona?.apellido?.[0]}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold truncate text-foreground">
                              {colab.Cuenta.Persona.nombre}{" "}
                              {colab.Cuenta.Persona.apellido}
                            </p>
                            <p className="text-[10px] text-muted-foreground truncate">
                              {colab.Cuenta.correo}
                            </p>
                          </div>
                          {/* Rol: Color Sólido */}
                          <span
                            className={`text-[10px] font-bold px-1.5 py-0.5 rounded border shadow-sm ${
                              colab.Rol.nombre === "SCRUM_MASTER"
                                ? "bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-600 dark:text-white dark:border-amber-500"
                                : "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-700 dark:text-white dark:border-slate-500"
                            }`}
                          >
                            {colab.Rol.nombre === "SCRUM_MASTER"
                              ? "SCRUM_MASTER"
                              : "Dev"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
