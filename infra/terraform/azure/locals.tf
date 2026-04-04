locals {
  data_mount_path = "/var/data/tripmind"

  resource_group_name     = var.create_resource_group ? azurerm_resource_group.this[0].name : data.azurerm_resource_group.existing[0].name
  resource_group_location = var.create_resource_group ? azurerm_resource_group.this[0].location : data.azurerm_resource_group.existing[0].location

  acr_login_server   = var.create_acr ? azurerm_container_registry.this[0].login_server : data.azurerm_container_registry.existing[0].login_server
  acr_admin_username = var.create_acr ? azurerm_container_registry.this[0].admin_username : data.azurerm_container_registry.existing[0].admin_username
  acr_admin_password = var.create_acr ? azurerm_container_registry.this[0].admin_password : data.azurerm_container_registry.existing[0].admin_password
}
