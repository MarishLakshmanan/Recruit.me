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

