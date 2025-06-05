# Deployment Architecture

The CurioPay API is deployed using a containerized approach with Kubernetes as the orchestration platform. This document outlines the deployment architecture and infrastructure components.

## Deployment Overview

```mermaid
flowchart TB
    subgraph "Development Environment"
        GHA["GitHub Actions"]
        GHR["GitHub Repository"]
    end

    subgraph "Container Registry"
        CR["Container Images"]
    end

    subgraph "Kubernetes Cluster"
        subgraph "Production Namespace"
            API_PROD["API Pods"]
            DB_PROD["PostgreSQL"]
        end

        subgraph "Staging Namespace"
            API_STAGING["API Pods"]
            DB_STAGING["PostgreSQL"]
        end

        subgraph "Development Namespace"
            API_DEV["API Pods"]
            DB_DEV["PostgreSQL"]
        end

        ING["Ingress Controller"]
    end

    subgraph "External Services"
        SMTP["SMTP Server"]
        S3["Object Storage"]
    end

    GHR --> GHA
    GHA --> CR
    CR --> API_PROD
    CR --> API_STAGING
    CR --> API_DEV

    API_PROD --> DB_PROD
    API_STAGING --> DB_STAGING
    API_DEV --> DB_DEV

    API_PROD --> SMTP
    API_STAGING --> SMTP
    API_DEV --> SMTP

    API_PROD --> S3
    API_STAGING --> S3
    API_DEV --> S3

    ING --> API_PROD
    ING --> API_STAGING
    ING --> API_DEV
```

## Deployment Methods

CurioPay API supports two primary deployment methods:

### Kubernetes with Kustomize

Uses Kustomize for GitOps-friendly deployment with environment overlays:

```
k8s/
├── base/                   # Base configuration (common across environments)
│   ├── deployment.yaml     # Base deployment spec
│   ├── service.yaml        # Service definition
│   ├── configmap.yaml      # Non-sensitive configuration
│   ├── ingress.yaml        # Ingress rules
│   ├── hpa.yaml            # Horizontal Pod Autoscaler
│   └── kustomization.yaml  # Base kustomization file
├── overlays/               # Environment-specific configurations
│   ├── dev/                # Development environment
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── configmap-patch.yaml
│   │   └── sealed-secrets.yaml  # Encrypted secrets for dev
│   ├── staging/            # Staging environment
│   │   ├── kustomization.yaml
│   │   ├── deployment-patch.yaml
│   │   ├── configmap-patch.yaml
│   │   └── sealed-secrets.yaml  # Encrypted secrets for staging
│   └── prod/               # Production environment
│       ├── kustomization.yaml
│       ├── deployment-patch.yaml
│       ├── configmap-patch.yaml
│       └── sealed-secrets.yaml  # Encrypted secrets for production
```

### Helm Charts

Uses Helm for complete deployment including database and migrations:

```mermaid
flowchart TD
    subgraph "Helm Release"
        API["CurioPay API"]
        Migrations["Prisma Migrations"]
        PostgreSQL["PostgreSQL Database"]
    end

    subgraph "Kubernetes Resources"
        Deployment["API Deployment"]
        Service["API Service"]
        Ingress["Ingress"]
        ConfigMap["ConfigMap"]
        Secret["Secrets"]
        Job["Migration Job"]
        StatefulSet["PostgreSQL StatefulSet"]
        PVC["Persistent Volume Claim"]
    end

    API --> Deployment
    API --> Service
    API --> Ingress
    API --> ConfigMap
    API --> Secret

    Migrations --> Job
    PostgreSQL --> StatefulSet
    PostgreSQL --> PVC

    Job --> StatefulSet
```

## CI/CD Pipeline

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant GitHub as GitHub
    participant Actions as GitHub Actions
    participant Registry as Container Registry
    participant K8s as Kubernetes

    Dev->>GitHub: Push code
    GitHub->>Actions: Trigger workflow

    Actions->>Actions: Lint code
    Actions->>Actions: Run tests

    alt Tests failed
        Actions-->>GitHub: Update status (failed)
    else Tests passed
        Actions->>Actions: Build container image
        Actions->>Registry: Push container image
        Actions->>K8s: Deploy to dev environment

        alt Main branch
            Actions->>K8s: Deploy to staging

            alt Release tag
                Actions->>K8s: Deploy to production
            end
        end

        Actions-->>GitHub: Update status (success)
    end
```

## Secret Management

For secure GitOps workflows, the project uses Bitnami Sealed Secrets:

```mermaid
sequenceDiagram
    participant Dev as Developer
    participant Git as Git Repository
    participant K8s as Kubernetes Cluster
    participant Controller as Sealed Secrets Controller

    Dev->>Dev: Create plain Kubernetes Secret
    Dev->>Dev: Encrypt with kubeseal
    Dev->>Git: Commit & push SealedSecret
    Git->>K8s: CI/CD applies SealedSecret
    K8s->>Controller: Process SealedSecret
    Controller->>Controller: Decrypt using private key
    Controller->>K8s: Create actual Secret
    K8s->>K8s: Mount Secret to Pod
```

## Infrastructure Components

### Kubernetes Resources

```mermaid
flowchart TD
    subgraph "Kubernetes Namespace"
        Deploy["Deployment"]
        Svc["Service"]
        CM["ConfigMap"]
        Secret["Secrets"]
        HPA["HorizontalPodAutoscaler"]
        PDB["PodDisruptionBudget"]
    end

    subgraph "Ingress"
        IngCtrl["Ingress Controller"]
        IngRes["Ingress Resource"]
        Cert["TLS Certificate"]
    end

    subgraph "Database"
        StatefulSet["StatefulSet"]
        PVC["PersistentVolumeClaim"]
        PV["PersistentVolume"]
    end

    IngRes --> Svc
    Svc --> Deploy
    CM --> Deploy
    Secret --> Deploy
    HPA --> Deploy

    StatefulSet --> PVC
    PVC --> PV
```

## Scaling and Resilience

The application is designed for horizontal scaling and resilience:

- Horizontal Pod Autoscaler (HPA) adjusts the number of pods based on CPU/memory utilization
- Pod Disruption Budget (PDB) ensures high availability during maintenance
- Liveness and readiness probes monitor application health
- Request rate limiting protects against traffic spikes

> **⚠️ SECURITY WARNING**: Both deployment configurations contain example credentials. Always replace all default credentials and secrets before deploying to production.
