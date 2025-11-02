// app/company/[id]/jobs/new/page.tsx
import AddJobForm from "./AddJobForm";

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-6 text-2xl font-semibold">Add Job</h1>
        <AddJobForm companyId={companyId} />
      </div>
    </main>
  );
}
