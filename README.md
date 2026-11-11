# DevSecOps CI/CD Pipeline

A CI/CD pipeline built with GitHub Actions that automates build and testing and enforces security checks before every release. It combines container vulnerability scanning, static code analysis, and dependency scanning so issues are caught early in the delivery process.

## Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Pipeline Architecture](#pipeline-architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [GitHub Actions Workflow](#github-actions-workflow)
- [Security Checks](#security-checks)
- [Release Gating](#release-gating)
- [Troubleshooting](#troubleshooting)
- [Key Learnings](#key-learnings)

## Overview

This project shifts security left by integrating automated checks directly into the CI/CD workflow. Every push and pull request is built, tested, and scanned. Releases only proceed when the security gates pass.

## Features

- **GitHub Actions workflows** automating application build, testing, and security checks.
- **Trivy** for container image vulnerability scanning.
- **SonarQube** for code quality and static analysis.
- **OWASP Dependency-Check** for identifying vulnerable application dependencies.
- **Pre-release security gates** that run as part of the CI/CD workflow.

## Pipeline Architecture

```
 Push / Pull Request
        |
        v
   Checkout code
        |
        v
  Build and unit tests
        |
        +--> SonarQube (static analysis and quality gate)
        |
        +--> OWASP Dependency-Check (vulnerable dependencies)
        |
        v
  Build container image
        |
        v
  Trivy image scan
        |
        v
  Security gate (pass / fail)
        |
        v
  Push image and release
```

## Tech Stack

| Area | Tools |
|------|-------|
| CI/CD | GitHub Actions |
| Code quality and SAST | SonarQube |
| Dependency scanning | OWASP Dependency-Check |
| Container scanning | Trivy |
| Containerization | Docker |

## Project Structure

```
.
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # Main pipeline
├── src/                             # Application source code
├── tests/                           # Unit tests
├── Dockerfile
├── sonar-project.properties         # SonarQube configuration
└── README.md
```

> Adjust the layout above to match your repository.

## Prerequisites

- A GitHub repository with Actions enabled
- A running SonarQube server (self-hosted or SonarCloud)
- A container registry (Docker Hub, GHCR, or similar)

## Getting Started

### 1. Add repository secrets

Go to **Settings > Secrets and variables > Actions** and add:

| Secret | Purpose |
|--------|---------|
| `SONAR_TOKEN` | Authentication token for SonarQube |
| `SONAR_HOST_URL` | URL of the SonarQube server |
| `DOCKER_USERNAME` | Container registry username |
| `DOCKER_PASSWORD` | Container registry password or access token |

### 2. Configure SonarQube

Create a project in SonarQube and add a `sonar-project.properties` file:

```properties
sonar.projectKey=devsecops-pipeline
sonar.sources=src
sonar.tests=tests
```

### 3. Push to trigger the pipeline

```bash
git add .
git commit -m "Add DevSecOps pipeline"
git push origin main
```

## GitHub Actions Workflow

Example `.github/workflows/ci-cd.yml`:

```yaml
name: DevSecOps CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-and-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Build and test
        run: |
          # replace with your build and test commands
          echo "Build and test"

  sonarqube:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - name: SonarQube scan
        uses: SonarSource/sonarqube-scan-action@v5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}
      - name: Quality gate check
        uses: SonarSource/sonarqube-quality-gate-action@v1
        timeout-minutes: 5
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}

  dependency-check:
    runs-on: ubuntu-latest
    needs: build-and-test
    steps:
      - uses: actions/checkout@v4
      - name: OWASP Dependency-Check
        uses: dependency-check/Dependency-Check_Action@main
        with:
          project: devsecops-pipeline
          path: .
          format: HTML
          args: --failOnCVSS 7
      - name: Upload report
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: dependency-check-report
          path: reports

  image-scan-and-release:
    runs-on: ubuntu-latest
    needs: [sonarqube, dependency-check]
    steps:
      - uses: actions/checkout@v4
      - name: Build image
        run: docker build -t ${{ secrets.DOCKER_USERNAME }}/app:${{ github.sha }} .
      - name: Trivy image scan
        uses: aquasecurity/trivy-action@master
        with:
          image-ref: ${{ secrets.DOCKER_USERNAME }}/app:${{ github.sha }}
          format: table
          exit-code: 1
          severity: CRITICAL,HIGH
          ignore-unfixed: true
      - name: Log in to registry
        if: github.ref == 'refs/heads/main'
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKER_USERNAME }}
          password: ${{ secrets.DOCKER_PASSWORD }}
      - name: Push image
        if: github.ref == 'refs/heads/main'
        run: docker push ${{ secrets.DOCKER_USERNAME }}/app:${{ github.sha }}
```

> Pin action versions (or commit SHAs) in production instead of using `@master` or `@main`.

## Security Checks

### Trivy: container image scanning
Scans the built image for known vulnerabilities in OS packages and application libraries. The job fails on `CRITICAL` and `HIGH` findings.

### SonarQube: code quality and static analysis
Analyzes source code for bugs, code smells, security hotspots, and vulnerabilities. The pipeline waits for the quality gate result.

### OWASP Dependency-Check: dependency scanning
Compares project dependencies against the National Vulnerability Database (NVD) and fails the build when a vulnerability exceeds the configured CVSS threshold.

## Release Gating

Security checks run before any image is pushed or released:

1. Build and tests must pass.
2. SonarQube quality gate must pass.
3. Dependency-Check must find no vulnerabilities above the CVSS threshold.
4. Trivy must find no unresolved critical or high vulnerabilities.
5. Only then is the image pushed to the registry.

Enable **branch protection** on `main` and require these status checks so failing builds cannot be merged.

## Troubleshooting

| Issue | What to check |
|-------|---------------|
| SonarQube step fails to connect | `SONAR_HOST_URL` and `SONAR_TOKEN` secrets, server reachability from the runner |
| Quality gate times out | Server load and the `timeout-minutes` value |
| Dependency-Check is slow | First run downloads the NVD data; cache it or use an NVD API key |
| Trivy fails the build | Review the findings, update the base image or packages, or add a justified `.trivyignore` entry |
| Pipeline passes locally but fails in CI | Differences in environment, missing secrets, or runner permissions |

## Key Learnings

- Running security scans on every commit catches problems when they are cheapest to fix.
- Combining SAST, dependency scanning, and image scanning covers code, libraries, and runtime artifacts.
- Gating releases on security results prevents vulnerable builds from reaching production.
- Saving scan reports as artifacts makes findings easy to review and track.

## License

This project is licensed under the MIT License.
