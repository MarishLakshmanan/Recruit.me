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
  jobs: Job[];
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
};

export type SearchJobsResponse = {
  jobs: Job[];
  total: number;
};
