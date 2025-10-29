import { APIGatewayProxyEventV2 } from "aws-lambda";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;

export interface AuthenticatedUser {
  userId: string;
  email: string;
  type: "applicant" | "company" | "admin";
}

export const UNAUTHORIZED = { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };

/// returns [user, had error]
export function verifyToken(event: APIGatewayProxyEventV2): 
  [AuthenticatedUser | null, boolean] {
  
  const authHeader = event.headers.authorization || event.headers.Authorization;
  if (!authHeader) {
    return [null, true];
  }

  const token = authHeader.replace("Bearer ", "");
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as AuthenticatedUser;
    return [decoded, false];
  } catch (error) {
    return [null, true];
  }
}

export function verifyTokenAndRole(event: APIGatewayProxyEventV2, roles: string[]):
  [AuthenticatedUser | null, boolean] {
  const [user, error] = verifyToken(event);
  if (error || !hasRole(user!, roles)) {
    return [null, true]
  }

  return [user, false];
}

export function hasRole(user: AuthenticatedUser, roles: string[]): boolean {
  return roles.includes(user.type);
}
