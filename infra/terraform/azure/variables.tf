variable "resource_group_name" {
  description = "Azure resource group name for TripMind demo."
  type        = string
}

variable "location" {
  description = "Azure region (for example westeurope)."
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

variable "acr_name" {
  description = "Name of the Azure Container Registry to pull images from."
  type        = string
}

variable "storage_account_name_prefix" {
  description = "Prefix used to generate a globally unique storage account name."
  type        = string
  default     = "tripmind"
}
