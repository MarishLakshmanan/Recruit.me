jest.mock("../../packages/functions/db.js");
jest.mock("../../packages/functions/middleware.js", () => {
  const originalModule = jest.requireActual("../../packages/functions/middleware.js");
  return {
    ...originalModule,
    verifyTokenAndRole: jest.fn(),
  };
});

import type { APIGatewayProxyEventV2 } from "aws-lambda";
import {
  getProfile,
  updateProfile,
  searchJobs,
  apply,
  withdraw,
  acceptOffer,
  rescindAcceptance,
  rejectOffer,
} from "../../packages/functions/applicant.js";
import { verifyTokenAndRole } from "../../packages/functions/middleware.js";
import { getDbClient } from "../../packages/functions/db.js";

type Result = { statusCode: number; body: string };
type AsyncHandler = (event: APIGatewayProxyEventV2) => Promise<Result>;

const getProfileHandler = getProfile as unknown as AsyncHandler;
const updateProfileHandler = updateProfile as unknown as AsyncHandler;
const searchJobsHandler = searchJobs as unknown as AsyncHandler;
const applyHandler = apply as unknown as AsyncHandler;
const withdrawHandler = withdraw as unknown as AsyncHandler;
const acceptOfferHandler = acceptOffer as unknown as AsyncHandler;
const rescindAcceptanceHandler = rescindAcceptance as unknown as AsyncHandler;
const rejectOfferHandler = rejectOffer as unknown as AsyncHandler;

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
    body,
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

describe("Applicant Handlers", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClient.query.mockReset();
    mockClient.end.mockReset();
    mockClient.end.mockResolvedValue(undefined);
    mockGetDbClient.mockResolvedValue(mockClient as any);
  });

  describe("getProfile", () => {
    it("returns 401 when unauthorized", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);
      const event = fakeEvent({});
      const result = await getProfileHandler(event);
      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 200 with user, skills, applications", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);

      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "applicant-1", name: "Alice", email: "a@a.com" }] })
        .mockResolvedValueOnce({ rows: [{ skill: "JS" }, { skill: "TS" }] })
        .mockResolvedValueOnce({
          rows: [
            {
              job_id: "job-1",
              company_name: "Company X",
              job_title: "Engineer",
              status: "pending",
              post_date: "2024-01-01",
              apply_date: "2024-01-02",
              applicant_count: "5",
              skills: ["JS"],
            },
          ],
        });

      const event = fakeEvent({ headers: bearer("t") });
      const result = await getProfileHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.id).toBe("applicant-1");
      expect(body.skills).toEqual(["JS", "TS"]);
      expect(Array.isArray(body.applications)).toBe(true);
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("updateProfile", () => {
    it("returns 401 when unauthorized", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);
      const event = fakeEvent({ body: JSON.stringify({ name: "Bob" }) });
      const result = await updateProfileHandler(event);
      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("updates name and skills, returns 200", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);

      mockClient.query
        .mockResolvedValueOnce({ rowCount: 1 })
        .mockResolvedValueOnce({ rowCount: 2 }) 
        .mockResolvedValueOnce({ rowCount: 1 }) 
        .mockResolvedValueOnce({ rowCount: 1 }); 

      const event = fakeEvent({
        body: JSON.stringify({ name: "Bob", skills: ["JS", "TS"] }),
        headers: bearer("t"),
      });
      const result = await updateProfileHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Profile updated");
      expect(mockClient.query).toHaveBeenCalledTimes(4);
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("searchJobs", () => {
    it("returns 200 with jobs and total (no filters)", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "job-1", title: "Eng", company_name: "X", description: "d", skills: ["JS"] }] })
        .mockResolvedValueOnce({ rows: [{ count: "1" }] });

      const event = fakeEvent({ queryStringParameters: { limit: "10", offset: "0" } });
      const result = await searchJobsHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.jobs.length).toBe(1);
      expect(body.total).toBe(1);
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("applies skill and company filters", async () => {
      mockClient.query
        .mockResolvedValueOnce({ rows: [] })
        .mockResolvedValueOnce({ rows: [{ count: "0" }] });

      const event = fakeEvent({ queryStringParameters: { skill: "JS", company: "Acme", limit: "5", offset: "5" } });
      const result = await searchJobsHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(Array.isArray(body.jobs)).toBe(true);
      expect(typeof body.total).toBe("number");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("apply", () => {
    it("returns 401 when unauthorized", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);
      const event = fakeEvent({ pathParameters: { jobId: "job-1" } });
      const result = await applyHandler(event);
      expect(result.statusCode).toBe(401);
      expect(mockClient.query).not.toHaveBeenCalled();
    });

    it("returns 404 when job not open", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rows: [] });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await applyHandler(event);
      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Job not found or not open");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "job-1" }] }) 
        .mockResolvedValueOnce({ rowCount: 1 }); 
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await applyHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Application submitted");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 400 when already applied (23505)", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query
        .mockResolvedValueOnce({ rows: [{ id: "job-1" }] })
        .mockRejectedValueOnce(Object.assign(new Error("dup"), { code: "23505" }));
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await applyHandler(event);
      expect(result.statusCode).toBe(400);
      const body = parseBody(result);
      expect(body.error).toBe("Already applied");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("withdraw", () => {
    it("returns 401 when unauthorized", async () => {
      mockVerifyTokenAndRole.mockReturnValue([null, true]);
      const event = fakeEvent({ pathParameters: { jobId: "job-1" } });
      const result = await withdrawHandler(event);
      expect(result.statusCode).toBe(401);
    });

    it("returns 404 when application not found", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await withdrawHandler(event);
      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Application not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("returns 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await withdrawHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Application withdrawn");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });

  describe("offer status transitions", () => {
    it("acceptOffer: 404 when no offered row", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await acceptOfferHandler(event);
      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Offer not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("acceptOffer: 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await acceptOfferHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Offer accepted");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("rescindAcceptance: 404 when none to rescind", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await rescindAcceptanceHandler(event);
      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Accepted offer not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("rescindAcceptance: 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await rescindAcceptanceHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Acceptance rescinded");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("rejectOffer: 404 when no offered row", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 0 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await rejectOfferHandler(event);
      expect(result.statusCode).toBe(404);
      const body = parseBody(result);
      expect(body.error).toBe("Offer not found");
      expect(mockClient.end).toHaveBeenCalled();
    });

    it("rejectOffer: 200 on success", async () => {
      mockVerifyTokenAndRole.mockReturnValue([
        { userId: "applicant-1", email: "a@a.com", type: "applicant" },
        false,
      ]);
      mockClient.query.mockResolvedValueOnce({ rowCount: 1 });
      const event = fakeEvent({ pathParameters: { jobId: "job-1" }, headers: bearer("t") });
      const result = await rejectOfferHandler(event);
      expect(result.statusCode).toBe(200);
      const body = parseBody(result);
      expect(body.message).toBe("Offer rejected");
      expect(mockClient.end).toHaveBeenCalled();
    });
  });
});


