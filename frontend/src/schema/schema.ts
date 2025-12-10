export enum Role {
  COMPANY = "company",
  APPLICANT = "applicant",
  ADMIN = "admin",
}
export type ButtonType =
  | "primary"
  | "secondary"
  | "danger"
  | "warning"
  | "info"
  | "light"
  | "dark";

export type FetchPayload = {
  url: string;
  options: RequestInit;
};

export type Application = {
  job_id: string;
  company_name: string;
  job_title: string;
  status: string;
  post_date: string;
  apply_date: string;
  applicant_count: string;
  skills: string[];
};

export type ApplicantProfile = {
  id: string;
  name: string;
  email?: string;
  skills: string[];
  applications: Application[];
  total: number;
};

export type CompanyProfile = {
  id: string;
  name: string;
  email: string;
  jobs: Job[];
  total: number;
};

export type CreateJob = {
  title: string;
  description?: string;
  salary: number;
  skills: string[];
};
export type Job = {
  title: string;
  applicant_count: number;
  hired_count: number;
  id: string;
  post_date: string;
  status: string;
  skills?: string[];
  company_name?: string;
};

export type SearchJobsResponse = {
  jobs: Job[];
  total: number;
};

export type ApplicationStatus =
  | "Not Applied"
  | "Applied"
  | "Rejected"
  | "Offer"
  | "Accepted";

export type JobDetail = Job & {
  description?: string;
  salary?: number;
  applicationStatus?: ApplicationStatus;
};

export type CompanyReport = {
  id: string;
  name: string;
  job_count: number;
  application_count: number;
  hired_count: number;
};

export type JobReport = {
  id: string;
  title: string;
  status: "open" | "closed" | "inactive";
  applicant_count: number;
  hired_count: number;
};

export type ApplicantReport = {
  id: string;
  name: string;
  application_count: number;
  skills: string[];
};

export type CompaniesReportResponse = {
  companies: CompanyReport[];
  total: number;
};

export type JobsReportResponse = {
  jobs: JobReport[];
  total: number;
};

export type ApplicantsReportResponse = {
  applicants: ApplicantReport[];
  total: number;
};

export type ApplicantForJob = {
  id: string;
  name: string;
  rating: "hirable" | "wait" | "unacceptable" | "unrated";
  offer_status: "none" | "offered" | "accepted" | "rejected";
  skills: string[];
  apply_date?: string;
};

export type ApplicantsForJobResponse = {
  applicants: ApplicantForJob[];
  total: number;
};
