import { Role } from "./shcema";

export type AuthPayload = {
  token: string;
  role: Role;
};

export type LoginData = {
  email: string;
  password: string;
};

export type RegisterData = {
  name: string;
  email: string;
  password: string;
  type: Role;
};
