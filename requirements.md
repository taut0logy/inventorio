# 1. Project Overview (What You Are Building)

You must implement a **web-based inventory management system** where:

* Users create **inventories** (templates / registries)
* Other users create **items** inside inventories using the defined structure
* The system supports:

  * **Custom inventory item IDs**
  * **Custom fields**
  * **Role-based access**
  * **Optimistic locking**
  * **Full-text search**
  * **Real-time-ish discussion updates**
  * **Tables-first UI**

This is **not** a CRUD demo. It is a **schema-driven, multi-user, concurrent system**.

---

# 2. Mandatory Technology Stack

You **must** use:

### Backend

* **PHP**
* **Symfony**
* **ORM** (Doctrine is implied, but any ORM is acceptable)

### Database

* **MySQL or PostgreSQL**
* Relational schema only
* No schema changes at runtime

### Frontend

* Any CSS framework (**Bootstrap recommended**)
* JavaScript is allowed and expected
* Use **ready-made UI components** where possible

### Authentication

* Social login via **at least two providers**

  * Google + Facebook recommended

### Search

* **Full-text search**

  * Either database-native (e.g., PostgreSQL `tsvector`)
  * Or external engine/library

---

# 3. Core Domain Model

## 3.1 Inventories

An **inventory** is a template that defines:

* Metadata
* Access rules
* Custom ID format
* Custom fields
* Items

### Inventory Properties

Mandatory:

* `id` (internal, PK, never shown)
* `title`
* `description` (Markdown-supported)
* `creator_id`
* `category_id` (from predefined DB list)
* `image_url` (cloud only)
* `is_public`
* `version` (for optimistic locking)

Optional / configuration:

* Tags
* Access list
* Custom ID definition
* Custom fields definition

---

## 3.2 Items

An **item** is an instance inside an inventory.

Properties:

* Internal `id` (PK)
* `inventory_id`
* `custom_id` (inventory-scoped, editable)
* Fixed system fields:

  * `created_at`
  * `created_by`
* Custom fields (mapped to fixed DB columns)
* `version` (optimistic locking)

### Important

* `custom_id`:

  * NOT the primary key
  * Unique **only within the same inventory**
  * Enforced by a **composite unique index**

    ```
    UNIQUE (inventory_id, custom_id)
    ```

---

# 4. Custom Inventory Numbers (Killer Feature #1)

Each inventory defines **its own ID format**, composed of ordered elements.

## Supported ID Elements

* Fixed text (Unicode allowed, emojis allowed)
* Random:

  * 20-bit
  * 32-bit
  * 6-digit
  * 9-digit
* GUID
* Date/time (creation time)
* Sequence (max existing + 1)

## Rules

* Elements are:

  * Addable
  * Removable
  * Reorderable via drag & drop
* Formatting options:

  * Leading zeros
  * Hex/decimal
  * Date formats (`yyyy`, etc.)
* Max recommended elements: **≥ 10**
* **Live preview** must be shown
* IDs are generated **on item creation**
* If format changes:

  * Existing items keep old IDs
  * Editing enforces new format

## Conflict Handling

* DB rejects duplicates
* User must manually resolve conflicts

---

# 5. Custom Fields (Killer Feature #2)

Inventories can define **custom fields**, but **within fixed limits**.

## Field Types & Limits

| Type                | Max |
| ------------------- | --- |
| Single-line text    | 3   |
| Multi-line text     | 3   |
| Numeric             | 3   |
| Document/image link | 3   |
| Boolean             | 3   |

## Field Attributes

Each field has:

* Title
* Description (tooltip/hint)
* Visibility flag (shown in item table or not)
* Order (drag & drop)

## Database Rule (CRITICAL)

* **NO JSON storage**
* **NO dynamic tables**
* Fields must map to **predefined DB columns**, e.g.:

```sql
custom_string1_value
custom_string2_value
custom_int1_value
custom_bool1_value
```

The inventory controls:

* Whether field exists
* What name it has
* Whether it’s shown

---

# 6. UI & UX Requirements

## 6.1 Tables Are Mandatory

* Inventories → table
* Items → table
* Default view = table
* Other views optional but **cannot replace tables**

### ❌ Forbidden

* Buttons inside table rows (Edit/Delete/View per row)

### ✅ Allowed

* Toolbars
* Context menus
* Selection-based actions
* Hover/animated actions

---

## 6.2 Pages

### Global Header (Every Page)

* Full-text search
* Login/logout
* Language switch
* Theme switch

---

### Home Page

* Latest inventories (table)
* Top 5 popular inventories (table)
* Tag cloud (clickable → search results)

---

### Inventory Page (Tabbed)

1. Items table
2. Discussion
3. Settings (auto-save)
4. Custom ID editor
5. Access management
6. Fields editor
7. Statistics (read-only)

---

### Item Page

* View/Edit mode
* Custom ID editable
* Likes
* Optimistic locking

---

### Personal Page

Two sortable/filterable tables:

* Owned inventories
* Inventories with write access

---

### Admin Page

* User list
* Block/unblock
* Delete
* Add/remove admin role
* **Admin can demote themselves**

---

# 7. Access Control & Roles

## User States

### Non-authenticated

* View inventories & items
* Use search
* Read-only

### Authenticated

* Everything above
* Can add items to public inventories

### Creator

* Full control of their inventories

### Admin

* Full control of **everything**
* Acts as owner everywhere

---

## Inventory Access Rules

* Public inventory:

  * Any authenticated user can add/edit items
* Private inventory:

  * Creator selects users
  * Autocomplete by name/email
  * Sortable access list

---

# 8. Optimistic Locking (MANDATORY)

Applies to:

* Inventories
* Items

## Implementation

* Use a `version` field (int, timestamp, or GUID)
* On update/delete:

  ```
  WHERE id = ? AND version = ?
  ```
* If no rows affected:

  * Conflict detected
  * UI must prompt reload/retry

## Required UX Behavior

* No silent overwrites
* User-friendly conflict messages
* Auto-save respects locking

---

# 9. Auto-Save Rules

* Inventory settings only
* Save every **7–10 seconds**
* Track changes
* Update version after each save
* Fail gracefully on conflicts

---

# 10. Discussion System

* Per-inventory
* Linear posts (append-only)
* Markdown supported
* Shows:

  * User name (link)
  * Timestamp
* Updates appear within **2–5 seconds** for all viewers

---

# 11. Likes System

* Per item
* One like per user per item
* Enforced at DB level

---

# 12. Search

* Full-text search
* Accessible from any page
* Covers:

  * Inventories
  * Items
  * Tags
  * Possibly descriptions

---

# 13. Internationalization & Theming

* **2 UI languages**

  * User choice saved
  * UI only (not user content)
* **2 themes**

  * Light / Dark
  * Saved per user

---

# 14. Forbidden Patterns (Instant Penalties)

❌ Buttons inside table rows
❌ JSON for item storage
❌ Dynamic table creation
❌ Full DB scans
❌ Queries inside loops
❌ Image upload to server/DB
❌ Copy-pasting existing projects

---

# 15. Optional Features (Only After Core Works)

* Document previews
* Email/password auth with confirmation
* Field validators
* Enum fields
* Unlimited fields
* CSV/Excel export

---

# 16. Grading Philosophy (VERY IMPORTANT)

* **Understanding > Feature count**
* You must:

  * Defend every design decision
  * Modify code live if asked
  * Explain optimistic locking clearly
* Use libraries, not copied code
* Always keep a deployable version

---

## Final Summary in One Sentence

This project is a **multi-user, schema-driven inventory platform** with **custom IDs, fixed-schema custom fields, strict UI rules, concurrent editing safeguards, and role-based access**, implemented in **PHP + Symfony + ORM**, emphasizing **correct data modeling and real-world concurrency handling** over feature quantity.
