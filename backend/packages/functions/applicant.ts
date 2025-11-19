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
      await client.query("UPDATE users SET name = $1 WHERE id = $2", [
        name,
        user!.userId,
      ]);
    }

    if (skills) {
      await client.query(
        "DELETE FROM applicant_skills WHERE applicant_id = $1",
        [user!.userId]
      );

      for (const skill of skills) {
        await client.query(
          "INSERT INTO applicant_skills (applicant_id, skill) VALUES ($1, $2)",
          [user!.userId, skill]
        );
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Profile updated" }),
    };
  } finally {
    await client.end();
  }
};

export const getJobDetail: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    // First get the job details and application status
    const jobResult = await client.query(
      `SELECT 
        j.id,
        j.title,
        j.description,
        j.salary,
        j.post_date,
        a.id as application_id,
        a.offer_status
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id AND a.applicant_id = $2
      WHERE j.id = $1 AND j.status = 'open'`,
      [jobId, user!.userId]
    );

    if (jobResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found or not open" }),
      };
    }

    const job = jobResult.rows[0];

    // Get skills separately
    const skillsResult = await client.query(
      "SELECT skill FROM job_skills WHERE job_id = $1",
      [jobId]
    );

    const skills = skillsResult.rows.map((r) => r.skill);

    // Determine application status
    let applicationStatus = "Not Applied";
    if (job.application_id) {
      // Application exists
      if (job.offer_status) {
        switch (job.offer_status) {
          case "rejected":
            applicationStatus = "Rejected";
            break;
          case "offered":
            applicationStatus = "Offer";
            break;
          case "accepted":
            applicationStatus = "Accepted";
            break;
          default:
            applicationStatus = "Applied";
        }
      } else {
        // Application exists but no offer_status set (shouldn't happen, but handle it)
        applicationStatus = "Applied";
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        id: job.id,
        title: job.title,
        description: job.description,
        salary: job.salary,
        post_date: job.post_date,
        skills: skills,
        application_status: applicationStatus,
      }),
    };
  } finally {
    await client.end();
  }
};

export const searchJobs: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["applicant"]);
  if (error) return UNAUTHORIZED;

  const skill = event.queryStringParameters?.skill;
  const search = event.queryStringParameters?.search;
  const status = event.queryStringParameters?.status;
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
        j.post_date,
        j.salary,
        COUNT(DISTINCT apps_count.id) as applicant_count,
        ARRAY_AGG(DISTINCT js.skill) FILTER (WHERE js.skill IS NOT NULL) as skills,
        CASE
          WHEN user_app.id IS NULL THEN 'Open'
          WHEN user_app.offer_status = 'rejected' THEN 'Rejected'
          WHEN user_app.offer_status = 'offered' THEN 'Offer'
          WHEN user_app.offer_status = 'accepted' THEN 'Accepted'
          ELSE 'Applied'
        END as application_status
      FROM jobs j
      JOIN users u ON j.company_id = u.id
      LEFT JOIN job_skills js ON j.id = js.job_id
      LEFT JOIN applications apps_count ON j.id = apps_count.job_id
      LEFT JOIN applications user_app ON j.id = user_app.job_id AND user_app.applicant_id = $1
      WHERE j.status = 'open'
    `;
    const params: any[] = [user!.userId];
    let paramIndex = 2;

    if (skill) {
      query += ` AND EXISTS (SELECT 1 FROM job_skills WHERE job_id = j.id AND skill ILIKE $${paramIndex})`;
      params.push(`%${skill}%`);
      paramIndex++;
    }

    if (search) {
      query += ` AND (u.name ILIKE $${paramIndex} OR j.title ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (status && status !== 'All') {
      if (status === 'Open') {
        query += ` AND user_app.id IS NULL`;
      } else if (status === 'Applied') {
        query += ` AND user_app.id IS NOT NULL AND (user_app.offer_status IS NULL OR user_app.offer_status = 'none')`;
      } else if (status === 'Offer') {
        query += ` AND user_app.offer_status = 'offered'`;
      } else if (status === 'Accepted') {
        query += ` AND user_app.offer_status = 'accepted'`;
      } else if (status === 'Rejected') {
        query += ` AND user_app.offer_status = 'rejected'`;
      }
    }

    query += ` GROUP BY j.id, j.title, u.name, j.description, j.post_date, j.salary, user_app.id, user_app.offer_status
               ORDER BY j.post_date DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    let countQuery = `
      SELECT COUNT(DISTINCT j.id)
      FROM jobs j
      JOIN users u ON j.company_id = u.id
      LEFT JOIN applications user_app ON j.id = user_app.job_id AND user_app.applicant_id = $1
      WHERE j.status = 'open'
    `;
    const countParams: any[] = [user!.userId];
    let countParamIndex = 2;

    if (skill) {
      countQuery += ` AND EXISTS (SELECT 1 FROM job_skills WHERE job_id = j.id AND skill ILIKE $${countParamIndex})`;
      countParams.push(`%${skill}%`);
      countParamIndex++;
    }

    if (search) {
      countQuery += ` AND (u.name ILIKE $${countParamIndex} OR j.title ILIKE $${countParamIndex})`;
      countParams.push(`%${search}%`);
      countParamIndex++;
    }

    if (status && status !== 'All') {
      if (status === 'Open') {
        countQuery += ` AND user_app.id IS NULL`;
      } else if (status === 'Applied') {
        countQuery += ` AND user_app.id IS NOT NULL AND (user_app.offer_status IS NULL OR user_app.offer_status = 'none')`;
      } else if (status === 'Offer') {
        countQuery += ` AND user_app.offer_status = 'offered'`;
      } else if (status === 'Accepted') {
        countQuery += ` AND user_app.offer_status = 'accepted'`;
      } else if (status === 'Rejected') {
        countQuery += ` AND user_app.offer_status = 'rejected'`;
      }
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found or not open" }),
      };
    }

    const applicationId = crypto.randomUUID();
    await client.query(
      "INSERT INTO applications (id, job_id, applicant_id) VALUES ($1, $2, $3)",
      [applicationId, jobId, user!.userId]
    );

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Application submitted" }),
    };
  } catch (error: any) {
    if (error.code === "23505") {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Already applied" }),
      };
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Application withdrawn" }),
    };
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Offer not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Offer accepted" }),
    };
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Accepted offer not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Acceptance rescinded" }),
    };
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
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Offer not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Offer rejected" }),
    };
  } finally {
    await client.end();
  }
};
