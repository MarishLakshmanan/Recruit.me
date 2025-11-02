"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type ApplicantState = {
  name: string;
  skills: string[];
  setName: (next: string) => void;
  setSkills: (next: string[]) => void;
};

const Ctx = createContext<ApplicantState | null>(null);

export function ApplicantStateProvider({
  applicantId,
  initialName,
  initialSkills,
  children,
}: {
  applicantId: string;
  initialName: string;
  initialSkills: string[];
  children: React.ReactNode;
}) {
  const storageKey = `applicant:v2:${applicantId}`;

  const [name, setName] = useState(initialName);
  const [skills, setSkills] = useState<string[]>(initialSkills);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(storageKey);
      if (saved) {
        const parsed = JSON.parse(saved) as { name?: string; skills?: string[] };
        if (parsed.name && parsed.name !== name) setName(parsed.name);
        if (parsed.skills && JSON.stringify(parsed.skills) !== JSON.stringify(skills)) {
          setSkills(parsed.skills);
        }
      }
    } catch {}

  }, [storageKey]);

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, JSON.stringify({ name, skills }));
    } catch {}
  }, [name, skills, storageKey]);

  const value = useMemo(() => ({ name, skills, setName, setSkills }), [name, skills]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useApplicantState() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useApplicantState must be used inside ApplicantStateProvider");
  return v;
}
