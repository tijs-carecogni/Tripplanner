output "container_app_url" {
  description = "Public HTTPS URL for TripMind demo."
  value       = "https://${azurerm_container_app.this.latest_revision_fqdn}"
}

output "resource_group_name" {
  description = "Resource group used by this deployment."
  value       = azurerm_resource_group.this.name
}

output "storage_account_name" {
  description = "Storage account backing durable trip data."
  value       = azurerm_storage_account.this.name
}
