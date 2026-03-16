#!/usr/bin/env bash
set -euo pipefail

# Quick deploy for TripMind on Azure Container Apps.
# Requirements:
# - Azure CLI logged in (`az login`)
# - Azure CLI containerapp extension available

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

APP_NAME="${APP_NAME:-tripmind-demo}"
RESOURCE_GROUP="${RESOURCE_GROUP:-tripmind-demo-rg}"
LOCATION="${LOCATION:-westeurope}"
ENV_NAME="${ENV_NAME:-tripmind-demo-env}"

echo "Deploying TripMind to Azure Container Apps..."
echo "  APP_NAME=$APP_NAME"
echo "  RESOURCE_GROUP=$RESOURCE_GROUP"
echo "  LOCATION=$LOCATION"
echo "  ENV_NAME=$ENV_NAME"

if ! command -v az >/dev/null 2>&1; then
  echo "Azure CLI (az) is required." >&2
  exit 1
fi

if ! az account show >/dev/null 2>&1; then
  echo "Not logged in. Run: az login" >&2
  exit 1
fi

az extension add --name containerapp --upgrade >/dev/null

az group create \
  --name "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  >/dev/null

az containerapp up \
  --name "$APP_NAME" \
  --resource-group "$RESOURCE_GROUP" \
  --location "$LOCATION" \
  --environment "$ENV_NAME" \
  --source "$ROOT_DIR" \
  --ingress external \
  --target-port 8787 \
  --env-vars NODE_ENV=production

FQDN="$(az containerapp show --name "$APP_NAME" --resource-group "$RESOURCE_GROUP" --query properties.configuration.ingress.fqdn -o tsv)"
echo
echo "Deployed successfully."
echo "Open: https://$FQDN"
echo
echo "Note: this quick setup uses container local filesystem storage."
echo "For durable server-side trip storage across restarts, mount Azure Files and set TRIPMIND_DATA_DIR."
