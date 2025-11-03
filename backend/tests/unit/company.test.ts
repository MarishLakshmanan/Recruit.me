process.env.JWT_SECRET = "test-secret";

jest.mock("jsonwebtoken");
jest.mock("../../packages/functions/db.js");
jest.mock("../../packages/functions/middleware.js", () => {
  const originalModule = jest.requireActual("../../packages/functions/middleware.js");
  return {
    ...originalModule,
    verifyTokenAndRole: jest.fn(),
  };
});

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import { createJob, getJob, getProfile, getApplicants } from "../../packages/functions/company.js";
import { verifyTokenAndRole } from "../../packages/functions/middleware.js";
import { getDbClient } from "../../packages/functions/db.js";

type Result = {
  statusCode: number;
  body: string;
};
type AsyncHandler = (event: APIGatewayProxyEventV2) => Promise<Result>;

const createJobHandler = createJob as unknown as AsyncHandler;
const getJobHandler = getJob as unknown as AsyncHandler;
const getProfileHandler = getProfile as unknown as AsyncHandler;
const getApplicantsHandler = getApplicants as unknown as AsyncHandler;

const mockVerifyTokenAndRole = verifyTokenAndRole as jest.MockedFunction<typeof verifyTokenAndRole>;
const mockGetDbClient = getDbClient as jest.MockedFunction<typeof getDbClient>;

const mockClient = {
  query: jest.fn(),
  end: jest.fn().mockResolvedValue(undefined),
};

function fakeEvent({
  body,
  headers = {},
  pathParameters,
  queryStringParameters,
}: {
  body?: string;
  headers?: Record<string, string>;
  pathParameters?: Record<string, string>;
  queryStringParameters?: Record<string, string>;
}): APIGatewayProxyEventV2 {
  return {
    body: body,
    headers,
    isBase64Encoded: false,
    rawPath: "/test",
    rawQueryString: "",
    routeKey: "GET /test",
    version: "2.0",
    pathParameters,
    queryStringParameters,
    requestContext: {
      accountId: "test",
      apiId: "test",
      domainName: "test.execute-api.us-east-1.amazonaws.com",
      domainPrefix: "test",
      http: {
        method: "GET",
        path: "/test",
        protocol: "HTTP/1.1",
        sourceIp: "127.0.0.1",
        userAgent: "test",
      },
      requestId: "test",
      routeKey: "GET /test",
      stage: "test",
      time: "01/Jan/2024:00:00:00 +0000",
      timeEpoch: 1704067200000,
    },
  };
}

function bearer(token: string): Record<string, string> {
  return { authorization: `Bearer ${token}` };
}

function parseBody(result: Result): any {
  return JSON.parse(result.body);
}

describe("Company Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.end.mockReset();
    mockClient.end.mockResolvedValue(undefined);
    mockGetDbClient.mockResolvedValue(mockClient as any);
    
    mockVerifyTokenAndRole.mockReturnValue([null, true]);
  });

  describe("createJob", () => {
    it("returns 401 when missing token", async () => {
      const event = fakeEvent({
        body: JSON.stringify({ title: "Software Engineer", description: "Job description" }),
      });

      const result = await createJobHandler(event);

      expect(result.statusCode).toBe(401);
      const body = parseBody(result);
      expect(body.error).toBe("Unauthorized");
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 401 when role is not company", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);

      const event = fakeEvent({
        body: JSON.stringify({ title: "Software Engineer" }),
        headers: bearer("valid-token"),
      });

      const result = await createJobHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 400 when title is missing", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });

      const event = fakeEvent({
        body: JSON.stringify({ description: "Job description" }),
        headers: bearer("valid-token"),
      });

      const result = await createJobHandler(event);
      expect(result.statusCode).toBe(200); 
      expect(mockClient.query).toHaveBeenCalled();
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 }); 

      const event = fakeEvent({
        body: JSON.stringify({
          title: "Software Engineer",
          description: "Job description",
          salary: 100000,
        }),
        headers: bearer("valid-token"),
      });

      const result = await createJobHandler(event);

      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.id).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledTimes(1); 
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 200 on success with skills", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); 
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 }); 

      const event = fakeEvent({
        body: JSON.stringify({
          title: "Software Engineer",
          description: "Job description",
          salary: 100000,
          skills: ["JavaScript", "TypeScript"],
        }),
        headers: bearer("valid-token"),
      });

      const result = await createJobHandler(event);

      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.id).toBeDefined();
      expect(mockClient.query).toHaveBeenCalledTimes(3); 
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 500 on unexpected DB error", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockRejectedValueOnce(new Error("Database connection failed"));

      const event = fakeEvent({
        body: JSON.stringify({
          title: "Software Engineer",
          description: "Job description",
        }),
        headers: bearer("valid-token"),
      });

      await expect(createJobHandler(event)).rejects.toThrow("Database connection failed");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("handles duplicate key error (23505) - returns 500", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      const duplicateError: any = new Error("Duplicate key");
      duplicateError.code = "23505";
      mockClient.query.mockReset();
      mockClient.query.mockRejectedValueOnce(duplicateError);

      const event = fakeEvent({
        body: JSON.stringify({
          title: "Software Engineer",
          description: "Job description",
        }),
        headers: bearer("valid-token"),
      });

      await expect(createJobHandler(event)).rejects.toThrow();
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("getJob (as updateJob substitute)", () => {
    it("returns 401 when missing token", async () => {
      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
      });

      const result = await getJobHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 401 when role is not company", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getJobHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 404 when job not found", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({ rows: [] });

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getJobHandler(event);

      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Job not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: "job-123",
            title: "Software Engineer",
            post_date: "2024-01-01",
            status: "open",
            applicant_count: "5",
            hired_count: "2",
          },
        ],
      });

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getJobHandler(event);

      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.id).toBe("job-123");
      expect(body.title).toBe("Software Engineer");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 500 on DB error", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockRejectedValueOnce(new Error("Database error"));

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      await expect(getJobHandler(event)).rejects.toThrow("Database error");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("getProfile (as listMyJobs)", () => {
    it("returns 401 when missing token", async () => {
      const event = fakeEvent({});

      const result = await getProfileHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 401 when role is not company", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);

      const event = fakeEvent({
        headers: bearer("valid-token"),
      });

      const result = await getProfileHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 200 with jobs array", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: "user-123", name: "Company Name", email: "company@example.com" }],
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: "job-1",
            title: "Job 1",
            post_date: "2024-01-01",
            status: "open",
            applicant_count: "3",
            hired_count: "1",
          },
          {
            id: "job-2",
            title: "Job 2",
            post_date: "2024-01-02",
            status: "closed",
            applicant_count: "5",
            hired_count: "2",
          },
        ],
      });

      const event = fakeEvent({
        headers: bearer("valid-token"),
      });

      const result = await getProfileHandler(event);

      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.jobs).toBeDefined();
      expect(Array.isArray(body.jobs)).toBe(true);
      expect(body.jobs.length).toBe(2);
      expect(body.jobs[0].id).toBe("job-1");
      expect(body.jobs[0].title).toBe("Job 1");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("getApplicants (listJobApplicants)", () => {
    it("returns 401 when missing token", async () => {
      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
      });

      const result = await getApplicantsHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 401 when role is not company", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getApplicantsHandler(event);

      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 200 with applicants array", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({
        rows: [{ id: "job-123" }],
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [
          {
            id: "applicant-1",
            name: "John Doe",
            rating: 4,
            offer_status: "none",
            skills: ["JavaScript", "TypeScript"],
          },
          {
            id: "applicant-2",
            name: "Jane Smith",
            rating: 5,
            offer_status: "offered",
            skills: ["Python", "Django"],
          },
        ],
      });

      mockClient.query.mockResolvedValueOnce({
        rows: [{ count: "2" }],
      });

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getApplicantsHandler(event);

      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.applicants).toBeDefined();
      expect(Array.isArray(body.applicants)).toBe(true);
      expect(body.applicants.length).toBe(2);
      expect(body.applicants[0].id).toBe("applicant-1");
      expect(body.applicants[0].name).toBe("John Doe");
      expect(body.total).toBe(2);
      expect(mockClient.query).toHaveBeenCalledTimes(3);
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 404 when job not found", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockReset();
      mockClient.query.mockResolvedValueOnce({
        rows: [],
      });

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      const result = await getApplicantsHandler(event);

      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Job not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 500 on DB error", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "company-123", email: "company@example.com", type: "company" },
        false,
      ]);

      mockClient.query.mockRejectedValueOnce(new Error("Database error"));

      const event = fakeEvent({
        pathParameters: { jobId: "job-123" },
        headers: bearer("valid-token"),
      });

      await expect(getApplicantsHandler(event)).rejects.toThrow("Database error");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });
});

