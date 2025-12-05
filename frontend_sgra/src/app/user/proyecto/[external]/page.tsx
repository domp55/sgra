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
  Search // Importamos la lupa
} from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/SidebarUser";

import { proyecto } from "@/hooks/ServiceProyecto";
import { listarRequisitos } from "@/hooks/ServiceReq";

// =======================
// INTERFACES
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
  const [searchTerm, setSearchTerm] = useState(""); // Estado para el buscador

  // Fetch Data
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
          Colaboradors: raw.colaboradors?.map((c: any) => ({
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
    return requisitos.filter(req => 
      req.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [requisitos, searchTerm]);

  // Helpers UI
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric", month: "short", day: "numeric",
    });
  };

  const getPriorityColor = (prioridad: string) => {
      const p = prioridad ? prioridad.toLowerCase() : "";
      if (p === "alta") return "text-red-700 bg-red-50 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800";
      if (p === "media") return "text-orange-700 bg-orange-50 border-orange-200 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800";
      return "text-green-700 bg-green-50 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800";
  };

  const StatCard = ({ icon: Icon, label, value, subtext, colorClass }: any) => (
    <div className="bg-white dark:bg-card p-4 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
      <div className={`p-3 rounded-lg ${colorClass || "bg-blue-50 text-blue-600 dark:bg-blue-900/20"}`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">{label}</p>
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{value}</h3>
        {subtext && (
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">{subtext}</p>
        )}
      </div>
    </div>
  );

  return (
    <div className="flex h-screen w-full bg-gray-50 dark:bg-zinc-950 text-foreground overflow-hidden">
      <Sidebar />

      <main className="flex-1 overflow-y-auto">
        <div className="p-6 md:p-8 max-w-[1600px] mx-auto space-y-6 pb-20">
          
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          ) : !projectData ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
               <Briefcase size={48} className="text-gray-300 mb-4"/>
              <h2 className="text-xl font-semibold text-gray-700">Proyecto no encontrado</h2>
              <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline font-medium">
                Volver
              </button>
            </div>
          ) : (
            <>
              {/* HEADER COMPACTO */}
              <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-white dark:bg-card p-6 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-3 mb-2">
                    <button onClick={() => router.back()} className="text-gray-400 hover:text-gray-900 dark:hover:text-white transition">
                      <ArrowLeft size={20} />
                    </button>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                        {projectData.acronimo}
                    </span>
                    <span className="text-xs font-bold px-2 py-0.5 rounded bg-gray-100 text-gray-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {projectData.estado}
                    </span>
                  </div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
                      {projectData.nombre}
                  </h1>
                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-1">
                      {projectData.descripcion}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                    <button 
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm text-sm font-medium"
                        onClick={() => router.push(`/user/agregarRequisito/${projectData.external}`)}
                    >
                        <Plus size={16} />
                        Nuevo Requisito
                    </button>
                    <ThemeToggle />
                </div>
              </div>

              {/* KPIS */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard icon={Clock} label="Sprints" value={projectData.nroSprints} subtext={`${projectData.tiempoSprint} días/sprint`} colorClass="bg-orange-50 text-orange-600 dark:bg-orange-900/20" />
                <StatCard icon={Calendar} label="Fecha Fin" value={formatDate(projectData.fechaFin)} subtext={`Inicio: ${formatDate(projectData.fechaInicio)}`} colorClass="bg-purple-50 text-purple-600 dark:bg-purple-900/20" />
                <StatCard icon={ShieldCheck} label="Calidad Min" value={`${projectData.coberturaPruebasMinima}%`} subtext="Cobertura" colorClass="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" />
                <StatCard icon={FileText} label="Total Requisitos" value={requisitos.length} subtext="En Backlog" colorClass="bg-blue-50 text-blue-600 dark:bg-blue-900/20" />
              </div>

              {/* GRID PRINCIPAL */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                
                {/* COLUMNA IZQUIERDA (2/3): REQUISITOS CON SCROLL */}
                <div className="xl:col-span-2 space-y-6">
                  
                  <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col">
                    
                    {/* Header de la lista con Buscador */}
                    <div className="p-4 border-b border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4 bg-gray-50/50 dark:bg-zinc-900/30">
                        <div className="flex items-center gap-2">
                          <ListFilter className="text-indigo-600" size={20} />
                          <h3 className="font-semibold text-gray-900 dark:text-white">Backlog de Requisitos</h3>
                          <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full dark:bg-zinc-700 dark:text-gray-300">
                              {filteredRequisitos.length}
                          </span>
                        </div>
                        
                        {/* Buscador */}
                        <div className="relative w-full sm:w-64">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                          <input 
                              type="text" 
                              placeholder="Buscar requisito..." 
                              className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:bg-zinc-950 dark:border-zinc-700"
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                    </div>

                    {/* --- AQUI ESTA EL SCROLL MÁGICO --- */}
                    {/* 'max-h-[600px]' limita la altura y 'overflow-y-auto' activa el scroll */}
                    <div className="overflow-y-auto custom-scrollbar p-2 space-y-2 max-h-[600px]">
                        {filteredRequisitos.length > 0 ? (
                            filteredRequisitos.map((req) => (
                                <div key={req.externalMaster} className="group p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:bg-blue-50/30 dark:border-zinc-800 dark:hover:bg-zinc-800/50 transition-all cursor-default bg-white dark:bg-zinc-900/20">
                                    <div className="flex justify-between items-start gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                                                    req.tipo === "RF" 
                                                    ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800" 
                                                    : "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800"
                                                }`}>
                                                    {req.tipo}
                                                </span>
                                                <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate group-hover:text-blue-700 transition-colors">
                                                    {req.nombre}
                                                </h4>
                                            </div>
                                            <p className="text-xs text-gray-500 line-clamp-2 dark:text-gray-400">
                                                {req.descripcion}
                                            </p>
                                        </div>
                                        
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${getPriorityColor(req.prioridad)}`}>
                                                {req.prioridad}
                                            </span>
                                            <span className="text-[10px] text-gray-400">v{req.version}</span>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="flex flex-col items-center justify-center py-12 text-center opacity-60">
                                <ListFilter className="h-10 w-10 text-gray-300 mb-2" />
                                <p className="text-sm text-gray-500">
                                  {searchTerm ? "No se encontraron resultados" : "No hay requisitos registrados"}
                                </p>
                            </div>
                        )}
                    </div>
                  </div>
                </div>

                {/* COLUMNA DERECHA (1/3): INFO TECNICA */}
                <div className="xl:col-span-1 space-y-6">
                  {/* Calidad y DoD */}
                  <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                      <Target className="text-red-500" size={20} />
                      Objetivos de Calidad
                    </h3>
                    <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line border border-gray-100 dark:border-zinc-800 max-h-40 overflow-y-auto custom-scrollbar">
                      {projectData.objetivosCalidad || "No se han definido objetivos de calidad."}
                    </div>
                  </div>

                  {/* Definition of Done */}
                   <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 font-semibold text-lg mb-4 text-gray-900 dark:text-white">
                        <CheckCircle2 className="text-green-600" size={20} />
                        Definition of Done
                      </h3>
                      <div className="bg-gray-50 dark:bg-zinc-900/50 p-4 rounded-lg text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line border border-gray-100 dark:border-zinc-800 max-h-40 overflow-y-auto custom-scrollbar">
                        {projectData.definicionDone || "No definido."}
                      </div>
                    </div>

                    {/* Equipo */}
                    <div className="bg-white dark:bg-card rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm overflow-hidden">
                        <div className="p-4 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-zinc-900/30">
                            <h3 className="flex items-center gap-2 font-semibold text-sm text-gray-900 dark:text-white">
                                <Users className="text-indigo-600" size={18} /> Equipo ({projectData.Colaboradors.length})
                            </h3>
                        </div>
                        <div className="p-2 max-h-60 overflow-y-auto custom-scrollbar">
                             {projectData.Colaboradors.map((colab, index) => (
                                <div key={index} className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-50 dark:hover:bg-zinc-800 transition">
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center font-bold text-xs">
                                        {colab.Cuenta?.Persona?.nombre?.[0]}{colab.Cuenta?.Persona?.apellido?.[0]}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-semibold truncate dark:text-gray-200">
                                            {colab.Cuenta.Persona.nombre} {colab.Cuenta.Persona.apellido}
                                        </p>
                                        <p className="text-[10px] text-gray-500 truncate">{colab.Cuenta.correo}</p>
                                    </div>
                                    <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded border border-gray-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700">
                                        {colab.Rol.nombre === "SCRUM_MASTER" ? "Master" : "Dev"}
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