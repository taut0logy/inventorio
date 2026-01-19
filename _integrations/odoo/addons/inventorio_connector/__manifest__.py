# -*- coding: utf-8 -*-
{
    "name": "Inventorio Connector",
    "version": "1.0.0",
    "summary": "Import inventory data from Inventorio web application",
    "description": """
        This module allows you to import and view inventory statistics
        from the Inventorio web application by using an API token.
        
        Features:
        - Store API tokens for external inventories
        - Sync inventory metadata and aggregated stats
        - View field definitions and statistics
    """,
    "category": "Inventory",
    "author": "Inventorio",
    "website": "https://inventorio.raufun-ahsan.online",
    "license": "LGPL-3",
    "depends": ["base"],
    "data": [
        "security/ir.model.access.csv",
        "views/external_inventory_views.xml",
    ],
    "installable": True,
    "application": True,
    "auto_install": False,
}
