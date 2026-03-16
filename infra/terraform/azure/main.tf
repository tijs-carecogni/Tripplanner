locals {
  data_mount_path = "/var/data/tripmind"
}

resource "azurerm_resource_group" "this" {
  name     = var.resource_group_name
  location = var.location
}

resource "azurerm_log_analytics_workspace" "this" {
  name                = "${var.container_environment_name}-law"
  location            = azurerm_resource_group.this.location
  resource_group_name = azurerm_resource_group.this.name
  sku                 = "PerGB2018"
  retention_in_days   = 30
}

resource "azurerm_container_app_environment" "this" {
  name                       = var.container_environment_name
  location                   = azurerm_resource_group.this.location
  resource_group_name        = azurerm_resource_group.this.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.this.id
}

resource "random_string" "storage_suffix" {
  length  = 6
  special = false
  upper   = false
}

resource "azurerm_storage_account" "this" {
  name                     = substr(lower("${var.storage_account_name_prefix}${random_string.storage_suffix.result}"), 0, 24)
  resource_group_name      = azurerm_resource_group.this.name
  location                 = azurerm_resource_group.this.location
  account_tier             = "Standard"
  account_replication_type = "LRS"
  min_tls_version          = "TLS1_2"
}

resource "azurerm_storage_share" "tripmind_data" {
  name                 = "tripmind-data"
  storage_account_name = azurerm_storage_account.this.name
  quota                = 5
}

resource "azurerm_container_app_environment_storage" "tripmind_data" {
  name                         = "tripminddata"
  container_app_environment_id = azurerm_container_app_environment.this.id
  account_name                 = azurerm_storage_account.this.name
  access_key                   = azurerm_storage_account.this.primary_access_key
  share_name                   = azurerm_storage_share.tripmind_data.name
  access_mode                  = "ReadWrite"
}

resource "azurerm_container_app" "this" {
  name                         = var.container_app_name
  container_app_environment_id = azurerm_container_app_environment.this.id
  resource_group_name          = azurerm_resource_group.this.name
  revision_mode                = "Single"

  ingress {
    external_enabled = true
    target_port      = 8787
    transport        = "auto"
    traffic_weight {
      latest_revision = true
      percentage      = 100
    }
  }

  template {
    container {
      name   = "tripmind"
      image  = var.container_image
      cpu    = var.container_cpu
      memory = var.container_memory

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "PORT"
        value = "8787"
      }

      env {
        name  = "TRIPMIND_DATA_DIR"
        value = local.data_mount_path
      }

      volume_mounts {
        name = "tripminddata"
        path = local.data_mount_path
      }
    }

    min_replicas = 1
    max_replicas = 2

    volume {
      name         = "tripminddata"
      storage_name = azurerm_container_app_environment_storage.tripmind_data.name
      storage_type = "AzureFile"
    }
  }
}
