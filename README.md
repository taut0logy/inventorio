# Inventorio

![License](https://img.shields.io/badge/license-GPL%203.0-blue.svg)
![PHP](https://img.shields.io/badge/php-8.2%2B-777BB4.svg?logo=php&logoColor=white)
![Symfony](https://img.shields.io/badge/symfony-7.4-000000.svg?logo=symfony&logoColor=white)
![React](https://img.shields.io/badge/react-18.0-61DAFB.svg?logo=react&logoColor=black)
![TailwindCSS](https://img.shields.io/badge/tailwindcss-v4-38B2AC.svg?logo=tailwind-css&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-17-336791.svg?logo=postgresql&logoColor=white)

**Inventorio** is a next-generation, schema-driven inventory management platform designed for power users and teams. It combines the flexibility of a spreadsheet with the robustness of a relational database, wrapped in a modern, real-time reactive interface.

Unlike traditional inventory systems that force rigid structures, Inventorio empowers users to define their own data models per inventory, supported by strict validation, custom ID generation, and granular access controls.

---

## Key Differentiators

### Real-Time Collaboration
Powered by the **Mercure Protocol**, Inventorio keeps everyone in sync.
- **Live Activity Feed**: See who is editing, adding, or deleting items effectively instantly.
- **Collaborative Comments**: Discuss specific items in real-time threads.
- **Live Stats**: Like counts, view counters, and dashboard metrics update across all connected clients without page reloads.

### Flexible Data Schema
Every inventory is unique. Our custom field engine allows you to map your specific needs to optimized database columns:
- **Rich Text**: Markdown-supported descriptions.
- **Custom IDs**: Configurable generators (e.g., `INV-2024-001`, Random Hex, UUID).
- **Typed Fields**: Define up to 15 custom fields per inventory including:
    - **Scalars**: Text, Numbers, Booleans.
    - **Selects**: Dropdowns with validation ("One from list").
    - **Links**: URLs for documentation or external resources.
- **Strict Validation**: Enforce Regex patterns, numeric ranges, and required fields.

### Enterprise-Grade Security
- **Granular Permissions**: 
    - **Private**: Visible only to owner.
    - **Shared**: Specific read/write access for collaborators.
    - **Public**: Open to all (read-only for guests).
- **Audit Logging**: Every action is tracked in the Activity Feed.
- **Optimistic Locking**: Prevents data overwrites when multiple users edit the same item simultaneously.

---

## Technology Stack

### Backend
- **Framework**: Symfony 7.4 (PHP 8.2+)
- **Database**: PostgreSQL 17 (via Doctrine ORM)
- **Real-Time**: Mercure Hub (Server-Sent Events)
- **Authentication**: Symfony Security + OAuth2 (Google/Facebook)
- **Storage**: Cloudinary (for optimized image delivery)
- **Search**: PostgreSQL Full-Text Search (tsvector)

### Frontend
- **Core**: React 18
- **Build System**: Webpack Encore
- **Styling**: Tailwind CSS v4 (with Typography plugin)
- **Components**: Radix UI / shadcn/ui
- **Icons**: Lucide React
- **DnD**: @dnd-kit (for drag-and-drop reordering)

---

## Feature Showcase

### 1. The Inventory Engine
Create inventories that match your mental model.
- **Category System**: Organized categorization with theme-aware icons.
- **Tagging system**: Smart, auto-completing tags for easy filtering.
- **Visuals**: Upload cover images that are automatically optimized and served via CDN.

### 2. Advanced Item Management
- **Batch Operations**: Select multiple items to delete or modify.
- **Responsive Tables**: detailed data views that adapt to mobile and desktop.
- **Smart Filters**: Filter by any custom field value.
- **Auto-Save**: Never lose your work; forms save draft progress automatically.

### 3. Analytics & Visualization
- **Stats Dashboard**: breakdown of item counts, field completion rates, and numeric sums.
- **3D Tag Cloud**: Interactive, spherical visualization of your most used tags.
- **Charts**: Visual distribution of category data.

### 4. Custom ID Builder
A one-of-a-kind drag-and-drop builder to define exactly how your Item IDs look.
- Mix and match **Fixed Text**, **Sequences** (001, 002...), **Dates**, and **Random** hashes.
- Real-time preview of the ID format.
- Uniqueness enforced at the database level per inventory.

### 5. Internationalization (i18n)
Full support for global deployment.
- **Languages**: English (`en`) and Bengali (`bn`) supported out of the box.
- **Timezones**: Timestamps formatted to local user preference.

---

## Installation & Setup

### Prerequisites
- PHP 8.2 or higher
- Composer
- Node.js 18+ & npm
- PostgreSQL 17+
- Mercure Hub (or Symfony CLI for local dev)

### 1. Clone the Repository
```bash
git clone https://github.com/your-org/inventorio.git
cd inventorio
```

### 2. Install Dependencies
```bash
# Backend
composer install

# Frontend
npm install
```

### 3. Configure Environment
Create your local environment file:
```bash
cp .env.example .env.local
```

Update `.env.local` with your credentials:
```ini
# Database
DATABASE_URL="postgresql://db_user:db_pass@127.0.0.1:5432/inventorio?serverVersion=16&charset=utf8"

# Mercure (Real-time)
MERCURE_URL=http://127.0.0.1:8000/.well-known/mercure
MERCURE_PUBLIC_URL=http://127.0.0.1:8000/.well-known/mercure
MERCURE_JWT_SECRET="!ChangeThisSecretForProduction!"

# OAuth (Optional for local dev, needed for social login)
OAUTH_GOOGLE_ID=...
OAUTH_GOOGLE_SECRET=...
# nd other variables
```

### 4. Initialize Database
```bash
php bin/console doctrine:database:create
php bin/console doctrine:migrations:migrate
# Load application fixtures (Initial categories and tags)
php bin/console doctrine:fixtures:load --group=app

# (Optional) Load Demo Data - Usage: Users, Inventories, Items
php bin/console doctrine:fixtures:load --group=demo
```

### 5. Start Development Server
**Terminal 1 (Backend & Mercure):**
```bash
symfony server:start
```
*Note: The Symfony CLI includes a built-in Mercure hub.*

**Terminal 2 (Frontend Watcher):**
```bash
npm run watch
```

**Terminal 3 (Async Messenger Worker):**
```bash
php bin/console messenger:consume async -vv
```

## License

This project is licensed under the GPL-3.0 License.
