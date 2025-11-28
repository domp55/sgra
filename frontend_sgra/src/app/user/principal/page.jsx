'use client';

import React from 'react';
import ThemeToggle from '@/components/ThemeToggle';

export default function PrincipalUserPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4">
      
      {/* Switch de tema */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      {/* Card de bienvenida */}
      <div className="bg-card border border-border shadow-md rounded-xl p-8 w-full max-w-lg text-center">
        <h1 className="text-2xl font-bold text-foreground mb-4">
          Bienvenido Usuario
        </h1>
        <p className="text-muted-foreground mb-6">
          Esta es tu página principal. Aquí podrás realizar acciones disponibles.
        </p>

        {/* Botones */}
        <div className="mt-4 flex flex-col sm:flex-row justify-center gap-4">
          <button className="btn-primary px-4 py-2 rounded-md">
            Unirse a un proyecto
          </button>
          <button className="btn-secondary px-4 py-2 rounded-md">
            Crear un nuevo proyecto
          </button>
        </div>
      </div>
    </div>
  );
}
