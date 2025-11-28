"use client";

import React, { useState, useEffect } from "react";
import { CheckCircle, Search, Ban } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  listarCuentasPorAprobar,
  aceptarCuenta,
  eliminarCuenta,
} from "@/hooks/ServiceCuenta";

interface DataType {
  external_id: string;
  nombre: string;
  apellido: string;
  correo: string;
  cedula: string;
  fecha: string;
}

const token = typeof window !== "undefined" ? sessionStorage.getItem("token") : null;

export default function CuentasPorAprobar() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  // --------------------------------------------------
  // Cargar datos
  // --------------------------------------------------
  const fetchData = async () => {
    if (!token) return router.push("/");

    try {
      setLoading(true);
      const resultado = await listarCuentasPorAprobar(token);
console.log(resultado);
      if (resultado?.response?.status === 401) {
        sessionStorage.removeItem("token");
        router.push("/");
        return;
      }

      if (resultado && Array.isArray(resultado)) {
        const datosFormateados = resultado.map((item: any) => ({
          external_id: item.external,
          nombre: item.persona?.nombre || "Sin nombre",
          apellido: item.persona?.apellido || "Sin apellido",
          correo: item.correo,
          cedula: item.persona?.cedula || "Sin cédula",
          fecha: new Date(item.createdAt).toLocaleDateString(),
        }));


        setData(datosFormateados);
        
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error al cargar pendientes:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Aprobar Cuenta
  // --------------------------------------------------
  const handleAprobar = async (
    external: string,
    nombre: string,
    apellido: string
  ) => {
    const confirmacion = await Swal.fire({
      title: `¿Aprobar cuenta de ${nombre} ${apellido}?`,
      text: "Esta acción permitirá el acceso al usuario.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Sí, aprobar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;

    if (!token) return router.push("/");

    try {
      await aceptarCuenta(external, token);

      await Swal.fire({
        title: "¡Cuenta aprobada!",
        text: "El usuario ahora puede iniciar sesión.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      fetchData();
    } catch (err) {
      console.error("Error al aprobar cuenta:", err);

      Swal.fire({
        title: "Error",
        text: "No se pudo aprobar la cuenta.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  // --------------------------------------------------
  // Rechazar Cuenta
  // --------------------------------------------------
  const handleRechazar = async (
    external: string,
    nombre: string,
    apellido: string
  ) => {
    const confirmacion = await Swal.fire({
      title: `¿Rechazar cuenta de ${nombre} ${apellido}?`,
      text: "El usuario no podrá acceder al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, rechazar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmacion.isConfirmed) return;

    if (!token) return router.push("/");

    try {
      await eliminarCuenta(external, token);

      await Swal.fire({
        title: "Cuenta rechazada",
        text: "La cuenta ha sido eliminada correctamente.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      fetchData();
    } catch (err) {
      console.error("Error al eliminar cuenta:", err);

      Swal.fire({
        title: "Error",
        text: "No se pudo eliminar la cuenta.",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------
  // Filtrado de búsqueda
  // --------------------------------------------------
  const filteredData = data.filter(
    (item) =>
      (`${item.nombre} ${item.apellido}`)
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.cedula.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />

      <main className="flex-1 w-full">
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Solicitudes de Registro
              </h1>
              <p className="text-muted-foreground">
                Cuentas pendientes de aprobación por el administrador.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <hr className="border-border" />
{/* BUSCADOR */}
<div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
  <div className="relative w-full max-w-sm">
    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
      <Search size={16} />
    </div>
    <input
      type="text"
      placeholder="Buscar usuario..."
      className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm
                 focus:outline-none focus:ring-2 focus:ring-blue-500"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>

  <div className="text-sm text-muted-foreground">
    Total: <strong>{filteredData.length}</strong> solicitudes
  </div>
</div>
          {/* TABLA */}
          <div className="overflow-hidden border border-border rounded-lg shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted text-muted-foreground font-medium uppercase text-xs">
                  <tr>
                    <th className="px-4 py-3">Nombre</th>
                    <th className="px-4 py-3">Correo</th>
                    <th className="px-4 py-3">Cédula</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground animate-pulse"
                      >
                        Cargando solicitudes...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-muted-foreground">
                        No hay solicitudes pendientes.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr
                        key={item.external_id}
                        className="hover:bg-muted/50 transition-colors group"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {item.nombre} {item.apellido}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.correo}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.cedula}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.fecha}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end items-center gap-2">
                            {/* BOTÓN APROBAR */}
                            <button
                              onClick={() =>
                                handleAprobar(
                                  item.external_id,
                                  item.nombre,
                                  item.apellido
                                )
                              }
                              className="flex items-center gap-1 px-2 py-1.5 rounded-md 
                                hover:bg-green-100 text-green-600 
                                dark:hover:bg-green-900/30 dark:text-green-400 
                                transition-colors"
                            >
                              <CheckCircle size={16} />
                              <span className="text-sm font-medium">Aceptar</span>
                            </button>

                            {/* BOTÓN RECHAZAR */}
                            <button
                              onClick={() =>
                                handleRechazar(
                                  item.external_id,
                                  item.nombre,
                                  item.apellido
                                )
                              }
                              className="flex items-center gap-1 px-2 py-1.5 rounded-md 
                                hover:bg-red-100 text-red-600 
                                dark:hover:bg-red-900/30 dark:text-red-400 
                                transition-colors"
                            >
                              <Ban size={16} />
                              <span className="text-sm font-medium">Rechazar</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
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
