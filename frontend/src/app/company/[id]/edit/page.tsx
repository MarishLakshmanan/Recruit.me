// app/company/[id]/edit/page.tsx
import EditCompanyNameForm from "./EditCompanyNameForm";

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;
  // TODO: replace with real fetch
  const company = { id: companyId, name: "Company Name" };

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-semibold">Edit Company</h1>
        <EditCompanyNameForm companyId={company.id} initialName={company.name} />
      </div>
    </main>
  );
}
