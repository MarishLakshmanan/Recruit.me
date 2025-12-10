"use client";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getUserRole } from "app/actions/fetch";
import { Role } from "schema/schema";
import { useRouter } from "next/navigation";

interface AuthContextType {
  role: Role | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [role, setRole] = useState<Role | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const userRole = await getUserRole();
        setRole(userRole);
      } catch (error) {
        console.error("Auth error:", error);
        setRole(null);
        router.push("/login");
      } finally {
        setIsLoading(false);
      }
    };
    checkAuth();
  }, [router]);

  return (
    <AuthContext.Provider
      value={{
        role,
        isLoading,
        isAuthenticated: role !== null
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return context;
}
