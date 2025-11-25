# CS 509 Recruit.me - Team Virginia

This is a group project for CS 509 at Worcester Polytechnic Institute.

[Hosted URL](https://d1q738xp14oj8f.cloudfront.net)
[API URL](https://p1lmagd5i5.execute-api.us-east-1.amazonaws.com)

A recruitment platform that connects companies with qualified applicants.
Built with Next.js and AWS.

## Features

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

## Architecture

### Frontend

- **Framework**: Next.js 16 (App Router)
- **UI**: React 19, Tailwind CSS 4
- **Language**: TypeScript
- **Icons**: Lucide React

### Backend

- **Platform**: AWS via SST (infrastructure-as-code)
- **API**: API Gateway V2
- **Compute**: AWS Lambda
- **Database**: PostgreSQL (AWS RDS)
- **Authentication**: JWT (JSON Web Tokens)
- **Network**: VPC with private subnets

### Completed Use cases on Iteration 1

##### Company

- Register Company
- Edit Company Profile
- Create Job
- Activate Job
- Close Job

##### Applicant

- Register Account
- Edit Profile
- Search Job

### Completed Use cases on Iteration 2

##### Company

- Review Company Profile
- Review Applicant

##### Applicant

- Review Profile
- Apply to Job
- Withdraw from Job

##### Admin

- Report Companies
- Report Applicants
- Report Jobs for Company
