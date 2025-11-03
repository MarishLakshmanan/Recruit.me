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
  jobs: string[];
};
