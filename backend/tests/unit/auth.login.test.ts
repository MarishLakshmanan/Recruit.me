process.env.JWT_SECRET = "test-secret";

jest.mock("../../packages/functions/db.js");
jest.mock("jsonwebtoken");

import { login } from "../../packages/functions/auth.js";
import { getDbClient } from "../../packages/functions/db.js";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import type { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";

const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;
const mockJwtSign = jwt.sign as jest.MockedFunction<typeof jwt.sign>;

type Result = {
  statusCode: number;
  body: string;
};
type AsyncHandler = (event: APIGatewayProxyEventV2) => Promise<Result>;
const loginHandler = login as unknown as AsyncHandler;

function fakeEvent({ email, password }: { email: string; password: string }) {
  return {
    body: JSON.stringify({ email, password }),
    headers: {},
    isBase64Encoded: false,
    rawPath: "/login",
    rawQueryString: "",
    routeKey: "POST /login",
    version: "2.0",
    requestContext: {
      accountId: "test",
      apiId: "test",
      http: {
        method: "POST",
        path: "/login",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
      requestId: "test",
      routeKey: "POST /login",
      stage: "test",
      time: "01/Jan/2024:00:00:00 +0000",
      timeEpoch: 1704067200000,
    },
  };
}

describe("login", () => {
  let mockClient: {
    query: jest.Mock;
    end: jest.Mock;
  };

  beforeEach(() => {
    mockClient = {
      query: jest.fn(),
      end: jest.fn().mockResolvedValue(undefined),
    };
    mockGetDbClient.mockResolvedValue(mockClient as any);

    mockJwtSign.mockReturnValue("fake-jwt-token" as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("returns 200 + token on success", async () => {
    const email = "test@example.com";
    const password = "password123";
    const salt = crypto.randomBytes(32).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    mockClient.query.mockResolvedValue({
      rows: [
        {
          id: "user-123",
          email,
          password_hash: passwordHash,
          salt,
          type: "applicant",
        },
      ],
    });

    const event = fakeEvent({ email, password });
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.token).toBe("fake-jwt-token");
    expect(body.role).toBe("applicant");
    expect(mockJwtSign).toHaveBeenCalledTimes(1);

    const callArgs = mockJwtSign.mock.calls[0];
    expect(callArgs[0]).toEqual({ userId: "user-123", email, type: "applicant" });
    expect(callArgs[2]).toEqual({ expiresIn: "7d" });
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 400 when user not found", async () => {
    mockClient.query.mockResolvedValue({
      rows: [],
    });

    const event = fakeEvent({ email: "notfound@example.com", password: "any" });
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid credentials");
    expect(mockJwtSign).not.toHaveBeenCalled();
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 400 when password is wrong", async () => {
    const email = "test@example.com";
    const correctPassword = "correct123";
    const wrongPassword = "wrong123";
    const salt = crypto.randomBytes(32).toString("hex");
    const correctHash = crypto
      .pbkdf2Sync(correctPassword, salt, 10000, 64, "sha512")
      .toString("hex");

    mockClient.query.mockResolvedValue({
      rows: [
        {
          id: "user-123",
          email,
          password_hash: correctHash,
          salt,
          type: "applicant",
        },
      ],
    });

    const event = fakeEvent({ email, password: wrongPassword });
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid credentials");
    expect(mockJwtSign).not.toHaveBeenCalled();
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 500 when DB throws", async () => {
    const dbError = new Error("Database connection failed");
    mockClient.query.mockRejectedValue(dbError);

    const event = fakeEvent({ email: "test@example.com", password: "any" });
    
    await expect(loginHandler(event as APIGatewayProxyEventV2)).rejects.toThrow("Database connection failed");
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 400 when email is missing", async () => {
    mockClient.query.mockResolvedValue({
      rows: [],
    });

    const event = {
      ...fakeEvent({ email: "test@example.com", password: "pass" }),
      body: JSON.stringify({ password: "pass" }),
    };
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid credentials");
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 400 when password is missing", async () => {
    mockClient.query.mockResolvedValue({
      rows: [],
    });

    const event = {
      ...fakeEvent({ email: "test@example.com", password: "pass" }),
      body: JSON.stringify({ email: "test@example.com" }),
    };
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid credentials");
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 500 when JSON body is invalid", async () => {
    const event = {
      ...fakeEvent({ email: "test@example.com", password: "pass" }),
      body: "{ invalid json }",
    };

    await expect(loginHandler(event as APIGatewayProxyEventV2)).rejects.toThrow();
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 500 when token generation fails", async () => {
    const email = "test@example.com";
    const password = "password123";
    const salt = crypto.randomBytes(32).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    mockClient.query.mockResolvedValue({
      rows: [
        {
          id: "user-123",
          email,
          password_hash: passwordHash,
          salt,
          type: "applicant",
        },
      ],
    });

    mockJwtSign.mockImplementation(() => {
      throw new Error("JWT signing failed");
    });

    const event = fakeEvent({ email, password });

    await expect(loginHandler(event as APIGatewayProxyEventV2)).rejects.toThrow("JWT signing failed");
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("returns 500 when query returns multiple users with same email", async () => {
    const email = "test@example.com";
    const password = "password123";
    const salt = crypto.randomBytes(32).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    mockClient.query.mockResolvedValue({
      rows: [
        {
          id: "user-123",
          email,
          password_hash: passwordHash,
          salt,
          type: "applicant",
        },
        {
          id: "user-456",
          email,
          password_hash: passwordHash,
          salt,
          type: "applicant",
        },
      ],
    });

    const event = fakeEvent({ email, password });
    

    const result = await loginHandler(event as APIGatewayProxyEventV2);
    

    expect(result.statusCode).toBe(200);
    const body = JSON.parse(result.body);
    expect(body.token).toBe("fake-jwt-token");
    expect(mockClient.end).toHaveBeenCalled();
  });

  it("handles case-sensitive email correctly", async () => {
    const email = "Test@Example.com";
    const password = "password123";
    const salt = crypto.randomBytes(32).toString("hex");
    const passwordHash = crypto
      .pbkdf2Sync(password, salt, 10000, 64, "sha512")
      .toString("hex");

    mockClient.query.mockResolvedValue({
      rows: [],
    });

    const event = fakeEvent({ email, password });
    const result = await loginHandler(event as APIGatewayProxyEventV2);

    expect(result.statusCode).toBe(400);
    const body = JSON.parse(result.body);
    expect(body.error).toBe("Invalid credentials");
    expect(mockClient.end).toHaveBeenCalled();
  });
});
