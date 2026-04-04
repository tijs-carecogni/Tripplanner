# TripMind Azure deploy with Terraform (no `az` CLI required)

This Terraform stack deploys:

- (Optional) Azure Resource Group — or use an **existing empty** group (`create_resource_group = false`)
- Log Analytics Workspace
- Azure Container Apps Environment
- Azure Storage Account + Azure File Share (durable trip state)
- (Optional) **Azure Container Registry** — set `create_acr = true`, or use an existing ACR
- Azure Container App for TripMind (public HTTPS ingress)

**GitHub Actions** (`.github/workflows/deploy.yml`) does **not** create these resources; it only builds an image and runs `az containerapp update`. If nothing exists yet, run Terraform (or `scripts/deploy_azure_containerapp.sh`) first.

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

Edit `terraform.tfvars`:

- **`create_resource_group`:** use `false` and set `resource_group_name` to an existing group (e.g. `wagenaarlabs_tripplanner_rg` in Sweden Central) if you already created the RG in the portal.
- **`create_acr`:** use `true` to create the registry in that RG, or `false` if ACR already exists (set `acr_name` and optionally `acr_resource_group_name`).
- **`container_image` / `ingress_target_port`:** the image must exist when the revision starts. **Bootstrap:** first `apply` with a tiny public image (e.g. `nginx:alpine`) and `ingress_target_port = 80`; then `docker build` + `docker push` to your new ACR; second `apply` with `container_image = "<acr>.azurecr.io/tripplanner:latest"` and `ingress_target_port = 8787`. Alternatively push to ACR before the first `apply` and use the real image and port `8787` immediately.

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
- To update the app, publish a new image tag and run `terraform apply` with updated `container_image`, or rely on CI after the Container App exists.
- After Terraform creates the app and ACR, set GitHub **Variables** `ACR_NAME`, `AZURE_RESOURCE_GROUP`, `AZURE_CONTAINER_APP` to match so pushes to `main` update the same app.
