"use client";

import React, { useState, useEffect } from "react";
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
} from "lucide-react";
import { useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/SidebarUser";

import { proyecto } from "@/hooks/ServiceProyecto";

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
  RequisitoMasters: any[];
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
  const external = React.use(params);
  const router = useRouter();

  // Estados
  const [data, setData] = useState<ProyectoData | null>(null);
  const [loading, setLoading] = useState(true);

  // ============================
  // FUNCIÓN PARA OBTENER DATOS
  // ============================
  const fetchData = async () => {
    try {
      setLoading(true);

      const token = sessionStorage.getItem("token");
      const response = await proyecto(external.external, token);

      if (response.data && response.code !== 500) {
        const raw = response.data;

        // Normalizar colaboradores
        const cleaned = {
          ...raw,
          Colaboradors:
            raw.colaboradors?.map((c: any) => ({
              rolID: c.rolID,
              estado: c.estado,
              fechaAsignacion: c.fechaAsignacion,
              Rol: {
                nombre: c.rol?.nombre || "SIN ROL",
              },
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

        setData(cleaned);
      }
    } catch (error) {
      console.error("Error cargando proyecto:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [external.external]);

  // ============================
  // FORMATEAR FECHA
  // ============================
  const formatDate = (dateString: string) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Tarjeta KPI
  const StatCard = ({ icon: Icon, label, value, subtext }: any) => (
    <div className="bg-card p-4 rounded-xl border border-border shadow-sm flex items-start space-x-4">
      <div className="p-2 bg-primary/10 rounded-lg text-primary">
        <Icon size={24} />
      </div>
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <h3 className="text-xl font-bold text-foreground">{value}</h3>
        {subtext && (
          <p className="text-xs text-muted-foreground mt-1">{subtext}</p>
        )}
      </div>
    </div>
  );

  // ============================
  // RENDER
  // ============================
  return (
    <div className="flex min-h-screen w-full bg-background text-foreground">
      <Sidebar />

      <main className="flex-1 w-full overflow-y-auto">
        <div className="p-20 space-y-8 w-full max-w-7xl mx-auto">
          {/* LOADING */}
          {loading ? (
            <div className="flex h-96 items-center justify-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : !data ? (
            <div className="text-center py-10">
              <h2 className="text-xl">No se encontró el proyecto.</h2>
              <button
                onClick={() => router.back()}
                className="mt-4 text-primary hover:underline"
              >
                Volver
              </button>
            </div>
          ) : (
            <>
              {/* ============================================================
                  ENCABEZADO + BOTONES (AGREGAR REQUISITOS - AGREGAR PERSONAS)
              ============================================================ */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                {/* Lado Izquierdo */}
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => router.back()}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <ArrowLeft size={20} />
                    </button>

                    <span className=" text-xs font-semibold px-2.5 py-0.5 rounded bg-sky-600 text-white border border-sky-700 dark:bg-sky-600 dark:text-white">
                      {data.acronimo}
                    </span>

                    <span
                      className={`
                        text-xs font-semibold px-2.5 py-0.5 rounded
                        ${
                          data.estado === "ACTIVO"
                            ? "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-600 dark:text-white"
                            : data.estado === "INACTIVO"
                            ? "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-600 dark:text-white"
                            : "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-600 dark:text-white"
                        }
                      `}
                    >
                      {data.estado}
                    </span>
                  </div>

                  <h1 className="text-3xl font-bold tracking-tight">
                    {data.nombre}
                  </h1>
                  <p className="text-muted-foreground max-w-2xl">
                    {data.descripcion}
                  </p>
                </div>

                {/* Lado Derecho: Botones + Theme */}
                <div className="flex flex-col items-end gap-3">
                  {/* BOTONES */}
          <div className="flex gap-3">
  <button 
    className="px-4 py-2 bg-blue-300 text-white rounded-lg hover:bg-blue-400 transition shadow-md">
    Agregar requisitos
  </button>

  <button 
    className="px-4 py-2 bg-blue-300 text-white rounded-lg hover:bg-blue-400 transition shadow-md">
    Agregar personas al equipo
  </button>
</div>


                  {/* TEMA + OPCIONES */}
                  <div className="flex items-center gap-3">
                    <ThemeToggle />
                    <button className="btn-icon p-2 hover:bg-muted rounded-full">
                      <MoreVertical size={20} />
                    </button>
                  </div>
                </div>
              </div>

              <hr className="border-border" />

              {/* ===================== */}
              {/* TARJETAS KPI */}
              {/* ===================== */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                  icon={Clock}
                  label="Duración Sprint"
                  value={`${data.tiempoSprint} Días`}
                  subtext={`Total Sprints: ${data.nroSprints}`}
                />
                <StatCard
                  icon={Calendar}
                  label="Inicio Proyecto"
                  value={formatDate(data.fechaInicio)}
                  subtext={`Fin: ${formatDate(data.fechaFin)}`}
                />
                <StatCard
                  icon={ShieldCheck}
                  label="Cobertura Pruebas"
                  value={`${data.coberturaPruebasMinima}%`}
                  subtext="Mínimo Requerido"
                />
                <StatCard
                  icon={FileText}
                  label="Requisitos"
                  value={data.RequisitoMasters?.length || 0}
                />
              </div>

              {/* ===================== */}
              {/* DETALLES Y EQUIPO */}
              {/* ===================== */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* IZQUIERDA */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Objetivos */}
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                    <h3 className="flex items-center gap-2 font-semibold text-lg mb-4">
                      <Target className="text-primary" size={20} />
                      Objetivos de Calidad
                    </h3>
                    <div className="bg-muted/30 p-4 rounded-lg text-sm leading-relaxed whitespace-pre-line">
                      {data.objetivosCalidad || "No definido."}
                    </div>
                  </div>

                  {/* DoD y QA */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 font-semibold text-lg mb-4">
                        <CheckCircle2 className="text-green-600" size={20} />
                        Definition of Done (DoD)
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {data.definicionDone || "No definido."}
                      </p>
                    </div>

                    <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
                      <h3 className="flex items-center gap-2 font-semibold text-lg mb-4">
                        <Activity className="text-blue-600" size={20} />
                        Criterios Entrada QA
                      </h3>
                      <p className="text-sm text-muted-foreground whitespace-pre-line">
                        {data.criteriosEntradaQA || "No definido."}
                      </p>
                    </div>
                  </div>
                </div>

                {/* DERECHA - EQUIPO */}
                <div className="lg:col-span-1">
                  <div className="bg-card rounded-xl border border-border p-6 shadow-sm h-full">
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="flex items-center gap-2 font-semibold text-lg">
                        <Users className="text-primary" size={20} />
                        Equipo ({data.Colaboradors.length})
                      </h3>
                    </div>

                    <div className="space-y-4">
                      {data.Colaboradors.length > 0 ? (
                        data.Colaboradors.map((colab, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border"
                          >
                            {/* Avatar */}
                            <div className="h-10 w-10 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                              {colab.Cuenta?.Persona?.nombre?.[0]}
                              {colab.Cuenta?.Persona?.apellido?.[0]}
                            </div>

                            {/* Nombre */}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">
                                {colab.Cuenta.Persona.nombre}{" "}
                                {colab.Cuenta.Persona.apellido}
                              </p>
                              <p className="text-xs text-muted-foreground truncate">
                                {colab.Cuenta.correo}
                              </p>
                            </div>

                            {/* Rol */}
                            <span className="text-xs px-2 py-1 bg-muted rounded text-muted-foreground font-medium">
                              {colab.Rol.nombre}
                            </span>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No hay colaboradores asignados.
                        </p>
                      )}
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
