"use client";

import React, { useState, useEffect } from "react";
import { Search, Copy } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import Cookies from "js-cookie";
import { useRouter } from "next/navigation";
import { listarCuentas, cambiarEstadoCuenta } from "@/hooks/ServiceCuenta";
import Swal from "sweetalert2";

interface DataType {
  correo: string;
  nombre: string;
  rol: string;
  estado: string;
  external: string;
}

export default function GestionUsuarios() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  // --------------------------------------------------
  // Cargar usuarios
  // --------------------------------------------------
  const fetchData = async () => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      setLoading(true);
      const resultado = await listarCuentas(token);

      if (resultado?.response?.status === 401) {
        sessionStorage.removeItem("token");
        router.push("/login");
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
  // Filtrado
  // --------------------------------------------------
  const filteredData = data.filter(
    (item) =>
      item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.correo.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.rol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // --------------------------------------------------
  // Copiar external al portapapeles
  // --------------------------------------------------
  const handleCopy = (external: string) => {
    navigator.clipboard.writeText(external);
    Swal.fire({
      toast: true,
      position: "top-end",
      icon: "success",
      title: "External copiado al portapapeles",
      showConfirmButton: false,
      timer: 1500,
    });
  };

  // --------------------------------------------------
  // Cambiar estado
  // --------------------------------------------------
  const toggleEstado = async (external: string) => {
    const token = Cookies.get("token") || sessionStorage.getItem("token");
    if (!token) return router.push("/login");

    try {
      await cambiarEstadoCuenta(external, token);
      fetchData(); // refresca la lista
    } catch (error) {
      Swal.fire({
        icon: "error",
        title: "Error",
        text: "No se pudo cambiar el estado del usuario",
      });
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
                Visualiza la lista de usuarios y sus roles.
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
              Total: <strong>{data.length}</strong> usuarios
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
                    <th className="px-4 py-3">Rol</th>
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">External</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-muted-foreground">
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="h-32 text-center text-muted-foreground">
                        No existen usuarios registrados
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr key={item.external} className="hover:bg-muted/50 transition-colors">
                        <td className="px-4 py-3 font-medium">{item.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.correo}</td>
                        <td className="px-4 py-3">{item.rol}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => toggleEstado(item.external)}
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              item.estado === "Activo"
                                ? "bg-emerald-600 text-white border border-emerald-700"
                                : "bg-red-600 text-white border border-red-700"
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
            Mostrando {filteredData.length} usuarios
          </div>
        </div>
      </main>
    </div>
  );
}
