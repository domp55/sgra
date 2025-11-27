'use client';

import React, { useState, useEffect } from 'react';
// Importamos los iconos
import { Pencil, Trash2, Plus, Search } from 'lucide-react'; 

import ThemeToggle from '@/components/ThemeToggle'; 

// 1. DEFINICIÓN DE TIPOS
interface DataType {
  id: number;
  nombre: string;
  correo: string;
  estado: 'Activo' | 'Inactivo';
  fecha: string;
}

export default function PageTemplate() {
  // ==========================================
  // 1. ESTADOS Y HOOKS
  // ==========================================
  const [data, setData] = useState<DataType[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isEditing, setIsEditing] = useState(false);
  const [currentItem, setCurrentItem] = useState<DataType | null>(null);

  // ==========================================
  // 2. MÉTODOS Y LÓGICA
  // ==========================================
  
  const fetchData = async () => {
    try {
      setLoading(true);
      setTimeout(() => {
        setData([
          { id: 1, nombre: 'Juan Pérez', correo: 'juan@test.com', estado: 'Activo', fecha: '2024-01-10' },
          { id: 2, nombre: 'Maria Lopez', correo: 'maria@test.com', estado: 'Inactivo', fecha: '2024-02-15' },
          { id: 3, nombre: 'Carlos Ruiz', correo: 'carlos@test.com', estado: 'Activo', fecha: '2024-03-20' },
        ]);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error cargando datos:", error);
      setLoading(false);
    }
  };

  const handleDelete = (id: number) => {
    if(!confirm("¿Estás seguro de eliminar este registro?")) return;
    console.log("Eliminando ID:", id);
    // Lógica de eliminación
  };

  useEffect(() => {
    fetchData();
  }, []);

  const filteredData = data.filter(item => 
    item.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // ==========================================
  // 3. RENDERIZADO (UI)
  // ==========================================
  return (
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      
      {/* --- HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Gestión de Usuarios</h1>
          <p className="text-muted-foreground">Administra y visualiza los registros del sistema.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <ThemeToggle />
          
          {/* Botón Nuevo con Icono */}
          <button 
            onClick={() => { setIsEditing(false); setCurrentItem(null); console.log("Abrir modal crear"); }}
            className="btn-primary flex items-center gap-2"
          >
            <Plus size={18} />
            <span>Nuevo Registro</span>
          </button>
        </div>
      </div>

      <hr className="border-border" />

      {/* --- BUSCADOR --- */}
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-muted/20 p-4 rounded-lg border border-border">
        <div className="relative w-full max-w-sm">
            {/* Icono de búsqueda absoluto */}
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <Search size={16} />
            </div>
            <input 
              type="text" 
              placeholder="Buscar por nombre..." 
              className="input-field pl-9" // Padding left extra para el icono
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
        <div className="text-sm text-muted-foreground">
          Total registros: {data.length}
        </div>
      </div>

      {/* --- TABLA --- */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Correo</th>
              <th>Estado</th>
              <th>Fecha</th>
              <th className="text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="h-32 text-center text-muted-foreground">
                  Cargando datos...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={6} className="h-32 text-center text-muted-foreground">
                  No se encontraron resultados.
                </td>
              </tr>
            ) : (
              filteredData.map((item) => (
                <tr key={item.id}>

                  <td>{item.nombre}</td>
                  <td>{item.correo}</td>
                  <td>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      item.estado === 'Activo' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                    }`}>
                      {item.estado}
                    </span>
                  </td>
                  <td className="text-muted-foreground">{item.fecha}</td>
                  
                  {/* --- AQUÍ ESTÁN LOS CAMBIOS PRINCIPALES --- */}
                  <td className="text-right">
                    <div className="flex justify-end gap-2">
                        {/* Botón Editar */}
                        <button 
                          onClick={() => console.log('Edit', item.id)}
                          className="p-2 rounded-md hover:bg-blue-100 text-blue-600 dark:hover:bg-blue-900/30 dark:text-blue-400 transition-colors"
                          title="Editar usuario"
                        >
                          <Pencil size={18} />
                        </button>
                        
                        {/* Botón Eliminar */}
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-2 rounded-md hover:bg-red-100 text-red-600 dark:hover:bg-red-900/30 dark:text-red-400 transition-colors"
                          title="Eliminar usuario"
                        >
                          <Trash2 size={18} />
                        </button>
                    </div>
                  </td>
                  {/* ------------------------------------------ */}
                  
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- PAGINACIÓN --- */}
      <div className="flex items-center justify-between text-sm text-muted-foreground pt-2">
        <div>Mostrando {filteredData.length} resultados</div>
        <div className="flex gap-2">
          <button className="px-3 py-1 border border-border rounded-md disabled:opacity-50 hover:bg-muted" disabled>Anterior</button>
          <button className="px-3 py-1 border border-border rounded-md hover:bg-muted">Siguiente</button>
        </div>
      </div>

    </div>
  );
}