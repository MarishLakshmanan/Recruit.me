import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Client } from "pg";
import { Resource } from "sst";
import { verifyToken, requireRole } from "./middleware";
import { getDbClient } from "./db";

export const getCompanies: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["admin"]);
    
    const offset = parseInt(event.queryStringParameters?.offset || "0");
    const limit = parseInt(event.queryStringParameters?.limit || "20");

    const client = await getDbClient();
    try {
      const result = await client.query(
        `SELECT 
          u.id,
          u.name,
          COUNT(DISTINCT j.id) as job_count,
          COUNT(DISTINCT a.id) as application_count,
          COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count
        FROM users u
        LEFT JOIN jobs j ON u.id = j.company_id
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE u.type = 'company'
        GROUP BY u.id, u.name
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) FROM users WHERE type = 'company'"
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          companies: result.rows,
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

export const getJobs: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["admin"]);
    
    const offset = parseInt(event.queryStringParameters?.offset || "0");
    const limit = parseInt(event.queryStringParameters?.limit || "20");

    const client = await getDbClient();
    try {
      const result = await client.query(
        `SELECT 
          j.id,
          u.name as company_name,
          j.title,
          j.status,
          COUNT(DISTINCT a.id) as applicant_count,
          COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count
        FROM jobs j
        JOIN users u ON j.company_id = u.id
        LEFT JOIN applications a ON j.id = a.job_id
        GROUP BY j.id, u.name, j.title, j.status
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query("SELECT COUNT(*) FROM jobs");

      return {
        statusCode: 200,
        body: JSON.stringify({
          jobs: result.rows,
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

export const getCompanyJobs: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["admin"]);
    
    const companyId = event.pathParameters?.companyId;
    const offset = parseInt(event.queryStringParameters?.offset || "0");
    const limit = parseInt(event.queryStringParameters?.limit || "20");

    const client = await getDbClient();
    try {
      const companyCheck = await client.query(
        "SELECT id FROM users WHERE id = $1 AND type = 'company'",
        [companyId]
      );

      if (companyCheck.rows.length === 0) {
        return { statusCode: 404, body: JSON.stringify({ error: "Company not found" }) };
      }

      const result = await client.query(
        `SELECT 
          j.id,
          j.title,
          j.status,
          COUNT(DISTINCT a.id) as applicant_count,
          COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count
        FROM jobs j
        LEFT JOIN applications a ON j.id = a.job_id
        WHERE j.company_id = $1
        GROUP BY j.id, j.title, j.status
        LIMIT $2 OFFSET $3`,
        [companyId, limit, offset]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) FROM jobs WHERE company_id = $1",
        [companyId]
      );

      return {
        statusCode: 200,
        body: JSON.stringify({
          jobs: result.rows,
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

export const getApplicants: APIGatewayProxyHandlerV2 = async (event) => {
  try {
    const user = verifyToken(event);
    requireRole(user, ["admin"]);
    
    const offset = parseInt(event.queryStringParameters?.offset || "0");
    const limit = parseInt(event.queryStringParameters?.limit || "20");

    const client = await getDbClient();
    try {
      const result = await client.query(
        `SELECT 
          u.id,
          u.name,
          COUNT(DISTINCT a.id) as application_count,
          ARRAY_AGG(DISTINCT s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
        FROM users u
        LEFT JOIN applications a ON u.id = a.applicant_id
        LEFT JOIN applicant_skills s ON u.id = s.applicant_id
        WHERE u.type = 'applicant'
        GROUP BY u.id, u.name
        LIMIT $1 OFFSET $2`,
        [limit, offset]
      );

      const countResult = await client.query(
        "SELECT COUNT(*) FROM users WHERE type = 'applicant'"
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
