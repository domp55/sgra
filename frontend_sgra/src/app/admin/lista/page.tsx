'use client';

import React, { useState, useEffect } from 'react';
import { Pencil, Trash2, Plus, Search, KeyRound, Ban } from 'lucide-react'; 
import ThemeToggle from '@/components/ThemeToggle';
import Sidebar from '@/components/Sidebar'; 
import Cookies from 'js-cookie'; 
import { useRouter } from 'next/navigation'; 

import { listarCuentas, desactivarCuenta } from '@/hooks/ServiceCuenta'; 

interface DataType {
  external_id: string;
  nombre: string;
  correo: string;
  estado: boolean;
  fecha: string;
}

export default function PageTemplate() {
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const router = useRouter();

  // --- 2. LÓGICA DE CARGA DE DATOS ---
  const fetchData = async () => {
    const token = Cookies.get('token'); 

    if (!token) {
        console.error("No hay token, redirigiendo...");
        router.push('/login'); 
        return;
    }

    try {
      setLoading(true);
      const resultado = await listarCuentas(token);

      // Si el backend devuelve error de autorización (ej: token vencido)
      if (resultado?.response?.status === 401) {
          Cookies.remove('token');
          router.push('/login');
          return;
      }

      if (resultado && Array.isArray(resultado)) {
        const datosFormateados = resultado.map((item: any) => ({
            external_id: item.external, 
            nombre: item.persona ? `${item.persona.nombres} ${item.persona.apellidos}` : 'Sin Datos',
            correo: item.correo,
            estado: item.estado, 
            fecha: new Date(item.createdAt).toLocaleDateString()
        }));
        setData(datosFormateados);
      } else {
        setData([]); 
      }
    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
        setLoading(false);
    }
  };

  // --- 3. LÓGICA DESACTIVAR ---
  const handleDesactivar = async (external: string) => {
    if(!confirm("¿Estás seguro de desactivar este usuario?")) return;
    
    const token = Cookies.get('token');
    if (!token) return router.push('/login');

    try {
     
        await desactivarCuenta(external, token);
        alert("Usuario desactivado correctamente");
        fetchData(); 
    } catch (error) {
        console.error("Error al desactivar", error);
        alert("No se pudo desactivar el usuario");
    }
  };

  // --- 4. LÓGICA RESTABLECER CLAVE ---
  const handleResetPassword = (external: string) => {
//narvaez
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Filtrado local
  const filteredData = data.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
              <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
              <p className="text-muted-foreground">Administración de cuentas del sistema.</p>
            </div>
            
            <div className="flex items-center gap-3">
              <ThemeToggle />
              
            </div>
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
                  className="w-full bg-background border border-input rounded-md py-2 pl-9 pr-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
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
                    <th className="px-4 py-3">Estado</th>
                    <th className="px-4 py-3">Fecha</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                    {loading ? (
                    <tr>
                        <td colSpan={5} className="h-32 text-center text-muted-foreground animate-pulse">
                            Cargando información...
                        </td>
                    </tr>
                    ) : filteredData.length === 0 ? (
                    <tr>
                        <td colSpan={5} className="h-32 text-center text-muted-foreground">
                            No se encontraron registros.
                        </td>
                    </tr>
                    ) : (
                    filteredData.map((item) => (
                        <tr key={item.external_id} className="hover:bg-muted/50 transition-colors group">
                        <td className="px-4 py-3 font-medium text-foreground">{item.nombre}</td>
                        <td className="px-4 py-3 text-muted-foreground">{item.correo}</td>
                        <td className="px-4 py-3">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                            item.estado 
                                ? 'bg-green-50 text-green-700 border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800' 
                                : 'bg-red-50 text-red-700 border-red-200 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800'
                            }`}>
                            {item.estado ? 'Activo' : 'Inactivo'}
                            </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{item.fecha}</td>
                        
                        <td className="px-4 py-3 text-right">
                            <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleResetPassword(item.external_id)}
                                    title="Restablecer Contraseña"
                                    className="p-1.5 rounded-md hover:bg-amber-100 text-amber-600 dark:hover:bg-amber-900/30 dark:text-amber-400 transition-colors"
                                >
                                    <KeyRound size={16} />
                                </button>

                                <button 
                                    title="Editar"
                                    className="p-1.5 rounded-md hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 transition-colors"
                                >
                                <Pencil size={16} />
                                </button>

                                <button 
                                    onClick={() => handleDesactivar(item.external_id)} 
                                    title={item.estado ? "Desactivar" : "Activar"} // Tooltip dinámico
                                    className="p-1.5 rounded-md hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors"
                                >
                                <Ban size={16} /> 
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

          {/* PAGINACIÓN VISUAL (Sin lógica compleja por ahora) */}
          <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
            <div>Mostrando {filteredData.length} registros</div>
            <div className="flex gap-2">
              <button disabled className="px-3 py-1 border border-border rounded-md disabled:opacity-50 hover:bg-muted">Anterior</button>
              <button className="px-3 py-1 border border-border rounded-md hover:bg-muted">Siguiente</button>
            </div>
          </div>
          
        </div>
      </main>
    </div>
  );
}