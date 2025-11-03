import { ApplicantStateProvider } from "./applicant-state";
import ApplicantHeader from "./ApplicantHeader";

export default async function Page({ params }: { params: { id: string } }) {
  const applicantId = params.id;

  // TODO: replace with real fetch
  const applicant = {
    id: applicantId,
    name: "Applicant Name",
    skills: [], 
  };

  return (
    <main className="bg-gray-50 min-h-screen p-8">
      <div className="mx-auto max-w-5xl">
        <ApplicantStateProvider
          applicantId={applicant.id}
          initialName={applicant.name}
          initialSkills={applicant.skills}
        >
          <ApplicantHeader applicantId={applicant.id} />
          {}
        </ApplicantStateProvider>
      </div>
    </main>
  );
}
