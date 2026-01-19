# -*- coding: utf-8 -*-
from odoo import models, fields, api
import requests
import json
from datetime import datetime


class ExternalInventory(models.Model):
    _name = "external.inventory"
    _description = "External Inventory from Inventorio"
    _order = "sync_date desc, id desc"

    name = fields.Char(string="Inventory Title", default="New Inventory (Pending Sync)")
    api_token = fields.Char(string="API Token", required=True)
    api_url = fields.Char(
        string="API URL",
        required=True,
        help="The full URL to the Inventorio API endpoint",
    )

    # Metadata from Inventorio
    description = fields.Text(string="Description", readonly=True)
    owner = fields.Char(string="Owner", readonly=True)
    category = fields.Char(string="Category", readonly=True)
    is_public = fields.Boolean(string="Is Public", readonly=True)
    total_items = fields.Integer(string="Total Items", readonly=True)

    # Stats
    view_count = fields.Integer(string="View Count", readonly=True)
    like_count = fields.Integer(string="Like Count", readonly=True)
    total_value = fields.Float(string="Total Value", readonly=True)
    average_value = fields.Float(string="Average Value", readonly=True)
    min_value = fields.Float(string="Min Value", readonly=True)
    max_value = fields.Float(string="Max Value", readonly=True)

    # Raw data storage
    fields_json = fields.Text(string="Fields (JSON)", readonly=True)
    stats_json = fields.Text(string="Stats (JSON)", readonly=True)
    raw_response = fields.Text(string="Raw API Response", readonly=True)

    # Sync metadata
    sync_date = fields.Datetime(string="Last Synced", readonly=True)
    sync_status = fields.Selection(
        [
            ("pending", "Pending"),
            ("success", "Success"),
            ("error", "Error"),
        ],
        string="Sync Status",
        default="pending",
        readonly=True,
    )
    sync_error = fields.Text(string="Sync Error", readonly=True)

    # Computed fields for display
    fields_display = fields.Html(
        string="Field Definitions", compute="_compute_fields_display"
    )
    stats_display = fields.Html(
        string="Statistics Summary", compute="_compute_stats_display"
    )

    @api.depends("fields_json")
    def _compute_fields_display(self):
        for record in self:
            if record.fields_json:
                try:
                    fields_data = json.loads(record.fields_json)
                    html_parts = [
                        '<table class="table table-sm"><thead><tr><th>Field</th><th>Type</th><th>Required</th></tr></thead><tbody>'
                    ]
                    for f in fields_data:
                        required = "✓" if f.get("required") else ""
                        html_parts.append(
                            f"<tr><td>{f.get('name', 'N/A')}</td><td>{f.get('type', 'N/A')}</td><td>{required}</td></tr>"
                        )
                    html_parts.append("</tbody></table>")
                    record.fields_display = "".join(html_parts)
                except:
                    record.fields_display = "<p>Unable to parse fields</p>"
            else:
                record.fields_display = "<p>No fields data</p>"

    @api.depends("stats_json")
    def _compute_stats_display(self):
        for record in self:
            if record.stats_json:
                try:
                    stats = json.loads(record.stats_json)
                    html_parts = ['<div class="stats-container">']

                    # Field-level stats
                    field_stats = stats.get("fieldStats", [])
                    for fs in field_stats:
                        html_parts.append(f"<h5>{fs.get('name', 'Field')}</h5>")
                        if fs.get("type") in ["integer", "number"]:
                            html_parts.append(
                                f"<p>Min: {fs.get('min', 'N/A')} | Max: {fs.get('max', 'N/A')} | Avg: {fs.get('average', 'N/A')} | Sum: {fs.get('sum', 'N/A')}</p>"
                            )
                        elif "mostPopular" in fs:
                            html_parts.append(
                                f"<p>Most Popular: {', '.join(fs.get('mostPopular', []))}</p>"
                            )
                        elif "trueCount" in fs:
                            html_parts.append(
                                f"<p>True: {fs.get('trueCount', 0)} | False: {fs.get('falseCount', 0)}</p>"
                            )

                    html_parts.append("</div>")
                    record.stats_display = "".join(html_parts)
                except:
                    record.stats_display = "<p>Unable to parse stats</p>"
            else:
                record.stats_display = "<p>No stats data</p>"

    def action_sync_data(self):
        """Fetch data from Inventorio API and update the record."""
        for record in self:
            try:
                # Build the API URL
                url = record.api_url
                if not url.startswith("http"):
                    url = f"https://{url}"

                # If user only provided the token, construct the full URL
                if "/api/external/inventory/" not in url:
                    url = (
                        url.rstrip("/") + "/api/external/inventory/" + record.api_token
                    )

                # Make the request
                response = requests.get(url, timeout=30)
                response.raise_for_status()
                data = response.json()

                # Check for error response
                if "error" in data:
                    raise Exception(data["error"])

                # Update record fields
                record.write(
                    {
                        "name": data.get("title", "Unnamed Inventory"),
                        "description": data.get("description", ""),
                        "owner": data.get("owner", ""),
                        "category": data.get("category", ""),
                        "is_public": data.get("isPublic", False),
                        "total_items": data.get("totalItems", 0),
                        "view_count": data.get("stats", {}).get("viewCount", 0),
                        "like_count": data.get("stats", {}).get("likeCount", 0),
                        "total_value": data.get("stats", {}).get("totalValue", 0),
                        "average_value": data.get("stats", {}).get("averageValue", 0),
                        "min_value": data.get("stats", {}).get("minValue") or 0,
                        "max_value": data.get("stats", {}).get("maxValue") or 0,
                        "fields_json": json.dumps(data.get("fields", [])),
                        "stats_json": json.dumps(data.get("stats", {})),
                        "raw_response": json.dumps(data, indent=2),
                        "sync_date": datetime.now(),
                        "sync_status": "success",
                        "sync_error": False,
                    }
                )

            except requests.exceptions.RequestException as e:
                record.write(
                    {
                        "sync_date": datetime.now(),
                        "sync_status": "error",
                        "sync_error": f"Connection error: {str(e)}",
                    }
                )
            except Exception as e:
                record.write(
                    {
                        "sync_date": datetime.now(),
                        "sync_status": "error",
                        "sync_error": str(e),
                    }
                )

        return True

    @api.model_create_multi
    def create(self, vals_list):
        """Override create to set a default name if not provided."""
        for vals in vals_list:
            if not vals.get("name"):
                vals["name"] = "New Inventory (Pending Sync)"
        records = super().create(vals_list)
        return records
