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

    const cfg = {
      link: [db],
      vpc: {
        securityGroups: vpc.securityGroups,
        privateSubnets: vpc.privateSubnets,
      },
      environment: {
        JWT_SECRET: jwtSecret.value,
        DB_HOST: db.host,
        DB_PORT: db.port,
        DB_NAME: db.database,
        DB_USER: db.username,
        DB_PASSWORD: db.password,
      },
    };

    api.route("POST /setup/schema", { handler: "packages/functions/setup.runSchema", ...cfg });

    api.route("POST /login", { handler: "packages/functions/auth.login", ...cfg });
    api.route("POST /logout", { handler: "packages/functions/auth.logout", ...cfg });
    api.route("POST /register", { handler: "packages/functions/auth.register", ...cfg });

    api.route("GET /company/profile", { handler: "packages/functions/company.getProfile", ...cfg });
    api.route("PUT /company/profile", { handler: "packages/functions/company.updateProfile", ...cfg });
    api.route("POST /company/job", { handler: "packages/functions/company.createJob", ...cfg });
    api.route("GET /company/job/{jobId}", { handler: "packages/functions/company.getJob", ...cfg });
    api.route("POST /company/job/{jobId}/activate", { handler: "packages/functions/company.activateJob", ...cfg });
    api.route("POST /company/job/{jobId}/close", { handler: "packages/functions/company.closeJob", ...cfg });
    api.route("POST /company/job/{jobId}/reopen", { handler: "packages/functions/company.reopenJob", ...cfg });
    api.route("GET /company/job/{jobId}/applicants", { handler: "packages/functions/company.getApplicants", ...cfg });
    api.route("PUT /company/job/{jobId}/applicant/{applicantId}/rating", { handler: "packages/functions/company.rateApplicant", ...cfg });
    api.route("POST /company/job/{jobId}/applicant/{applicantId}/offer", { handler: "packages/functions/company.extendOffer", ...cfg });
    api.route("DELETE /company/job/{jobId}/applicant/{applicantId}/offer", { handler: "packages/functions/company.rescindOffer", ...cfg });

    api.route("GET /applicant/profile", { handler: "packages/functions/applicant.getProfile", ...cfg });
    api.route("PUT /applicant/profile", { handler: "packages/functions/applicant.updateProfile", ...cfg });
    api.route("GET /jobs/search", { handler: "packages/functions/applicant.searchJobs", ...cfg });
    api.route("POST /applicant/job/{jobId}/apply", { handler: "packages/functions/applicant.apply", ...cfg });
    api.route("DELETE /applicant/job/{jobId}/apply", { handler: "packages/functions/applicant.withdraw", ...cfg });
    api.route("POST /applicant/job/{jobId}/offer/accept", { handler: "packages/functions/applicant.acceptOffer", ...cfg });
    api.route("DELETE /applicant/job/{jobId}/offer/accept", { handler: "packages/functions/applicant.rescindAcceptance", ...cfg });
    api.route("POST /applicant/job/{jobId}/offer/reject", { handler: "packages/functions/applicant.rejectOffer", ...cfg });

    api.route("GET /admin/companies", { handler: "packages/functions/admin.getCompanies", ...cfg });
    api.route("GET /admin/jobs", { handler: "packages/functions/admin.getJobs", ...cfg });
    api.route("GET /admin/company/{companyId}/jobs", { handler: "packages/functions/admin.getCompanyJobs", ...cfg });
    api.route("GET /admin/applicants", { handler: "packages/functions/admin.getApplicants", ...cfg });

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
