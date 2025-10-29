import { APIGatewayProxyEventV2 } from "aws-lambda";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedUser {
  userId: string;
  email: string;
  type: "applicant" | "company" | "admin";
}

export function verifyToken(event: APIGatewayProxyEventV2): AuthenticatedUser {
  const authHeader = event.headers.authorization || event.headers.Authorization;
  
  if (!authHeader) {
    throw new Error("No authorization header");
  }

  const token = authHeader.replace("Bearer ", "");
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return decoded;
  } catch (error) {
    throw new Error("Invalid token");
  }
}

export function requireRole(user: AuthenticatedUser, allowedRoles: string[]) {
  if (!allowedRoles.includes(user.type)) {
    throw new Error("Forbidden");
  }
}
