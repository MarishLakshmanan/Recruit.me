# Recruit.me Backend - Team Virginia

## Setup
1. Install AWS CLI
2. Go to IAM -> Users -> Your User -> Security Credentials tab -> Create Access Key
3. Use credentials to run `aws configure`
4. : 

```bash
npm install
npx sst secret set JWTSecret $(openssl rand -hex 32)
npm run deploy
```

## Development

Local:
```bash
npm run dev
```

Deploy Prod:
```bash
npm run deploy
```

Destroy Prod:
```bash
npm run remove
```

## API

### Authentication

- `POST /register` - Register new user
- `POST /login` - User login (JWT)
- `POST /logout` - User logout

### Company Endpoints

- `GET /company/profile` - Get company profile
- `PUT /company/profile` - Update company profile
- `POST /company/job` - Create job posting
- `GET /company/job/{jobId}` - Get job details
- `PUT /company/job/{jobId}` - Update job
- `POST /company/job/{jobId}/activate` - Activate job
- `POST /company/job/{jobId}/close` - Close job
- `POST /company/job/{jobId}/reopen` - Reopen job
- `GET /company/job/{jobId}/applicants` - Get applicants
- `PUT /company/job/{jobId}/applicant/{applicantId}/rating` - Rate applicant
- `POST /company/job/{jobId}/applicant/{applicantId}/offer` - Extend offer
- `DELETE /company/job/{jobId}/applicant/{applicantId}/offer` - Rescind offer

### Applicant Endpoints

- `GET /applicant/profile` - Get applicant profile
- `PUT /applicant/profile` - Update applicant profile
- `GET /jobs/search` - Search jobs
- `POST /applicant/job/{jobId}/apply` - Apply to job
- `DELETE /applicant/job/{jobId}/apply` - Withdraw application
- `POST /applicant/job/{jobId}/offer/accept` - Accept offer
- `DELETE /applicant/job/{jobId}/offer/accept` - Rescind acceptance
- `POST /applicant/job/{jobId}/offer/reject` - Reject offer

### Admin Endpoints

- `GET /admin/companies` - List all companies
- `GET /admin/jobs` - List all jobs
- `GET /admin/company/{companyId}/jobs` - Get company jobs
- `GET /admin/applicants` - List all applicants
