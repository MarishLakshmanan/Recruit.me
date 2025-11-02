import EditApplicantSkills from "./EditApplicantSkills";

export default async function Page({ params }: { params: { id: string } }) {
  const applicantId = params.id;

  // TODO: replace with your real fetch (DB / API)
  const applicant = {
    id: applicantId,
    name: "Applicant Name",
    skills: ["React", "TypeScript", "Tailwind"],
  };

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">{applicant.name}</h1>

          <EditApplicantSkills
            applicantId={applicant.id}
            initialSkills={applicant.skills}
          />
        </div>

        {/* …rest of the page… */}
      </div>
    </main>
  );
}
