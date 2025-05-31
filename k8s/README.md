# Kubernetes Deployment for CurioPay API

This directory contains Kubernetes manifests for deploying the CurioPay API application to a Kubernetes cluster following GitOps practices.

## Structure

The deployment follows GitOps principles with a clear separation of configuration and secrets:

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
└── .gitignore              # Prevents committing sensitive files
```

## Prerequisites

- Kubernetes cluster (v1.19+)
- kubectl configured to communicate with your cluster
- Container registry with the application image
- Kustomize (included in kubectl 1.14+)
- Sealed Secrets controller installed in your cluster
- kubeseal CLI for encrypting secrets

## GitOps Secret Management

This project uses Bitnami Sealed Secrets for GitOps-friendly secret management:

1. **Install the Sealed Secrets Controller**:
   ```bash
   # Using Helm
   helm repo add sealed-secrets https://bitnami-labs.github.io/sealed-secrets
   helm install sealed-secrets sealed-secrets/sealed-secrets
   ```

2. **Install the kubeseal CLI**:
   ```bash
   # MacOS
   brew install kubeseal
   
   # Linux
   wget https://github.com/bitnami-labs/sealed-secrets/releases/download/v0.23.0/kubeseal-0.23.0-linux-amd64.tar.gz
   tar -xvzf kubeseal-0.23.0-linux-amd64.tar.gz
   sudo install -m 755 kubeseal /usr/local/bin/kubeseal
   ```

3. **Create a regular Kubernetes Secret**:
   ```bash
   # Create a temporary secret file (DO NOT COMMIT THIS)
   cat <<EOF > temp-secret.yaml
   apiVersion: v1
   kind: Secret
   metadata:
     name: curiopay-api-secrets
     namespace: curiopay-dev
   type: Opaque
   data:
     DATABASE_URL: $(echo -n "postgresql://user:password@db-host:5432/curiopay?schema=public" | base64)
     JWT_SECRET: $(echo -n "your-secure-jwt-secret-key" | base64)
     MAIL_HOST: $(echo -n "smtp.example.com" | base64)
     MAIL_USER: $(echo -n "notifications@curiopay.com" | base64)
     MAIL_PASSWORD: $(echo -n "email-password-here" | base64)
   EOF
   ```

4. **Seal the Secret**:
   ```bash
   # Encrypt the secret
   kubeseal --format yaml < temp-secret.yaml > k8s/overlays/dev/sealed-secrets.yaml
   
   # Delete the temporary secret file
   rm temp-secret.yaml
   ```

5. **Commit and Push the Sealed Secret**:
   ```bash
   # Now you can safely commit the sealed secret to your Git repository
   git add k8s/overlays/dev/sealed-secrets.yaml
   git commit -m "Add sealed secrets for dev environment"
   git push
   ```

## Deployment Instructions

### 1. Deploy using Kustomize and GitOps

```bash
# Deploy to development environment
kubectl apply -k ./k8s/overlays/dev

# Deploy to staging environment
kubectl apply -k ./k8s/overlays/staging

# Deploy to production environment
kubectl apply -k ./k8s/overlays/prod
```

### 2. For GitOps CI/CD (using FluxCD or ArgoCD)

Configure your GitOps tool to sync from this repository and apply the Kustomize overlays. Example ArgoCD Application:

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: curiopay-api-dev
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/yourusername/curiopay-api.git
    targetRevision: main
    path: k8s/overlays/dev
  destination:
    server: https://kubernetes.default.svc
    namespace: curiopay-dev
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

## Benefits of This GitOps Approach

1. **Secure Secret Management**: Secrets are encrypted and safe to store in Git
2. **Environment Separation**: Clear separation between environments
3. **Configuration as Code**: All configuration is versioned in Git
4. **Reproducibility**: Environments can be easily recreated
5. **Automation**: Works with CI/CD and GitOps tools like FluxCD or ArgoCD

## Troubleshooting

If you encounter issues:

1. Check pod status: `kubectl describe pod -l app=curiopay-api`
2. View logs: `kubectl logs -l app=curiopay-api`
3. Check events: `kubectl get events --sort-by='.lastTimestamp'`
4. Verify sealed secrets: `kubectl get sealedsecret -n curiopay-dev` 