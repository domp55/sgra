"use client";

import React, { useState, useEffect } from "react";
import { Pencil, Ban, KeyRound, Search } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import { useRouter } from "next/navigation";
import Swal from "sweetalert2";

import {
  listarCuentasAprobadas,
  desactivarCuenta,
} from "@/hooks/ServiceCuenta";
import { resetearContrasena } from "@/hooks/Autenticacion";

interface DataType {
  external_id: string;
  nombre: string;
  apellido: string;
  cedula: string;
  correo: string;
  estado: boolean;
  fecha: string;
}

export default function GestionUsuarios() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const router = useRouter();

  // --------------------------------------------------
  // Cargar datos
  // --------------------------------------------------
  const fetchData = async () => {
    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      setLoading(true);

      const resultado = await listarCuentasAprobadas(token);
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
          estado: item.estado,
          fecha: new Date(item.createdAt).toLocaleDateString(),
        }));

        setData(datosFormateados);
      } else {
        setData([]);
      }
    } catch (err) {
      console.error("Error al cargar aprobadas:", err);
      setData([]);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------------------------
  // Desactivar cuenta con SweetAlert
  // --------------------------------------------------
  const handleDesactivar = async (
    external: string,
    nombre: string,
    apellido: string
  ) => {
    const confirmacion = await Swal.fire({
      title: `¿Desactivar a ${nombre} ${apellido}?`,
      text: "El usuario perderá acceso al sistema.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, desactivar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
    });

    if (!confirmacion.isConfirmed) return;

    const token = sessionStorage.getItem("token");
    if (!token) return router.push("/");

    try {
      await desactivarCuenta(external, token);

      await Swal.fire({
        title: "Usuario desactivado",
        text: "El usuario ya no puede acceder al sistema.",
        icon: "success",
        confirmButtonText: "Aceptar",
      });

      fetchData();
    } catch (err) {
      console.error("Error al desactivar:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudo desactivar el usuario.",
        icon: "error",
      });
    }
  };

  // --------------------------------------------------
  // Resetear contraseña (te dejo la estructura)
  // --------------------------------------------------
  const handleResetPassword = async (correo: string) => {
    const confirmacion = await Swal.fire({
      title: `¿Restablecer contraseña?`,
      text: "Se enviará un correo con la contraseña temporal.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Sí, enviar",
      cancelButtonText: "Cancelar",
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
    });

    if (!confirmacion.isConfirmed) return;
    try {
      const resultado = await resetearContrasena(correo, "");

      if (resultado.code === 200) {
        Swal.fire({
          title: "Contraseña restablecida",
          text: resultado.msg,
          icon: "success",
          confirmButtonText: "Aceptar",
        });
      } else {
        Swal.fire({
          title: "Error",
          text: resultado.msg || "No se pudo restablecer la contraseña",
          icon: "error",
          confirmButtonText: "Aceptar",
        });
      }
    } catch (err) {
      console.error("Error al resetear contraseña:", err);
      Swal.fire({
        title: "Error",
        text: "No se pudo conectar con el servidor",
        icon: "error",
        confirmButtonText: "Aceptar",
      });
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
      `${item.nombre} ${item.apellido}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      item.correo.toLowerCase().includes(searchTerm.toLowerCase())
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
                Gestión de Usuarios
              </h1>
              <p className="text-muted-foreground">
                Administrar cuentas aprobadas del sistema.
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
                    <th className="px-4 py-3">Cédula</th>

                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-border bg-card">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        Cargando usuarios...
                      </td>
                    </tr>
                  ) : filteredData.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="h-32 text-center text-muted-foreground"
                      >
                        No se encontraron registros.
                      </td>
                    </tr>
                  ) : (
                    filteredData.map((item) => (
                      <tr
                        key={item.external_id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium">
                          {item.nombre} {item.apellido}
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.correo}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {item.cedula}
                        </td>

                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${
                              item.estado
                                ? "bg-emerald-600 text-white border border-emerald-700 dark:bg-emerald-600 dark:text-white"
                                : "bg-red-600 text-white border border-red-700 dark:bg-red-600 dark:text-white"
                            }`}
                          >
                            {item.estado ? "Activo" : "Inactivo"}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-muted-foreground">
                          {item.fecha}
                        </td>

                        {/* ICONOS SIEMPRE VISIBLES */}
                        <td className="px-4 py-3 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleResetPassword(item.correo)}
                              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-amber-100 text-amber-600 dark:hover:bg-amber-900/30 dark:text-amber-400"
                            >
                              <KeyRound size={17} />
                              <span className="text-sm">Restablecer</span>
                            </button>

                            <button
                              onClick={() =>
                                handleDesactivar(
                                  item.external_id,
                                  item.nombre,
                                  item.apellido
                                )
                              }
                              className="flex items-center gap-2 p-1.5 rounded-md hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30 dark:text-red-400"
                            >
                              <Ban size={17} />
                              <span className="text-sm">Desactivar</span>
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

          {/* PIE */}
          <div className="text-sm text-muted-foreground pt-2">
            Mostrando {filteredData.length} usuarios
          </div>
        </div>
      </main>
    </div>
  );
}
