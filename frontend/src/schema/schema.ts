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

export type ApplicantProfile = {
  id: string;
  name: string;
  skills: string[];
  applications: string[];
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
  description: string;
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
  status: 'open' | 'closed' | 'draft';
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
