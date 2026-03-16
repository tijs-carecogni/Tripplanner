# TripMind Azure deploy with Terraform (no `az` CLI required)

This Terraform stack deploys:

- Azure Resource Group
- Log Analytics Workspace
- Azure Container Apps Environment
- Azure Storage Account + Azure File Share (durable trip state)
- Azure Container App for TripMind (public HTTPS ingress)

## 1) Prerequisites

- Terraform `>= 1.6`
- Azure credentials via environment variables (Service Principal or OIDC):
  - `ARM_SUBSCRIPTION_ID`
  - `ARM_TENANT_ID`
  - `ARM_CLIENT_ID`
  - `ARM_CLIENT_SECRET` (for SP secret auth)

No Azure CLI is required for Terraform apply.

## 2) Provide variables

```bash
cd infra/terraform/azure
cp terraform.tfvars.example terraform.tfvars
```

Set `container_image` to a published image (for example on GHCR).

## 3) Deploy

```bash
terraform init
terraform plan
terraform apply
```

After apply:

```bash
terraform output container_app_url
```

Open the URL to access the live demo.

## Notes

- The app writes server-side trip state to Azure Files mounted at `/var/data/tripmind`.
- To update the app, publish a new image tag and run `terraform apply` with updated `container_image`.
