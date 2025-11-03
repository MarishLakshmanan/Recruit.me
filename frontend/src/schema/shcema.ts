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
