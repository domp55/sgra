"use client";

import React, { useState, useEffect } from "react";
import { Search, Copy, Filter } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { listarCuentas, cambiarEstadoCuenta } from "@/hooks/ServiceCuenta";
import Swal from "sweetalert2";

interface DataType {
  correo: string;
  nombre: string;
  isAdmn: string;
  estado: string;
  external: string;
}

export default function GestionUsuarios() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Todos"); // Nuevo estado para el filtro
  const router = useRouter();

  // --------------------------------------------------
  // Cargar usuarios
  // --------------------------------------------------
  const fetchData = async () => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      setLoading(true);
      const resultado = await listarCuentas(token);

      if (resultado?.response?.status === 401) {
        sessionStorage.removeItem("token");
        router.push("/");
        return;
      }

      if (resultado && Array.isArray(resultado.usuarios)) {
        setData(resultado.usuarios);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error al cargar usuarios:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --------------------------------------------------
  // Filtrado Combinado (Buscador + Estado)
  // --------------------------------------------------
  const filteredData = data.filter((item) => {
    // 1. Filtro por texto (Nombre o Correo)
    const matchesSearch =
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.correo.toLowerCase().includes(searchTerm.toLowerCase());

    // 2. Filtro por estado (Todos, Activo, Inactivo)
    const matchesStatus =
      statusFilter === "Todos" || item.estado === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // --------------------------------------------------
  // Copiar external al portapapeles
  // --------------------------------------------------
  const handleCopy = (external: string) => {
    navigator.clipboard.writeText(external);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "External copiado",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // --------------------------------------------------
  // Cambiar estado con confirmación
  // --------------------------------------------------
  const toggleEstado = async (external: string, estadoActual: string) => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    if (!token) return router.push("/");

    const accion = estadoActual === "Activo" ? "desactivar" : "activar";

    const confirmacion = await Swal.fire({
      title: "¿Estás seguro?",
      text: `¿Estás seguro de que deseas ${accion} a este usuario?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Sí, cambiar",
      cancelButtonText: "Cancelar",
    });

    if (confirmacion.isConfirmed) {
      try {
        await cambiarEstadoCuenta(external, token);
        await fetchData();
        
        Swal.fire({
          title: "¡Actualizado!",
          text: `El usuario ha sido ${accion === "activar" ? "activado" : "desactivado"} correctamente.`,
          icon: "success",
          timer: 2000,
          showConfirmButton: false
        });
        
      } catch (error) {
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "No se pudo cambiar el estado del usuario",
        });
      }
    }
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar />
      <main className="flex-1 w-full">
        <div className="p-6 space-y-6 w-full max-w-7xl mx-auto">
          {/* HEADER */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Visualiza la lista de usuarios del sistema.
              </p>
            </div>
            <ThemeToggle />
          </div>

          <hr className="border-border" />

          {/* BARRA DE HERRAMIENTAS (BUSCADOR + FILTRO) */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
            
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto flex-1">
              {/* Buscador */}
              <div className="relative w-full sm:max-w-xs">
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

              {/* Filtro Dropdown */}
              <div className="relative w-full sm:w-40">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  <Filter size={16} />
                </div>
                <select
                  className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-8 text-sm
                             focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                >
                  <option value="Todos">Todos</option>
                  <option value="Activo">Activos</option>
                  <option value="Inactivo">Inactivos</option>
                </select>
                {/* Icono de flecha personalizado para el select (opcional) */}
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
              </div>
            </div>

            <div className="text-sm text-muted-foreground w-full md:w-auto text-right">
              Total: <strong>{filteredData.length}</strong> usuarios
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
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">External</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td colSpan={4} className="h-32 text-center text-muted-foreground">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="h-32 text-center text-muted-foreground">
                        No se encontraron usuarios con estos criterios.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.external} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.correo}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleEstado(item.external, item.estado)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm transition-transform active:scale-95 ${
                              item.estado === "Activo"
                                ? "bg-emerald-600 text-white border border-emerald-700 hover:bg-emerald-700"
                                : "bg-red-600 text-white border border-red-700 hover:bg-red-700"
                            }`}
                          >
                            {item.estado}
                          </button>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <span>{item.external}</span>
                          <button
                            onClick={() => handleCopy(item.external)}
                            className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700"
                            title="Copiar External"
                          >
                            <Copy size={16} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-sm text-muted-foreground pt-2">
            Mostrando {filteredData.length} de {data.length} registros totales
          </div>
        </div>
      </main>
    </div>
  );
}