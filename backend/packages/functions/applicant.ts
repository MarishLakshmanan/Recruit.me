import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { verifyTokenAndRole, UNAUTHORIZED } from "./middleware";
import crypto from "crypto";
import { getDbClient } from "./db";

export const getProfile: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const client = await getDbClient();
  try {
    const userResult = await client.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [user!.userId]
    );

    const skillsResult = await client.query(
      "SELECT skill FROM applicant_skills WHERE applicant_id = $1",
      [user!.userId]
    );

    const applicationsResult = await client.query(
      `SELECT 
        j.id as job_id,
        u.name as company_name,
        j.title as job_title,
        CASE 
          WHEN a.offer_status = 'rejected' THEN 'rejected'
          WHEN a.offer_status = 'offered' THEN 'offered'
          WHEN a.offer_status = 'accepted' THEN 'accepted'
          ELSE 'pending'
        END as status,
        j.post_date,
        a.apply_date,
        (SELECT COUNT(*) FROM applications WHERE job_id = j.id) as applicant_count,
        ARRAY_AGG(js.skill) FILTER (WHERE js.skill IS NOT NULL) as skills
      FROM applications a
      JOIN jobs j ON a.job_id = j.id
      JOIN users u ON j.company_id = u.id
      LEFT JOIN job_skills js ON j.id = js.job_id
      WHERE a.applicant_id = $1
      GROUP BY j.id, u.name, j.title, a.offer_status, j.post_date, a.apply_date`,
      [user!.userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...userResult.rows[0],
        skills: skillsResult.rows.map((r) => r.skill),
        applications: applicationsResult.rows,
      }),
    };
  } finally {
    await client.end();
  }
};

export const updateProfile: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const { name, skills } = JSON.parse(event.body || "{}");

  const client = await getDbClient();
  try {
    if (name) {
      await client.query("UPDATE users SET name = $1 WHERE id = $2", [name, user!.userId]);
    }

    if (skills) {
      await client.query("DELETE FROM applicant_skills WHERE applicant_id = $1", [user!.userId]);
      
      for (const skill of skills) {
        await client.query(
          "INSERT INTO applicant_skills (applicant_id, skill) VALUES ($1, $2)",
          [user!.userId, skill]
        );
      }
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Profile updated" }) };
  } finally {
    await client.end();
  }
};

export const searchJobs: APIGatewayProxyHandlerV2 = async (event) => {
  const skill = event.queryStringParameters?.skill;
  const company = event.queryStringParameters?.company;
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    let query = `
      SELECT 
        j.id,
        j.title,
        u.name as company_name,
        j.description,
        ARRAY_AGG(js.skill) FILTER (WHERE js.skill IS NOT NULL) as skills
      FROM jobs j
      JOIN users u ON j.company_id = u.id
      LEFT JOIN job_skills js ON j.id = js.job_id
      WHERE j.status = 'open'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (skill) {
      query += ` AND EXISTS (SELECT 1 FROM job_skills WHERE job_id = j.id AND skill ILIKE $${paramIndex})`;
      params.push(`%${skill}%`);
      paramIndex++;
    }

    if (company) {
      query += ` AND u.name ILIKE $${paramIndex}`;
      params.push(`%${company}%`);
      paramIndex++;
    }

    query += ` GROUP BY j.id, j.title, u.name, j.description LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    let countQuery = "SELECT COUNT(DISTINCT j.id) FROM jobs j JOIN users u ON j.company_id = u.id WHERE j.status = 'open'";
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (skill) {
      countQuery += ` AND EXISTS (SELECT 1 FROM job_skills WHERE job_id = j.id AND skill ILIKE $${countParamIndex})`;
      countParams.push(`%${skill}%`);
      countParamIndex++;
    }

    if (company) {
      countQuery += ` AND u.name ILIKE $${countParamIndex}`;
      countParams.push(`%${company}%`);
    }

    const countResult = await client.query(countQuery, countParams);

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
};

export const apply: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND status = 'open'",
      [jobId]
    );

    if (jobCheck.rows.length === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Job not found or not open" }) };
    }

    const applicationId = crypto.randomUUID();
    await client.query(
      "INSERT INTO applications (id, job_id, applicant_id) VALUES ($1, $2, $3)",
      [applicationId, jobId, user!.userId]
    );

    return { statusCode: 200, body: JSON.stringify({ message: "Application submitted" }) };
  } catch (error: any) {
    if (error.code === "23505") {
      return { statusCode: 400, body: JSON.stringify({ error: "Already applied" }) };
    }
    throw error;
  } finally {
    await client.end();
  }
};

export const withdraw: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "DELETE FROM applications WHERE job_id = $1 AND applicant_id = $2",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Application not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Application withdrawn" }) };
  } finally {
    await client.end();
  }
};

export const acceptOffer: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE applications SET offer_status = 'accepted' WHERE job_id = $1 AND applicant_id = $2 AND offer_status = 'offered'",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Offer not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Offer accepted" }) };
  } finally {
    await client.end();
  }
};

export const rescindAcceptance: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE applications SET offer_status = 'offered' WHERE job_id = $1 AND applicant_id = $2 AND offer_status = 'accepted'",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Accepted offer not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Acceptance rescinded" }) };
  } finally {
    await client.end();
  }
};

export const rejectOffer: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE applications SET offer_status = 'rejected' WHERE job_id = $1 AND applicant_id = $2 AND offer_status = 'offered'",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return { statusCode: 404, body: JSON.stringify({ error: "Offer not found" }) };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Offer rejected" }) };
  } finally {
    await client.end();
  }
};
