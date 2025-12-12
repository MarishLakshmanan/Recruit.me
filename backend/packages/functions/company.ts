import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { verifyTokenAndRole, UNAUTHORIZED } from "./middleware";
import crypto from "crypto";
import { getDbClient } from "./db";

export const getProfile: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const status = event.queryStringParameters?.status;
  const skillsParam = event.queryStringParameters?.skills;
  const skills = skillsParam?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    const userResult = await client.query(
      "SELECT id, name, email FROM users WHERE id = $1",
      [user!.userId]
    );

    if (userResult.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "User not found" }),
      };
    }

    let jobsQuery = `
      SELECT
        j.id,
        j.title,
        j.post_date,
        j.status,
        j.description,
        j.salary,
        COUNT(DISTINCT a.id) as applicant_count,
        COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count,
        ARRAY_AGG(DISTINCT js.skill) FILTER (WHERE js.skill IS NOT NULL) as skills
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      LEFT JOIN job_skills js ON j.id = js.job_id
      WHERE j.company_id = $1
    `;
    const params: any[] = [user!.userId];
    let paramIndex = 2;

    if (status && status !== "All") {
      if (status === "Open") {
        jobsQuery += ` AND j.status = 'open'`;
      } else if (status === "Closed") {
        jobsQuery += ` AND j.status = 'closed'`;
      } else if (status === "Inactive") {
        jobsQuery += ` AND j.status = 'inactive'`;
      }
    }

    if (skills.length > 0) {
      const skillConditions = skills.map((_, index) => {
        return `skill ILIKE $${paramIndex + index}`;
      }).join(' OR ');

      jobsQuery += ` AND (
        SELECT COUNT(DISTINCT skill)
        FROM job_skills
        WHERE job_id = j.id
        AND (${skillConditions})
      ) = $${paramIndex + skills.length}`;

      skills.forEach(skill => {
        params.push(`%${skill}%`);
      });
      params.push(skills.length);
      paramIndex += skills.length + 1;
    }

    jobsQuery += ` GROUP BY j.id, j.title, j.post_date, j.status, j.description, j.salary
                  ORDER BY j.post_date DESC NULLS LAST
                  LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const jobsResult = await client.query(jobsQuery, params);

    let countQuery = `
      SELECT COUNT(DISTINCT j.id)
      FROM jobs j
      WHERE j.company_id = $1
    `;
    const countParams: any[] = [user!.userId];
    let countParamIndex = 2;

    if (status && status !== "All") {
      if (status === "Open") {
        countQuery += ` AND j.status = 'open'`;
      } else if (status === "Closed") {
        countQuery += ` AND j.status = 'closed'`;
      } else if (status === "Inactive") {
        countQuery += ` AND j.status = 'inactive'`;
      }
    }

    if (skills.length > 0) {
      const skillConditions = skills.map((_, index) => {
        return `skill ILIKE $${countParamIndex + index}`;
      }).join(' OR ');

      countQuery += ` AND (
        SELECT COUNT(DISTINCT skill)
        FROM job_skills
        WHERE job_id = j.id
        AND (${skillConditions})
      ) = $${countParamIndex + skills.length}`;

      skills.forEach(skill => {
        countParams.push(`%${skill}%`);
      });
      countParams.push(skills.length);
    }

    const countResult = await client.query(countQuery, countParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...userResult.rows[0],
        jobs: jobsResult.rows,
        total: parseInt(countResult.rows[0].count),
      }),
    };
  } catch (error: any) {
    console.error("Error in getProfile:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
    };
  } finally {
    await client.end();
  }
};

export const updateProfile: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const { name } = JSON.parse(event.body || "{}");

  const client = await getDbClient();
  try {
    await client.query("UPDATE users SET name = $1 WHERE id = $2", [
      name,
      user!.userId,
    ]);
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Profile updated" }),
    };
  } finally {
    await client.end();
  }
};

export const createJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const { title, description, skills, salary } = JSON.parse(event.body || "{}");

  const client = await getDbClient();
  try {
    const jobId = crypto.randomUUID();
    // Handle null/undefined/empty description - convert to NULL for database
    const descriptionValue =
      description && description.trim() ? description.trim() : null;
    await client.query(
      "INSERT INTO jobs (id, company_id, title, description, salary, status) VALUES ($1, $2, $3, $4, $5, $6)",
      [jobId, user!.userId, title, descriptionValue, salary, "inactive"]
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
  } catch (error: any) {
    console.error("Error in createJob:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message || "Internal Server Error",
      }),
    };
  } finally {
    await client.end();
  }
};

export const getJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      `SELECT 
        j.id, 
        j.title,
        j.description,
        j.salary,
        j.post_date,
        j.status,
        COUNT(DISTINCT a.id) as applicant_count,
        COUNT(DISTINCT CASE WHEN a.offer_status = 'accepted' THEN a.id END) as hired_count,
        ARRAY_AGG(js.skill) FILTER (WHERE js.skill IS NOT NULL) as skills
      FROM jobs j
      LEFT JOIN applications a ON j.id = a.job_id
      LEFT JOIN job_skills js ON j.id = js.job_id
      WHERE j.id = $1 AND j.company_id = $2
      GROUP BY j.id, j.title, j.description, j.salary, j.post_date, j.status`,
      [jobId, user!.userId]
    );

    if (result.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    return { statusCode: 200, body: JSON.stringify(result.rows[0]) };
  } finally {
    await client.end();
  }
};

export const updateJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const { title, description, skills, salary } = JSON.parse(event.body || "{}");

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const updates: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      params.push(title);
      paramIndex++;
    }

    if (description !== undefined) {
      // Convert empty strings to NULL, otherwise use trimmed value
      const descriptionValue =
        description && description.trim() ? description.trim() : null;
      updates.push(`description = $${paramIndex}`);
      params.push(descriptionValue);
      paramIndex++;
    }

    if (salary !== undefined) {
      updates.push(`salary = $${paramIndex}`);
      params.push(salary);
      paramIndex++;
    }

    if (updates.length > 0) {
      params.push(jobId, user!.userId);
      await client.query(
        `UPDATE jobs SET ${updates.join(
          ", "
        )} WHERE id = $${paramIndex} AND company_id = $${paramIndex + 1}`,
        params
      );
    }

    if (skills !== undefined) {
      await client.query("DELETE FROM job_skills WHERE job_id = $1", [jobId]);

      if (skills && skills.length > 0) {
        for (const skill of skills) {
          await client.query(
            "INSERT INTO job_skills (job_id, skill) VALUES ($1, $2)",
            [jobId, skill]
          );
        }
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Job updated" }),
    };
  } finally {
    await client.end();
  }
};

export const activateJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE jobs SET status = 'open', post_date = NOW() WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Job activated" }),
    };
  } finally {
    await client.end();
  }
};

export const closeJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE jobs SET status = 'closed' WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    return { statusCode: 200, body: JSON.stringify({ message: "Job closed" }) };
  } finally {
    await client.end();
  }
};

export const reopenJob: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;

  const client = await getDbClient();
  try {
    const result = await client.query(
      "UPDATE jobs SET status = 'open' WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Job reopened" }),
    };
  } finally {
    await client.end();
  }
};

export const getApplicants: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const result = await client.query(
      `SELECT 
        u.id,
        u.name,
        a.rating,
        a.offer_status,
        a.apply_date,
        ARRAY_AGG(s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      LEFT JOIN applicant_skills s ON u.id = s.applicant_id
      WHERE a.job_id = $1
      GROUP BY u.id, u.name, a.rating, a.offer_status, a.apply_date
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
};

export const getHirableApplicants: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const result = await client.query(
      `SELECT 
        u.id,
        u.name,
        a.rating,
        a.offer_status,
        a.apply_date,
        ARRAY_AGG(s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      LEFT JOIN applicant_skills s ON u.id = s.applicant_id
      WHERE a.job_id = $1 AND a.rating = 'hirable'
      GROUP BY u.id, u.name, a.rating, a.offer_status, a.apply_date
      ORDER BY a.apply_date DESC
      LIMIT $2 OFFSET $3`,
      [jobId, limit, offset]
    );

    const countResult = await client.query(
      "SELECT COUNT(*) FROM applications WHERE job_id = $1 AND rating = 'hirable'",
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
};

export const getApplicantsByOfferStatus: APIGatewayProxyHandlerV2 = async (
  event
) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const offerStatus = event.queryStringParameters?.offer_status || "all";
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    let query = `
      SELECT 
        u.id,
        u.name,
        a.rating,
        a.offer_status,
        a.apply_date,
        ARRAY_AGG(s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
      FROM applications a
      JOIN users u ON a.applicant_id = u.id
      LEFT JOIN applicant_skills s ON u.id = s.applicant_id
      WHERE a.job_id = $1
    `;

    let countQuery = `SELECT COUNT(*) FROM applications WHERE job_id = $1`;
    const params: any[] = [jobId];
    let paramIndex = 2;

    if (offerStatus !== "all") {
      query += ` AND a.offer_status = $${paramIndex}`;
      countQuery += ` AND offer_status = $${paramIndex}`;
      params.push(offerStatus);
      paramIndex++;
    }

    query += ` GROUP BY u.id, u.name, a.rating, a.offer_status, a.apply_date
               ORDER BY a.apply_date DESC
               LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await client.query(query, params);

    const countParams = offerStatus !== "all" ? [jobId, offerStatus] : [jobId];
    const countResult = await client.query(countQuery, countParams);

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
};

export const rateApplicant: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const applicantId = event.pathParameters?.applicantId;
  const { rating } = JSON.parse(event.body || "{}");

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    // Check if applicant has an offer - if so, prevent rating changes
    const applicationCheck = await client.query(
      "SELECT offer_status FROM applications WHERE job_id = $1 AND applicant_id = $2",
      [jobId, applicantId]
    );

    if (applicationCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    const offerStatus = applicationCheck.rows[0].offer_status;
    if (offerStatus && offerStatus !== "none") {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error:
            "Cannot change rating for an applicant who has been offered a job",
        }),
      };
    }

    const result = await client.query(
      "UPDATE applications SET rating = $1 WHERE job_id = $2 AND applicant_id = $3",
      [rating, jobId, applicantId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Rating updated" }),
    };
  } finally {
    await client.end();
  }
};

export const extendOffer: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const applicantId = event.pathParameters?.applicantId;

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const result = await client.query(
      "UPDATE applications SET offer_status = 'offered' WHERE job_id = $1 AND applicant_id = $2",
      [jobId, applicantId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Offer extended" }),
    };
  } finally {
    await client.end();
  }
};

export const rescindOffer: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const applicantId = event.pathParameters?.applicantId;

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    const result = await client.query(
      "UPDATE applications SET offer_status = 'rescinded' WHERE job_id = $1 AND applicant_id = $2",
      [jobId, applicantId]
    );

    if (result.rowCount === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Application not found" }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Offer rescinded" }),
    };
  } finally {
    await client.end();
  }
};

export const extendBulkOffers: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const jobId = event.pathParameters?.jobId;
  const { applicantIds } = JSON.parse(event.body || "{}");

  if (
    !applicantIds ||
    !Array.isArray(applicantIds) ||
    applicantIds.length === 0
  ) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: "applicantIds array is required" }),
    };
  }

  const client = await getDbClient();
  try {
    const jobCheck = await client.query(
      "SELECT id FROM jobs WHERE id = $1 AND company_id = $2",
      [jobId, user!.userId]
    );

    if (jobCheck.rows.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Job not found" }),
      };
    }

    // Verify all applicants belong to this job
    const placeholders = applicantIds.map((_, i) => `$${i + 2}`).join(", ");
    const verifyQuery = `
      SELECT applicant_id 
      FROM applications 
      WHERE job_id = $1 AND applicant_id IN (${placeholders})
    `;
    const verifyParams = [jobId, ...applicantIds];
    const verifyResult = await client.query(verifyQuery, verifyParams);

    if (verifyResult.rows.length !== applicantIds.length) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: "Some applicants do not belong to this job",
        }),
      };
    }

    // Update all applications in a single transaction
    const updatePlaceholders = applicantIds
      .map((_, i) => `$${i + 2}`)
      .join(", ");
    const updateQuery = `
      UPDATE applications 
      SET offer_status = 'offered' 
      WHERE job_id = $1 AND applicant_id IN (${updatePlaceholders})
    `;
    const updateParams = [jobId, ...applicantIds];
    await client.query(updateQuery, updateParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Offers extended to ${applicantIds.length} applicant(s)`,
        count: applicantIds.length,
      }),
    };
  } finally {
    await client.end();
  }
};

export const searchApplicants: APIGatewayProxyHandlerV2 = async (event) => {
  const [user, error] = verifyTokenAndRole(event, ["company"]);
  if (error) return UNAUTHORIZED;

  const search = event.queryStringParameters?.search;
  const skillsParam = event.queryStringParameters?.skills;
  const skills = skillsParam?.split(',').map(s => s.trim()).filter(Boolean) || [];
  const offset = parseInt(event.queryStringParameters?.offset || "0");
  const limit = parseInt(event.queryStringParameters?.limit || "20");

  const client = await getDbClient();
  try {
    let applicantsQuery = `
      SELECT
        u.id,
        u.name,
        u.email,
        u.created_at,
        COUNT(DISTINCT a.id) as application_count,
        ARRAY_AGG(DISTINCT s.skill) FILTER (WHERE s.skill IS NOT NULL) as skills
      FROM users u
      LEFT JOIN applications a ON u.id = a.applicant_id
      LEFT JOIN applicant_skills s ON u.id = s.applicant_id
      WHERE u.type = 'applicant'
    `;
    const params: any[] = [];
    let paramIndex = 1;

    if (search && search.trim()) {
      applicantsQuery += ` AND (u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex})`;
      params.push(`%${search.trim()}%`);
      paramIndex++;
    }

    if (skills.length > 0) {
      const skillConditions = skills.map((_, index) => {
        return `skill ILIKE $${paramIndex + index}`;
      }).join(' OR ');

      applicantsQuery += ` AND (
        SELECT COUNT(DISTINCT skill)
        FROM applicant_skills
        WHERE applicant_id = u.id
        AND (${skillConditions})
      ) = $${paramIndex + skills.length}`;

      skills.forEach(skill => {
        params.push(`%${skill}%`);
      });
      params.push(skills.length);
      paramIndex += skills.length + 1;
    }

    applicantsQuery += ` GROUP BY u.id, u.name, u.email, u.created_at
                        ORDER BY u.created_at DESC
                        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const applicantsResult = await client.query(applicantsQuery, params);

    let countQuery = `
      SELECT COUNT(DISTINCT u.id)
      FROM users u
      WHERE u.type = 'applicant'
    `;
    const countParams: any[] = [];
    let countParamIndex = 1;

    if (search && search.trim()) {
      countQuery += ` AND (u.name ILIKE $${countParamIndex} OR u.email ILIKE $${countParamIndex})`;
      countParams.push(`%${search.trim()}%`);
      countParamIndex++;
    }

    if (skills.length > 0) {
      const skillConditions = skills.map((_, index) => {
        return `skill ILIKE $${countParamIndex + index}`;
      }).join(' OR ');

      countQuery += ` AND (
        SELECT COUNT(DISTINCT skill)
        FROM applicant_skills
        WHERE applicant_id = u.id
        AND (${skillConditions})
      ) = $${countParamIndex + skills.length}`;

      skills.forEach(skill => {
        countParams.push(`%${skill}%`);
      });
      countParams.push(skills.length);
    }

    const countResult = await client.query(countQuery, countParams);

    return {
      statusCode: 200,
      body: JSON.stringify({
        applicants: applicantsResult.rows,
        total: parseInt(countResult.rows[0].count),
      }),
    };
  } finally {
    await client.end();
  }
};
