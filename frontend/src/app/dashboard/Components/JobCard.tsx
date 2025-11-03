import { fetchWithAuth, getUserRole } from "app/actions/fetch";
import { useEffect, useState } from "react";
import { FetchPayload, Job, Role } from "schema/shcema";
import Button from "universal/Button";
import Modal from "universal/Modal";
import EditJobForm from "./EditJobForm";

const JobCard = ({
  job,
  editJob,
}: {
  job: Job;
  editJob: (job: Job) => void;
}) => {
  const [role, setRole] = useState<Role>(Role.COMPANY);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
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
      const response = await fetchWithAuth(payload);
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
      const response = await fetchWithAuth(payload);
      alert("Job closed successfully");
      editJob({ ...job, status: "draft" });
    } catch (error) {
      alert(error as string);
    }
  };

  const actions = () => {
    if (role === Role.COMPANY) {
      return (
        <div className="flex gap-2">
          {job.status === "draft" && (
            <Button label="Activate" type="primary" onClick={handleActivate} />
          )}
          {job.status === "open" && (
            <Button label="Close" type="danger" onClick={handleClose} />
          )}
          <Button label="Edit" type="primary" onClick={() => setIsEditModalOpen(true)} />
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
    <div className="border-b p-4 border-gray-300 flex justify-between items-center">
      <div>
        <h3>{job.title}</h3>
        <p>Posted on: {new Date(job.post_date).toLocaleDateString()}</p>
        {/* {job.skills.map((skill) => (
          <span
            key={skill}
            className="inline-flex mr-1 items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-1 text-sm"
          >
            {skill}
          </span>
        ))} */}
      </div>
      <div>
        <div>
          applicants:<span>{job.applicant_count}</span>
        </div>
      </div>
      <div className="flex gap-2 items-center">
        <div>{actions()}</div>
      </div>

      {isEditModalOpen && (
        <Modal>
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
    </div>
  );
};

export default JobCard;
