# Deployment Environments

CurioPay API supports deployment to multiple environments using both Kubernetes and Helm. Each environment (development, staging, production) has its own configuration to ensure proper isolation and scaling.

## Environment Configuration

The CurioPay API uses environment-specific configuration through environment variables:

```bash
# Copy the example environment file
cp .env.example .env

# For production, ensure all secrets and keys are strong and stored securely
```

## Environment Types

### Development Environment

The development environment is designed for active development and testing:

- Detailed logging enabled
- Swagger documentation available
- Rate limiting set to permissive values
- Non-production database with sample data

### Staging Environment

The staging environment mirrors production for pre-deployment testing:

- Production-like configuration
- Isolated database
- Used for integration testing and final validation
- Performance testing and load testing

### Production Environment

The production environment is optimized for reliability and security:

- Minimal logging (errors and warnings only)
- No developer tools exposed
- Strict rate limiting
- High availability configuration
- Horizontal scaling enabled

## Kubernetes Deployment

The Kubernetes configuration follows GitOps principles with a clear separation of configuration and secrets:

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

## Helm Deployment

The Helm configuration provides a complete deployment solution including the database:

| Parameter                   | Description                       | Default             |
| --------------------------- | --------------------------------- | ------------------- |
| `replicaCount`              | Number of API replicas            | `2`                 |
| `image.repository`          | API image repository              | `curiopay/api`      |
| `image.tag`                 | API image tag                     | `latest`            |
| `image.pullPolicy`          | API image pull policy             | `Always`            |
| `service.type`              | Kubernetes service type           | `ClusterIP`         |
| `service.port`              | Kubernetes service port           | `80`                |
| `service.targetPort`        | Container port                    | `3000`              |
| `ingress.enabled`           | Enable ingress                    | `true`              |
| `ingress.hosts[0].host`     | Hostname for the ingress          | `api.curiopay.com`  |
| `resources.limits.cpu`      | CPU limit                         | `500m`              |
| `resources.limits.memory`   | Memory limit                      | `512Mi`             |
| `resources.requests.cpu`    | CPU request                       | `100m`              |
| `resources.requests.memory` | Memory request                    | `256Mi`             |
| `autoscaling.enabled`       | Enable autoscaling                | `true`              |
| `autoscaling.minReplicas`   | Minimum replicas                  | `2`                 |
| `autoscaling.maxReplicas`   | Maximum replicas                  | `10`                |
| `config.nodeEnv`            | Node environment                  | `production`        |
| `config.port`               | Application port                  | `3000`              |
| `config.apiPrefix`          | API prefix                        | `/api`              |
| `config.swaggerPath`        | Swagger documentation path        | `/docs`             |
| `config.logLevel`           | Log level                         | `info`              |
| `postgresql.enabled`        | Deploy PostgreSQL                 | `true`              |
| `postgresql.auth.username`  | PostgreSQL username               | `curiopay`          |
| `postgresql.auth.password`  | PostgreSQL password               | `curiopay-password` |
| `postgresql.auth.database`  | PostgreSQL database name          | `curiopay`          |
| `prisma.enabled`            | Enable Prisma migration job       | `true`              |
| `prisma.image.repository`   | Prisma migration image repository | `curiopay/api`      |
| `prisma.image.tag`          | Prisma migration image tag        | `latest`            |

## Secret Management

For production deployments, secrets should be managed securely:

- **Using Sealed Secrets**: For GitOps-friendly secret management
- **Using Kubernetes Secrets**: For non-GitOps deployments
- **External Secret Management**: For cloud-native approaches (AWS Secrets Manager, etc.)

> **⚠️ SECURITY WARNING**: Both deployment configurations contain example credentials. Always replace all default credentials and secrets before deploying to production.
