# Monitoring and Logging

The CurioPay API includes comprehensive monitoring and logging capabilities to ensure system health and facilitate troubleshooting.

## Logging

The application uses structured logging with different log levels based on the environment:

- **Development**: Logs include debug, info, warn, and error levels
- **Production**: Logs are limited to error and warn levels by default

```javascript
// From src/main.ts
const app =
  (await NestFactory.create) <
  NestExpressApplication >
  (AppModule,
  {
    logger: isProduction
      ? ['error', 'warn']
      : ['error', 'warn', 'log', 'debug'],
    bufferLogs: true,
  });
```

## Request Monitoring

The application includes rate limiting to protect against abuse:

```javascript
// From src/app.module.ts
ThrottlerModule.forRoot([
  {
    name: 'short',
    ttl: 60000, // 1 minute
    limit: 30, // 30 requests per minute for regular endpoints
  },
  {
    name: 'medium',
    ttl: 60000 * 15, // 15 minutes
    limit: 100, // 100 requests per 15 minutes for most endpoints
  },
  {
    name: 'long',
    ttl: 60000 * 60, // 1 hour
    limit: 1000, // 1000 requests per hour overall
  },
  {
    name: 'sensitive',
    ttl: 60000 * 15, // 15 minutes
    limit: 5, // 5 requests per 15 minutes for sensitive operations
  },
]),
```

## Audit Logging

The system includes audit logging to track sensitive operations:

```
AuditLog {
    string id PK
    string userId FK
    string action
    string category
    string ipAddress
    string userAgent
    string status
    json details
    datetime timestamp
    string logIntegrityHash
    boolean isCritical
}
```

## Kubernetes Monitoring

For Kubernetes deployments, the following monitoring resources are available:

### Liveness and Readiness Probes

The application includes properly configured liveness and readiness probes to ensure healthy pods:

- Liveness probe: Checks if the application is running
- Readiness probe: Checks if the application is ready to receive traffic

### Resource Monitoring

The application includes resource limits and requests:

```yaml
resources:
  limits:
    cpu: 500m
    memory: 512Mi
  requests:
    cpu: 100m
    memory: 256Mi
```

### Horizontal Pod Autoscaler

The application can be configured with HPA for automatic scaling:

```yaml
autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 10
  targetCPUUtilizationPercentage: 80
```

## Kubernetes Troubleshooting

If you encounter issues with the deployment:

1. Check pod status: `kubectl describe pod -l app=curiopay-api`
2. View logs: `kubectl logs -l app=curiopay-api`
3. Check events: `kubectl get events --sort-by='.lastTimestamp'`
4. Verify sealed secrets: `kubectl get sealedsecret -n curiopay-dev`
