// app/company/[id]/page.tsx
import Link from "next/link";

export default async function Page({ params }: { params: { id: string } }) {
  const companyId = params.id;

  // TODO: replace with real fetch
  const company = { id: companyId, name: "Company Name" };

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-semibold">{company.name}</h1>

          <div className="flex gap-3">
            <Link
              href={`/company/${companyId}/edit`}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
            >
              Edit Profile
            </Link>

            <Link
              href={`/company/${companyId}/jobs/new`}
              className="rounded-xl bg-indigo-500 px-5 py-3 text-white hover:bg-indigo-600"
            >
              Add Posting
            </Link>
          </div>
        </div>

        {/* below this you can keep your tabs, stats, job list, etc. */}
      </div>
    </main>
  );
}
