import { APIGatewayProxyHandlerV2 } from "aws-lambda";
import { Client } from "pg";

// Just easier to have this function than publicly expose the RDS inst

export const runSchema: APIGatewayProxyHandlerV2 = async () => {
  const client = new Client({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "5432"),
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  });
  
  await client.connect();
  
  try {
    const schema = `
CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('applicant', 'company', 'admin')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id CHAR(36) PRIMARY KEY,
    company_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    salary DECIMAL(10, 2),
    status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'open', 'closed')),
    post_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id CHAR(36) PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    applicant_id CHAR(36) NOT NULL,
    rating VARCHAR(20) DEFAULT 'unrated' CHECK (rating IN ('hirable', 'wait', 'unacceptable', 'unrated')),
    offer_status VARCHAR(20) DEFAULT 'none' CHECK (offer_status IN ('none', 'offered', 'accepted', 'rejected')),
    apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE (job_id, applicant_id)
);

CREATE TABLE applicant_skills (
    applicant_id CHAR(36) NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (applicant_id, skill),
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE job_skills (
    job_id CHAR(36) NOT NULL,
    skill VARCHAR(100) NOT NULL,
    PRIMARY KEY (job_id, skill),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
    `;
    
    await client.query(schema);
    
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Schema created successfully" }),
    };
  } catch (error: any) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  } finally {
    await client.end();
  }
};
