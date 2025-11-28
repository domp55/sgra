"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Users, LogOut } from "lucide-react";
import { useEffect, useState } from "react";

const menuItems = [
  { name: "Solicitudes de aprobación", href: "/admin/aprobar", icon: Home },
  { name: "Usuarios Activos", href: "/admin/lista", icon: Users },
  { name: "Todos los Usuarios", href: "/admin/todos", icon: Users },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  const [userName, setUserName] = useState<string | null>(null);
  const [initials, setInitials] = useState<string>("");

  useEffect(() => {
    const name = sessionStorage.getItem("user");

    if (!name) {
      router.push("/");
      return;
    }

    setUserName(name);

    const ini = name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);

    setInitials(ini);

  }, []); // Solo una vez

  const handleLogout = () => {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("external");
    sessionStorage.removeItem("user");
    router.push("/");
  };

  if (!userName) {
    return null; // evita render mientras carga sessionStorage
  }

  return (
    <aside className="w-64 h-screen sticky top-0 border-r border-border bg-background flex flex-col hidden md:flex transition-all">

      {/* LOGO / HEADER */}
      <div className="h-16 flex items-center px-6 border-b border-border">
        <div className="flex items-center gap-2 font-bold text-xl tracking-tight text-foreground">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center text-primary-foreground shadow-sm">
            S
          </div>
          <span>SGRA System</span>
        </div>
      </div>

      {/* NAV LINKS */}
      <nav className="flex-1 py-6 px-3 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                isActive
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <Icon size={20} />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* FOOTER: Usuario + Logout */}
      <div className="p-4 border-t border-border bg-muted/20">
        <div className="flex flex-col gap-4">

          {/* Tarjeta Usuario */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold text-sm">
              {initials}
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-sm font-medium truncate text-foreground">
                {userName}
              </span>
            </div>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className="flex items-center justify-center gap-2 w-full px-3 py-2 text-xs font-medium text-red-500 border border-red-200 rounded-md hover:bg-red-50 dark:hover:bg-red-900/10 dark:border-red-900/30 transition-colors"
          >
            <LogOut size={14} />
            Cerrar Sesión
          </button>

        </div>
      </div>
    </aside>
  );
}
