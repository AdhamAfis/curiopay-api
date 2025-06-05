# Helm Deployment

> **⚠️ SECURITY WARNING**: This chart contains example credentials and placeholder values. NEVER deploy to production without replacing all default credentials and secrets with secure values. All database passwords, secrets, and other sensitive information must be changed before any production use.

The CurioPay API can be deployed using Helm charts, which provide a complete deployment solution including the PostgreSQL database and Prisma migrations.

## Prerequisites

- Kubernetes 1.19+
- Helm 3.2.0+
- PV provisioner support in the underlying infrastructure (for PostgreSQL persistence)

## Chart Installation

To install the chart with the release name `curiopay`:

```bash
# Add the Bitnami repo for PostgreSQL dependency
helm repo add bitnami https://charts.bitnami.com/bitnami

# Update dependencies
cd helm/curiopay-api
helm dependency update

# Install the chart
helm install curiopay ./helm/curiopay-api
```

## Uninstalling the Chart

To uninstall/delete the `curiopay` deployment:

```bash
helm uninstall curiopay
```

## Configuration Parameters

The following table lists the configurable parameters of the CurioPay API chart and their default values:

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

## PostgreSQL and Prisma Setup

This chart includes PostgreSQL deployment and Prisma migration jobs. The Prisma migration jobs run automatically after installation and upgrades to:

1. Apply database migrations using `prisma migrate deploy`
2. Generate the Prisma client using `prisma generate`

### Customizing Database Credentials

For production environments, you should override the default database credentials:

```bash
helm install curiopay ./helm/curiopay-api \
  --set postgresql.auth.username=myuser \
  --set postgresql.auth.password=mypassword \
  --set postgresql.auth.database=mydb
```

## Advanced Configuration

### External Database

To use an external PostgreSQL database instead of deploying one with the chart:

```bash
helm install curiopay ./helm/curiopay-api \
  --set postgresql.enabled=false \
  --set externalDatabase.host=mydb.example.com \
  --set externalDatabase.port=5432 \
  --set externalDatabase.user=myuser \
  --set externalDatabase.password=mypassword \
  --set externalDatabase.database=mydb
```

### Security Considerations

For production deployments:

1. Use Kubernetes Secrets for sensitive values instead of putting them in values.yaml
2. Enable TLS for the ingress
3. Consider using Sealed Secrets for GitOps deployments
