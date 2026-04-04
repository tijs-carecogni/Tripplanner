variable "resource_group_name" {
  description = "Azure resource group name for TripMind (created if create_resource_group is true, otherwise must already exist)."
  type        = string
}

variable "create_resource_group" {
  description = "If true, Terraform creates the resource group. If false, use an existing group (e.g. wagenaarlabs_tripplanner_rg)."
  type        = bool
  default     = true
}

variable "location" {
  description = "Azure region (for example swedencentral, westeurope). Required when create_resource_group is true; ignored when using an existing RG."
  type        = string
  default     = "westeurope"
}

variable "container_app_name" {
  description = "Azure Container App name."
  type        = string
  default     = "tripmind-demo"
}

variable "container_environment_name" {
  description = "Container Apps environment name."
  type        = string
  default     = "tripmind-demo-env"
}

variable "container_image" {
  description = "Container image URL for the app (for example ghcr.io/org/repo:latest)."
  type        = string
}

variable "container_cpu" {
  description = "CPU cores allocated to the app container."
  type        = number
  default     = 0.5
}

variable "container_memory" {
  description = "Container memory allocation (for example 1Gi)."
  type        = string
  default     = "1Gi"
}

variable "ingress_target_port" {
  description = "Ingress port for the container (8787 for this app). Use 80 for a placeholder image like nginx on first apply, then set back to 8787 when using the real image."
  type        = number
  default     = 8787
}

variable "acr_name" {
  description = "Globally unique name of the Azure Container Registry (created if create_acr is true)."
  type        = string
}

variable "create_acr" {
  description = "If true, create the container registry in the same resource group as the app. If false, the registry must already exist."
  type        = bool
  default     = false
}

variable "acr_resource_group_name" {
  description = "Resource group containing an existing ACR when create_acr is false. Leave empty to use the same RG as the Container App."
  type        = string
  default     = ""
}

variable "acr_sku" {
  description = "SKU when create_acr is true (Basic, Standard, Premium)."
  type        = string
  default     = "Basic"
}

variable "storage_account_name_prefix" {
  description = "Prefix used to generate a globally unique storage account name."
  type        = string
  default     = "tripmind"
}
