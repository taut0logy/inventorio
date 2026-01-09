# Inventorio

A professional, schema-driven inventory management system built with Symfony and React.

---

## Table of Contents

- [Overview](#overview)
- [Technology Stack](#technology-stack)
- [Features](#features)
  - [Authentication](#authentication)
  - [Inventory Management](#inventory-management)
  - [Item Management](#item-management)
  - [Custom ID Generation](#custom-id-generation)
  - [Custom Fields](#custom-fields)
  - [Access Control](#access-control)
  - [Discussion System](#discussion-system)
  - [Search](#search)
  - [Admin Panel](#admin-panel)
  - [Internationalization and Theming](#internationalization-and-theming)
- [Architecture](#architecture)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Deployment](#deployment)

---

## Overview

Inventorio is a multi-user, web-based inventory management platform designed for creating and managing structured inventories with custom item identifiers and configurable fields. The system supports concurrent editing with optimistic locking, role-based access control, and full-text search capabilities.

Key differentiators:

- **Schema-Driven Design**: Inventories define their own structure including custom ID formats and field configurations.
- **Fixed Database Schema**: Custom fields map to predefined database columns, ensuring query performance and data integrity.
- **Concurrent Editing**: Optimistic locking prevents silent overwrites in multi-user scenarios.
- **Tables-First UI**: All data is presented in sortable, filterable tables with batch operations.

---

## Technology Stack

### Backend

| Component | Technology |
|-----------|------------|
| Language | PHP 8.2+ |
| Framework | Symfony 7.4 |
| ORM | Doctrine |
| Database | PostgreSQL 17 |
| Authentication | Symfony Security, OAuth2 |
| Queue | Symfony Messenger |

### Frontend

| Component | Technology |
|-----------|------------|
| Framework | React 18 |
| Build Tool | Webpack Encore |
| UI Components | Radix UI, shadcn/ui |
| Styling | Tailwind CSS 4 |
| State Management | React useState/useEffect |
| Forms | React Hook Form + Zod |
| Icons | Lucide React |

### Integration

| Component | Technology |
|-----------|------------|
| Symfony-React Bridge | Symfony UX React |
| Page Navigation | Hotwired Turbo |
| Interactivity | Hotwired Stimulus |

---

## Features

### Authentication

- **Social Login**: Google and Facebook OAuth integration via `knpuniversity/oauth2-client-bundle`.
- **Email/Password**: Traditional registration with email verification.
- **Password Reset**: Secure token-based password recovery flow.
- **Session Management**: Secure session handling with remember-me functionality.

### Inventory Management

- **Create/Edit Inventories**: Modal-based creation with title, description, category, and visibility settings.
- **Categories**: Predefined category system for organizing inventories (admin-managed).
- **Tags**: User-defined tags for flexible classification.
- **Visibility**: Public (anyone can view/add items) or Private (creator-controlled access).
- **Soft Delete**: Inventories can be deleted and restored from trash.
- **Optimistic Locking**: Version-based concurrency control prevents data loss during simultaneous edits.

### Item Management

- **Add/Edit Items**: Form-based item creation with custom field support.
- **Batch Operations**: Select multiple items for bulk delete operations.
- **Item Likes**: Users can like items; like counts are displayed per item.
- **Tags**: Items can be tagged independently of their parent inventory.
- **Soft Delete**: Items can be deleted and restored.

### Custom ID Generation

Each inventory defines its own item ID format using composable elements:

| Element Type | Description |
|--------------|-------------|
| Fixed Text | Static prefix/suffix (Unicode supported) |
| Random 20-bit | Random hexadecimal value |
| Random 32-bit | Random hexadecimal value |
| Random 6-digit | Random numeric value (000000-999999) |
| Random 9-digit | Random numeric value (000000000-999999999) |
| GUID | UUID v4 |
| Date | Current date in configurable format (YYYY, YYYYMMDD, YYYY-MM-DD) |
| Sequence | Auto-incrementing number with configurable padding |

- Elements are addable, removable, and reorderable via drag-and-drop.
- Live preview shows the generated ID format.
- Existing items retain their IDs when the format changes.

### Custom Fields

Inventories can define custom fields within fixed limits:

| Field Type | Maximum |
|------------|---------|
| Single-line Text | 3 |
| Multi-line Text | 3 |
| Numeric | 3 |
| URL/Link | 3 |
| Boolean | 3 |

Field configuration includes:

- Custom label and description (tooltip)
- Visibility toggle (show/hide in item table)
- Display order (drag-and-drop reordering)

All custom fields map to predefined database columns (`custom_string1_value`, `custom_number1_value`, etc.) for optimal query performance.

### Access Control

**User Roles:**

| Role | Capabilities |
|------|-------------|
| Guest | View public inventories and items, use search |
| Authenticated | Add items to public inventories, create own inventories |
| Creator | Full control over owned inventories |
| Admin | Full control over all resources, user management |

**Inventory-Level Permissions:**

- **Public**: Any authenticated user can add/edit items.
- **Private**: Creator explicitly grants access to specific users via email/name search.

Access control is enforced via Symfony Voters (`InventoryVoter`).

### Discussion System

- Per-inventory discussion threads.
- Linear, append-only message format.
- Real-time updates via polling (5-second interval).
- Displays author name, avatar, and timestamp.
- Markdown support for message content.

### Search

- **Full-Text Search**: Search across inventories, items, and tags.
- **Global Search**: Accessible from every page via the header.
- **Scoped Search**: Search within a specific inventory.
- **Results**: Displays inventories and items in separate result sections.

### Admin Panel

- **User Management**: View all users with search and pagination.
- **Role Management**: Promote/demote admin status (admins can demote themselves).
- **Block/Unblock**: Disable user accounts.
- **Delete Users**: Soft-delete user accounts.
- **Category Management**: CRUD operations for inventory categories.
- **Tag Management**: CRUD operations for predefined tags.

### Internationalization and Theming

- **Languages**: English and additional language support (configurable).
- **Themes**: Light and Dark mode with system preference detection.
- **User Preferences**: Theme and language saved per user account.

---

## Architecture

```
inventorio/
├── assets/
│   └── react/
│       ├── components/        # Reusable UI components
│       │   ├── inventory/     # Inventory-specific components
│       │   ├── layout/        # Header, Footer, Navigation
│       │   ├── search/        # Search components
│       │   └── ui/            # shadcn/ui base components
│       └── controllers/       # Page-level React components
├── config/                    # Symfony configuration
├── migrations/                # Doctrine migrations
├── public/                    # Web root
├── src/
│   ├── Controller/            # HTTP controllers
│   ├── Entity/                # Doctrine entities
│   ├── Repository/            # Database queries
│   └── Security/              # Voters, Authenticators
├── templates/                 # Twig templates
└── translations/              # i18n files
```

**Entity Relationships:**

```
User ──┬── creates ──> Inventory ──┬── contains ──> Item
       │                           │
       ├── sharedWith <── shared   ├── has ──> Tag
       │                           │
       └── likedBy <── likes ──────┴── has ──> Comment
```

---

## Installation

### Prerequisites

- PHP 8.2 or higher
- Composer
- Node.js 18+ and npm
- PostgreSQL 17+

### Steps

1. **Clone the repository:**

   ```bash
   git clone <repository-url>
   cd inventory-app
   ```

2. **Install PHP dependencies:**

   ```bash
   composer install
   ```

3. **Install JavaScript dependencies:**

   ```bash
   npm install
   ```

4. **Configure environment:**

   ```bash
   cp .env .env.local
   # Edit .env.local with your database and OAuth credentials
   ```

5. **Create database and run migrations:**

   ```bash
   php bin/console doctrine:database:create
   php bin/console doctrine:migrations:migrate
   ```

6. **Build frontend assets:**

   ```bash
   npm run build
   ```

7. **Start the development server:**

   ```bash
   symfony server:start
   ```

---

## Configuration

### Environment Variables

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret |
| `FACEBOOK_CLIENT_ID` | Facebook OAuth app ID |
| `FACEBOOK_CLIENT_SECRET` | Facebook OAuth app secret |
| `MAILER_DSN` | Email transport configuration |

### OAuth Setup

1. **Google**: Create credentials at [Google Cloud Console](https://console.cloud.google.com/).
2. **Facebook**: Create an app at [Facebook Developers](https://developers.facebook.com/).

Set redirect URIs to `https://your-domain.com/connect/google/check` and `https://your-domain.com/connect/facebook/check`.

---

## Development

### Running Locally

```bash
# Start PHP development server
symfony server:start

# Watch frontend assets
npm run watch
```

### Code Quality

```bash
# Run PHP tests
php bin/phpunit

# Clear cache
php bin/console cache:clear
```

---

## Deployment

### Server Requirements

- PHP 8.2+ with extensions: `pdo_pgsql`, `intl`, `mbstring`
- PostgreSQL 16+
- Nginx or Apache
- Supervisor (for background workers)

### Production Build

```bash
# Install dependencies without dev packages
composer install --no-dev --optimize-autoloader

# Build optimized frontend
npm run build

# Warm cache
php bin/console cache:warmup --env=prod
```

### Nginx Configuration

See `_server/nginx.conf` for a sample Nginx configuration.

### Supervisor Configuration

See `_server/supervisord.conf` for background worker management.

