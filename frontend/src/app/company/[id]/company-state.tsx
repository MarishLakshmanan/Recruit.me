"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type CompanyState = {
  name: string;
  setName: (next: string) => void;
};

const Ctx = createContext<CompanyState | null>(null);

export function CompanyStateProvider({
  companyId,
  initialName,
  children,
}: {
  companyId: string;
  initialName: string;
  children: React.ReactNode;
}) {
  const storageKey = `company:${companyId}:name`;
  const [name, setName] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) return saved;
    }
    return initialName;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, name);
    } catch {}
  }, [name, storageKey]);

  useEffect(() => {
    const saved = window.localStorage.getItem(storageKey);
    if (!saved) setName(initialName);
  
  }, [initialName]);

  const value = useMemo(() => ({ name, setName }), [name]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCompanyState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCompanyState must be used within CompanyStateProvider");
  return v;
}
