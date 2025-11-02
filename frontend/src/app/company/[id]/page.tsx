import EditCompanyName from "./EditCompanyName";

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;

  // TODO: replace with your real data fetch (DB / API)
  const company = { id: companyId, name: "Company Name" };

  return (
    <main className="bg-gray-50 p-8">
      <div className="mx-auto max-w-5xl">
        <EditCompanyName companyId={company.id} initialName={company.name} />
        {/* ...rest of your page... */}
      </div>
    </main>
  );
}
