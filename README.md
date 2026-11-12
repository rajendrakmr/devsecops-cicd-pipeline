# DevSecOps CI/CD Pipeline

A sample Node.js (Express) app with a GitHub Actions pipeline that runs security checks **before every release**.

## Pipeline flow

```
push / PR ──► Build & Test (Jest)
                 │
      ┌──────────┼───────────────┐
      ▼          ▼               ▼
  SonarQube   OWASP           Trivy
  (SAST +     Dependency-     (container
  quality     Check (SCA)     image scan)
  gate)
      └──────────┼───────────────┘
                 ▼
        Release (tag v*) ──► push image to GHCR
```

| Stage | Tool | What it catches | Fails build when |
|---|---|---|---|
| Build & Test | npm, Jest | Broken code, regressions | Any test fails |
| Code quality / SAST | SonarQube | Bugs, code smells, vulnerabilities, hotspots | Quality Gate fails |
| Dependency scan (SCA) | OWASP Dependency-Check | Known CVEs in npm packages | CVSS >= 7 |
| Image scan | Trivy | OS / library CVEs in Docker image | HIGH or CRITICAL found |
| Release | Docker + GHCR | - | Runs only if all gates above pass |

## Project structure

```
.
├── .github/workflows/devsecops.yml   # pipeline
├── src/app.js, server.js             # Express app (helmet, input sanitising)
├── tests/app.test.js                 # Jest + Supertest
├── Dockerfile                        # multi-stage, non-root user
├── sonar-project.properties
└── package.json
```

## Setup

docker volume create sonarqube_data
docker volume create sonarqube_extensions
docker volume create sonarqube_logs

docker run -d \
  --name sonarqube \
  -p 9000:9000 \
  -e SONAR_ES_BOOTSTRAP_CHECKS_DISABLE=true \
  -v sonarqube_data:/opt/sonarqube/data \
  -v sonarqube_extensions:/opt/sonarqube/extensions \
  -v sonarqube_logs:/opt/sonarqube/logs \
  sonarqube:community
1. Push this repo to GitHub.
2. Add repository secrets (Settings > Secrets and variables > Actions):
   - `SONAR_TOKEN`, `SONAR_HOST_URL` - from your SonarQube server or SonarCloud
   - `NVD_API_KEY` - free key from https://nvd.nist.gov/developers/request-an-api-key (speeds up Dependency-Check)
3. Push to `main` to run scans. Release by tagging:
   ```bash
   git tag v1.0.0 && git push origin v1.0.0
   ```

## Run locally

```bash
npm ci
npm test
npm start                      # http://localhost:3000/health
docker build -t devsecops-demo-app .
trivy image devsecops-demo-app # optional local scan
```

## Security practices demonstrated

- Shift-left scanning: SAST, SCA and image scanning on every push/PR
- Release is blocked unless every security job succeeds (`needs:` gate)
- Least-privilege workflow permissions (`contents: read`)
- Hardened container: multi-stage build, Alpine base, non-root user, healthcheck
- Hardened app: `helmet` headers, body size limit, input sanitisation

## Resume bullets

- Built GitHub Actions workflows to automate application build, testing and security checks.
- Integrated Trivy (container image scanning), SonarQube (static analysis) and OWASP Dependency-Check (vulnerable dependencies).
- Designed the pipeline so security checks must pass before every application release.
