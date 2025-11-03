"use client";

export default function CompanyHeader({ name }: { name: string }) {
  return <h1 className="text-3xl font-semibold">{name}</h1>;
}
