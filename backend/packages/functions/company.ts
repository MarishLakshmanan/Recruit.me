import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Client } from "pg";
import { Resource } from "sst";
import { verifyToken, requireRole } from "./middleware";
import crypto from "crypto";
import { getDbClient } from "./db";

export const getProfile: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);

    const client = await getDbClient();
    try {
      const userResult = await client.query(
        "SELECT id, name, email FROM users WHERE id = $1",
        [user.userId]
      );

      const jobsResult = await client.query(
        `SELECT 
          j.id, 
          j.title, 
          j.post_date,
          j.status,
          COUNT(DISTINCT a.id) as applicant_count,
          COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.company_id = $1
        GROUP BY j.id`,
        [user.userId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          ...userResult.rows[0],
          jobs: jobsResult.rows,
        }),
      };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const updateProfile: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const { name } = JSON.parse(event.body || "{}");

    const client = await getDbClient();
    try {
      await client.query("UPDATE users SET name = $1 WHERE id = $2", [name, user.userId]);
      return { statusCode: 200, body: JSON.stringify({ message: "Profile updated" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const createJob: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const { title, description, skills, salary } = JSON.parse(event.body || "{}");

    const client = await getDbClient();
    try {
      const jobId = crypto.randomUUID();
      await client.query(
        "INSERT INTO jobs (id, company_id, title, description, salary) VALUES ($1, $2, $3, $4, $5)",
        [jobId, user.userId, title, description, salary]
      );

      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await client.query(
            "INSERT INTO job_skills (job_id, skill) VALUES ($1, $2)",
            [jobId, skill]
          );
        }
      }

      return { statusCode: 200, body: JSON.stringify({ id: jobId }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const getJob: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;

    const client = await getDbClient();
    try {
      const result = await client.query(
        `SELECT 
          j.id, 
          j.title, 
          j.post_date,
          j.status,
          COUNT(DISTINCT a.id) as applicant_count,
          COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.id = $1 AND j.company_id = $2
        GROUP BY j.id`,
        [jobId, user.userId]
      );

      if (result.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const activateJob: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;

    const client = await getDbClient();
    try {
      const result = await client.query(
        "UPDATE jobs SET status = 'open', post_date = NOW() WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Job activated" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const closeJob: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;

    const client = await getDbClient();
    try {
      const result = await client.query(
        "UPDATE jobs SET status = 'closed' WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Job closed" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const reopenJob: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;

    const client = await getDbClient();
    try {
      const result = await client.query(
        "UPDATE jobs SET status = 'open' WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Job reopened" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const getApplicants: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;
    const offset = parseInt(event.queryStringParameters?.offset || "0");
    const limit = parseInt(event.queryStringParameters?.limit || "20");

    const client = await getDbClient();
    try {
      const jobCheck = await client.query(
        "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (jobCheck.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      const result = await client.query(
        `SELECT 
          u.id,
          u.name,
          a.rating,
          a.offer_status,
          ARRAY_AGG(s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
        FROM applications a
        JOIN users u ON a.applicant_id = u.id
        LEFT JOIN applicant_skills s ON u.id = s.applicant_id
        WHERE a.job_id = $1
        GROUP BY u.id, u.name, a.rating, a.offer_status
        LIMIT $2 OFFSET $3`,
        [jobId, limit, offset]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) FROM applications WHERE job_id = $1",
        [jobId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          applicants: result.rows,
          total: parseInt(countResult.rows[0].count),
        }),
      };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const rateApplicant: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;
    const applicantId = event.pathParameters?.applicantId;
    const { rating } = JSON.parse(event.body || "{}");

    const client = await getDbClient();
    try {
      const jobCheck = await client.query(
        "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (jobCheck.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      const result = await client.query(
        "UPDATE applications SET rating = $1 WHERE job_id = $2 AND applicant_id = $3",
        [rating, jobId, applicantId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Application not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Rating updated" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const extendOffer: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;
    const applicantId = event.pathParameters?.applicantId;

    const client = await getDbClient();
    try {
      const jobCheck = await client.query(
        "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (jobCheck.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      const result = await client.query(
        "UPDATE applications SET offer_status = 'offered' WHERE job_id = $1 AND applicant_id = $2",
        [jobId, applicantId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Application not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Offer extended" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};

export const rescindOffer: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["company"]);
    const jobId = event.pathParameters?.jobId;
    const applicantId = event.pathParameters?.applicantId;

    const client = await getDbClient();
    try {
      const jobCheck = await client.query(
        "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
        [jobId, user.userId]
      );

      if (jobCheck.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Job not found" }) };
      }

      const result = await client.query(
        "UPDATE applications SET offer_status = 'none' WHERE job_id = $1 AND applicant_id = $2",
        [jobId, applicantId]
      );

      if (result.rowCount === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Application not found" }) };
      }

      return { statusCode: 200, body: JSON.stringify({ message: "Offer rescinded" }) };
    } finally {
      await client.end();
    }
  } catch (error: any) {
    if (error.message === "No authorization header" || error.message === "Invalid token") {
      return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
    }
    if (error.message === "Forbidden") {
      return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
    }
    throw error;
  }
};
