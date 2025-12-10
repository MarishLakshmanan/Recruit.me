import { fetchWithAuth, getUserRole } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { FetchPayload, Job, Role } from "schema/schema";
import Button from "universal/Button";
import Modal from "universal/Modal";
import EditJobForm from "./EditJobForm";
import ApplicantsList from "./ApplicantsList";
import Link from "next/link";
import { useRouter } from "next/navigation";

const JobCard = ({
  job,
  editJob,
}: {
  job: Job;
  editJob: (job: Job) => void;
}) => {
  const router = useRouter();
  const [role, setRole] = useState<Role>(Role.COMPANY);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isApplicantsModalOpen, setIsApplicantsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRole = async () => {
      const role = (await getUserRole()) as Role;
      setRole(role);
    };
    fetchRole();
  }, []);

  const handleActivate = async () => {
    try {
      const payload: FetchPayload = {
        url: `${process.env.NEXT_PUBLIC_API_URL}/company/job/${job.id}/activate`,
        options: {
          method: "POST",
        },
      };
      await fetchWithAuth(payload);
      alert("Job activated successfully");
      editJob({ ...job, status: "open" });
    } catch (error) {
      alert(error as string);
    }
  };

  const handleClose = async () => {
    try {
      const payload: FetchPayload = {
        url: `${process.env.NEXT_PUBLIC_API_URL}/company/job/${job.id}/close`,
        options: {
          method: "POST",
        },
      };
      await fetchWithAuth(payload);
      alert("Job closed successfully");
      editJob({ ...job, status: "inactive" });
    } catch (error) {
      alert(error as string);
    }
  };

  const actions = () => {
    if (role === Role.COMPANY) {
      return (
        <div className="flex gap-2">
          {job.status === "inactive" && (
            <Button label="Activate" type="primary" onClick={handleActivate} />
          )}
          {job.status === "open" && (
            <>
              <Button label="Close" type="primary" onClick={handleClose} />
              <Button
                label="Review Applicants"
                type="secondary"
                onClick={() => router.push(`/review/${job.id}`)}
              />
              <Button
                label="Offer"
                type="secondary"
                onClick={() => router.push(`/offer/${job.id}`)}
              />
            </>
          )}
          {job.status === "inactive" && (
            <Button
              label="Edit"
              type="primary"
              onClick={() => setIsEditModalOpen(true)}
            />
          )}
        </div>
      );
    }
    if (role === Role.APPLICANT) {
      return (
        <div className="flex gap-2">
          <Button label="Apply" type="primary" onClick={() => {}} />
        </div>
      );
    }
  };

  return (
    <div
      className={`border-b p-4 border-gray-300 ${
        role === Role.APPLICANT
          ? "flex justify-between items-center"
          : "grid grid-cols-3 items-center gap-4"
      }`}
    >
      {role === Role.APPLICANT ? (
        <Link
          href={`/job/${job.id}`}
          className="flex-1 flex justify-between items-center cursor-pointer hover:bg-gray-50 -m-4 p-4"
        >
          <div>
            <h3>{job.title}</h3>
            {job.company_name && (
              <p className="text-gray-600 font-medium">{job.company_name}</p>
            )}
            <p>Posted on: {new Date(job.post_date).toLocaleDateString()}</p>
            {job.skills?.map((skill) => (
              <span
                key={skill}
                className="inline-flex mr-1 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
          <div>
            <div>
              applicants:<span>{job.applicant_count}</span>
            </div>
          </div>
          <div className="flex gap-2 items-center">
            <div>{actions()}</div>
          </div>
        </Link>
      ) : (
        <>
          <div>
            <Link
              href={`/job/${job.id}`}
              className="cursor-pointer hover:text-blue-600"
            >
              <h3 className="font-semibold inline-block">{job.title}</h3>
            </Link>
            <p>Posted on: {new Date(job.post_date).toLocaleDateString()}</p>
            {job.skills?.map((skill) => (
              <span
                key={skill}
                className="inline-flex mr-1 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
              >
                {skill}
              </span>
            ))}
          </div>
          <div className="flex items-center justify-center">
            {job.status === "open" ? (
              <button
                onClick={() => setIsApplicantsModalOpen(true)}
                className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
              >
                applicants:{" "}
                <span className="font-semibold">{job.applicant_count}</span>
              </button>
            ) : (
              <div>
                applicants:<span>{job.applicant_count}</span>
              </div>
            )}
          </div>
          <div className="flex gap-2 items-center justify-end">
            <div>{actions()}</div>
          </div>
        </>
      )}

      {isEditModalOpen && (
        <Modal onClose={() => setIsEditModalOpen(false)}>
          <EditJobForm
            jobId={job.id}
            closeModal={() => setIsEditModalOpen(false)}
            editJob={(updatedJob) => {
              editJob(updatedJob);
              setIsEditModalOpen(false);
            }}
          />
        </Modal>
      )}

      {isApplicantsModalOpen && (
        <ApplicantsList
          jobId={job.id}
          jobTitle={job.title}
          onClose={() => setIsApplicantsModalOpen(false)}
        />
      )}
    </div>
  );
};

export default JobCard;
