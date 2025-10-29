/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "recruit-me",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const jwtSecret = new sst.Secret("JWTSecret");

    const vpc = new sst.aws.Vpc("RecruitVpc");

    // make RDS DB
    const db = new sst.aws.Postgres("RecruitDB", {
      vpc,
      scaling: {
        min: "0.5 ACU",
        max: "1 ACU",
      },
    });

    // make API gateway
    const api = new sst.aws.ApiGatewayV2("RecruitApi");

    api.environment = {
      JWT_SECRET: jwtSecret.value,
      DB_HOST: db.host,
      DB_PORT: db.port,
      DB_NAME: db.database,
      DB_USER: db.username,
      DB_PASSWORD: db.password,
    };

    api.route("POST /login", "packages/functions/auth.login");
    api.route("POST /logout", "packages/functions/auth.logout");
    api.route("POST /register", "packages/functions/auth.register");

    api.route("GET /company/profile", "packages/functions/company.getProfile");
    api.route("PUT /company/profile", "packages/functions/company.updateProfile");
    api.route("POST /company/job", "packages/functions/company.createJob");
    api.route("GET /company/job/{jobId}", "packages/functions/company.getJob");
    api.route("POST /company/job/{jobId}/activate", "packages/functions/company.activateJob");
    api.route("POST /company/job/{jobId}/close", "packages/functions/company.closeJob");
    api.route("POST /company/job/{jobId}/reopen", "packages/functions/company.reopenJob");
    api.route("GET /company/job/{jobId}/applicants", "packages/functions/company.getApplicants");
    api.route("PUT /company/job/{jobId}/applicant/{applicantId}/rating", "packages/functions/company.rateApplicant");
    api.route("POST /company/job/{jobId}/applicant/{applicantId}/offer", "packages/functions/company.extendOffer");
    api.route("DELETE /company/job/{jobId}/applicant/{applicantId}/offer", "packages/functions/company.rescindOffer");

    api.route("GET /applicant/profile", "packages/functions/applicant.getProfile");
    api.route("PUT /applicant/profile", "packages/functions/applicant.updateProfile");
    api.route("GET /jobs/search", "packages/functions/applicant.searchJobs");
    api.route("POST /applicant/job/{jobId}/apply", "packages/functions/applicant.apply");
    api.route("DELETE /applicant/job/{jobId}/apply", "packages/functions/applicant.withdraw");
    api.route("POST /applicant/job/{jobId}/offer/accept", "packages/functions/applicant.acceptOffer");
    api.route("DELETE /applicant/job/{jobId}/offer/accept", "packages/functions/applicant.rescindAcceptance");
    api.route("POST /applicant/job/{jobId}/offer/reject", "packages/functions/applicant.rejectOffer");

    api.route("GET /admin/companies", "packages/functions/admin.getCompanies");
    api.route("GET /admin/jobs", "packages/functions/admin.getJobs");
    api.route("GET /admin/company/{companyId}/jobs", "packages/functions/admin.getCompanyJobs");
    api.route("GET /admin/applicants", "packages/functions/admin.getApplicants");

    return {
      api: api.url,
      database: {
        host: db.host,
        port: db.port,
        database: db.database,
      }
    };
  },
});
