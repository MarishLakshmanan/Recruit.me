import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Client } from "pg";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { Resource } from "sst";
import { getDbClient } from "./db";

const JWT_SECRET = process.env.JWT_SECRET!;

function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 10000, 64, "sha512").toString("hex");
}

function generateUUID(): string {
  return crypto.randomUUID();
}

export const login: APIGatewayProxyHandlerV2 = async (event) => {
  const client = await getDbClient();
  try {
    const { email, password } = JSON.parse(event.body || "{}");

    const result = await client.query(
      "SELECT id, email, password_hash, salt, type FROM users WHERE email = $1",
      [email]
    );

    if (result.rows.length === 0) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const user = result.rows[0];
    const hash = hashPassword(password, user.salt);

    if (hash !== user.password_hash) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid credentials" }) };
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, type: user.type },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ token, role: user.type }),
    };
  } finally {
    await client.end();
  }
};

export const register: APIGatewayProxyHandlerV2 = async (event) => {
  const client = await getDbClient();
  try {
    const { name, email, password, type } = JSON.parse(event.body || "{}");

    if (!["applicant", "company", "admin"].includes(type)) {
      return { statusCode: 400, body: JSON.stringify({ error: "Invalid type" }) };
    }

    const salt = crypto.randomBytes(32).toString("hex");
    const passwordHash = hashPassword(password, salt);
    const id = generateUUID();

    await client.query(
      "INSERT INTO users (id, email, password_hash, salt, name, type) VALUES ($1, $2, $3, $4, $5, $6)",
      [id, email, passwordHash, salt, name, type]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ id }),
    };
  } catch (error: any) {
    if (error.code === "23505") { 
      return { statusCode: 400, body: JSON.stringify({ error: "Email already exists" }) };
    }
    throw error;
  } finally {
    await client.end();
  }
};

export const logout: APIGatewayProxyHandlerV2 = async () => {
  // TODO remove this bc logout is client side
  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Logout successful" }),
  };
};
