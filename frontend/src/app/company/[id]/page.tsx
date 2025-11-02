// app/company/[id]/page.tsx
import { CompanyStateProvider } from "./company-state";
import CompanyHeader from "./CompanyHeader";

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;

  // TODO: replace with real fetch when backend is ready
  const company = { id: companyId, name: "Company Name" };

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <CompanyStateProvider companyId={company.id} initialName={company.name}>
          <CompanyHeader companyId={company.id} />
          {/* Keep your tabs, stats, jobs list, etc. here */}
        </CompanyStateProvider>
      </div>
    </main>
  );
}
