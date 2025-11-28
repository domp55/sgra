// hooks/useAuth.ts
"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "./SessionUtil";
import {jwtDecode} from "jwt-decode";

interface DecodedToken {
  user: string;
  rol?: string;
  exp: number;
}

export function useAuth(rolRequerido: string = "ADMIN") {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }

    try {
      const decoded: DecodedToken = jwtDecode(token);

      const ahora = Date.now() / 1000;
      if (decoded.exp < ahora) {
        router.push("/login");
        return;
      }

      if (rolRequerido && decoded.rol !== rolRequerido) {
        router.push("/login");
        return;
      }

      setAuthorized(true);
    } catch (error) {
      console.error("Error decodificando token:", error);
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router, rolRequerido]);

  return { loading, authorized };
}
