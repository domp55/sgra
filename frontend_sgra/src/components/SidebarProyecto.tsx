"use client";

import Link from "next/link";
import { usePathname, useRouter, useParams } from "next/navigation";
import { 
  Home, 
  LogOut, 
  Layers, 
  BookOpen, 
  LayoutDashboard, // Icono para Principal
  FolderKanban     // Icono para Proyecto
} from "lucide-react";
import { useEffect, useState } from "react";
import Image from "next/image";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();
  
  // Obtenemos el external. Si estamos en /user/principal, esto será undefined
  const external = params?.external as string || "";

  const [userName, setUserName] = useState("Usuario");

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user");
    if (storedUser) setUserName(storedUser);
  }, []);

  const handleLogout = () => {
    sessionStorage.clear();
    router.push("/");
  };

  const initials = userName.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);

  // 1. Menú Global (Siempre visible)
  const globalItems = [
    { 
      name: "Principal", 
      href: "/user/principal", 
      icon: LayoutDashboard 
    }
  ];

  // 2. Menú del Proyecto (Solo visible si hay un external válido)
  const projectItems = external ? [
    { 
      name: "Resumen Proyecto", 
      href: `/user/proyecto/${external}`, 
      icon: FolderKanban 
    },
    { 
      name: "Requisitos", 
      href: `/user/proyecto/requisito/lista/${external}`, 
      icon: Layers 
    },
    
  ] : [];

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-border bg-background flex flex-col hidden md:flex transition-all shadow-sm z-50">
      
      {/* HEADER / LOGO */}
      <div className="flex flex-col items-center justify-center py-6 border-b border-border bg-muted/10">
        <div className="flex flex-col items-center font-bold text-xl tracking-tight text-foreground">
          <div className="relative mb-2 filter drop-shadow-sm">
            <Image
              src="/logoUNL.png"
              alt="Logo UNL"
              width={150}
              height={40}
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center text-center gap-2 font-bold text-lg tracking-tight text-primary">
            <span>SGRA</span>
          </div>
        </div>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 py-6 px-4 space-y-6 overflow-y-auto">
        
        {/* SECCIÓN 1: GLOBAL */}
        <div>
          <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            General
          </p>
          <div className="space-y-1">
            {globalItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? "bg-primary text-primary-foreground shadow-md"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <Icon size={20} className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
                  {item.name}
                </Link>
              );
            })}
          </div>
        </div>

        {/* SECCIÓN 2: PROYECTO (Solo se renderiza si estamos dentro de un proyecto) */}
        {external && (
          <div className="animate-in fade-in slide-in-from-left-2 duration-300">
            <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 border-t border-border pt-4">
              Gestión del Proyecto
            </p>
            <div className="space-y-1">
              {projectItems.map((item) => {
                const isActive = pathname === item.href;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`group flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-primary text-primary-foreground shadow-md"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon size={20} className={isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"} />
                    {item.name}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* FOOTER: USUARIO */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex flex-col gap-4">
         <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate text-foreground">{userName}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-600 bg-red-50 border border-red-100 rounded-md hover:bg-red-100 hover:text-red-700 dark:bg-red-900/10 dark:text-red-400 dark:border-red-900/30 dark:hover:bg-red-900/30 transition-colors"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>
        </div>
      </div>
    </aside>
  );
}