# Recruit.me

A modern, full-stack recruitment platform that connects companies with qualified applicants. Built with Next.js and AWS serverless infrastructure.

## 🌟 Features

### For Companies

- Create and manage job postings with skills requirements
- Set job status (draft, open, closed)
- View and rate applicants
- Extend job offers to candidates
- Manage offer statuses (offered, accepted, rejected)

### For Applicants

- Search and browse available job listings
- Apply to jobs matching your skills
- Manage your profile and skills
- View and respond to job offers
- Track application status

### For Admins

- View all companies, jobs, and applicants
- Access comprehensive platform analytics

## 🏗️ Architecture

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend

- **Platform**: AWS Serverless (SST)
- **API**: API Gateway V2
- **Compute**: AWS Lambda
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: JWT (JSON Web Tokens)
- **Network**: VPC with private subnets

## 📋 Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- AWS CLI configured with appropriate credentials
- AWS account with necessary permissions for:
  - Lambda
  - API Gateway
  - RDS
  - VPC
  - Secrets Manager

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Recruit.me
```

### 2. Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Configure AWS CLI (if not already done)
aws configure

# Set JWT secret
npx sst secret set JWTSecret $(openssl rand -hex 32)

# Deploy infrastructure
npm run dev  # For development
# or
npm run deploy  # For production
```

After deployment, note the API URL from the SST output. You'll need this for the frontend configuration.

### 3. Initialize Database Schema

After deploying the backend, call the setup endpoint to initialize the database schema:

```bash
curl -X POST <API_URL>/setup/schema
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment template
cp env.example .env.local

# Edit .env.local and add your API URL
# NEXT_PUBLIC_API_URL=<your-api-url-from-sst-output>

# Start development server
npm run dev
```

The frontend will be available at [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
Recruit.me/
├── backend/
│   ├── packages/
│   │   └── functions/      # Lambda function handlers
│   │       ├── admin.ts    # Admin endpoints
│   │       ├── applicant.ts # Applicant endpoints
│   │       ├── auth.ts     # Authentication endpoints
│   │       ├── company.ts  # Company endpoints
│   │       ├── db.ts       # Database utilities
│   │       ├── middleware.ts # Auth middleware
│   │       └── setup.ts    # Database setup
│   ├── tests/              # Unit tests
│   ├── schema.sql          # Database schema
│   └── sst.config.ts      # SST infrastructure config
│
└── frontend/
    ├── src/
    │   ├── app/            # Next.js app directory
    │   │   ├── actions/    # Server actions
    │   │   ├── dashboard/  # Dashboard pages
    │   │   └── login/      # Auth pages
    │   ├── schema/         # TypeScript schemas
    │   └── universal/      # Shared components
    └── public/             # Static assets
```

## 🔐 Authentication

The application uses JWT-based authentication:

- Users register/login through `/register` and `/login` endpoints
- JWT tokens are stored in HTTP-only cookies
- Protected routes require valid authentication
- User types: `applicant`, `company`, `admin`

## 🗄️ Database Schema

The application uses PostgreSQL with the following main tables:

- `users` - User accounts (applicants, companies, admins)
- `jobs` - Job postings
- `applications` - Job applications
- `applicant_skills` - Applicant skill tags
- `job_skills` - Required skills for jobs

See `backend/schema.sql` for the complete schema definition.

## 🧪 Testing

Run backend tests:

```bash
cd backend
npm test
```

## 📡 API Endpoints

### Authentication

- `POST /register` - Register new user
- `POST /login` - User login
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

## 🛠️ Development

### Backend Development

```bash
cd backend
npm run dev  # Starts SST dev mode with hot reload
```

### Frontend Development

```bash
cd frontend
npm run dev  # Starts Next.js dev server on port 3000
```

### Building for Production

**Frontend:**

```bash
cd frontend
npm run build
npm start
```

**Backend:**

```bash
cd backend
npm run deploy
```

## 🔧 Environment Variables

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### Backend (Managed by SST)

- `JWT_SECRET` - JWT signing secret (set via `sst secret set`)
- `DB_HOST` - RDS database host
- `DB_PORT` - RDS database port
- `DB_NAME` - Database name
- `DB_USER` - Database username
- `DB_PASSWORD` - Database password

## 📝 License

ISC

## 👥 Authors

- Liam Snow

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 Additional Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [SST Documentation](https://docs.sst.dev)
- [AWS Lambda Documentation](https://docs.aws.amazon.com/lambda)
- [PostgreSQL Documentation](https://www.postgresql.org/docs)
