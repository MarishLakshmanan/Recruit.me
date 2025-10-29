CREATE TABLE users (
    id CHAR(36) PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    salt VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    type ENUM('applicant', 'company', 'admin') NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE jobs (
    id CHAR(36) PRIMARY KEY,
    company_id CHAR(36) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    salary DECIMAL(10, 2),
    status ENUM('draft', 'open', 'closed') DEFAULT 'draft',
    post_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (company_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE applications (
    id CHAR(36) PRIMARY KEY,
    job_id CHAR(36) NOT NULL,
    applicant_id CHAR(36) NOT NULL,
    rating ENUM('hirable', 'wait', 'unacceptable', 'unrated') DEFAULT 'unrated',
    offer_status ENUM('none', 'offered', 'accepted', 'rejected') DEFAULT 'none',
    apply_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE,
    FOREIGN KEY (applicant_id) REFERENCES users(id) ON DELETE CASCADE,
    UNIQUE KEY unique_application (job_id, applicant_id)
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
