# Fichaje SaaS - A Time Clocking SaaS Application

This is a comprehensive, multi-tenant SaaS application for employee time clocking, similar to SesameHR. It's built with a modern tech stack and a focus on security and scalability.

## Tech Stack

- **Frontend:** Next.js 14 (App Router) + TypeScript + TailwindCSS
- **UI Components:** shadcn/ui
- **Forms:** React Hook Form + Zod
- **Data Fetching:** TanStack Query (React Query)
- **Backend/API:** Next.js Route Handlers
- **Auth & Database:** Supabase (Auth, Postgres, RLS)
- **ORM:** Prisma
- **Testing:** Vitest (Unit), Playwright (E2E)
- **DevOps:** Docker, Docker Compose
- **CI/CD:** GitHub Actions

## Features (MVP)

- **Multi-tenancy:** Data is strictly isolated per organization using Supabase RLS.
- **Role-based Access Control:** Differentiated panels for Admins and Employees (`ORG_ADMIN`, `EMPLOYEE`).
- **Authentication:** Email/Password and Magic Link.
- **Admin Panel:** Employee management, Kiosk mode, Shift & Location management, Reporting.
- **Employee Panel:** Clock in/out, view history, request leave.
- **PWA Support:** Basic offline capabilities for clocking events.
- **Security:** Strict RLS policies, audit logs, and compliance features.

---

## 🚀 Getting Started

Follow these instructions to get the project up and running on your local machine for development and testing purposes.

### 1. Prerequisites

- [Node.js](https://nodejs.org/) (v20.x or later)
- [pnpm](https://pnpm.io/installation)
- [Docker](https://www.docker.com/get-started) and Docker Compose
- A [Supabase](https://supabase.com/) account

### 2. Supabase Project Setup

1.  **Create a new Supabase Project:**
    - Go to your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
    - Save your **Project URL**, **anon key**, and **service_role key**. You will need them later.

2.  **Set up the Database Schema:**
    - In the Supabase dashboard, navigate to the **SQL Editor**.
    - Create a new query.
    - Copy the entire content of `prisma/schema.prisma` and paste it into the query editor. **(Note: This is for reference. Prisma will handle the migration)**.
    - Instead of running the schema directly, you will use Prisma to push the schema. See step 4.

3.  **Apply Row Level Security (RLS) Policies:**
    - In the **SQL Editor**, create a new query.
    - Copy the entire content of `prisma/rls.sql` and paste it into the query editor.
    - Click **"Run"** to apply all the security policies. This is a critical step.

4.  **Create Demo Users in Supabase:**
    - Go to the **Authentication** section in your Supabase dashboard.
    - Create two users:
        - `admin@demo.com` with password `password123`
        - `employee1@demo.com` with password `password123`
    - After creating them, copy their `User UID` from the user list.

5.  **Configure Storage Buckets (if needed for photos/attachments):**
    - Go to the **Storage** section.
    - Create a bucket named `employee_photos`. Make it **private**.
    - Create a bucket named `leave_attachments`. Make it **private**.
    - You will need to set up Storage policies to allow access based on your RLS.

### 3. Local Environment Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/your-username/fichaje-saas.git
    cd fichaje-saas
    ```

2.  **Install dependencies:**
    ```bash
    pnpm install
    ```

3.  **Set up environment variables:**
    - Make a copy of the example environment file:
      ```bash
      cp .env.example .env
      ```
    - Open the `.env` file and fill in the required variables:
      - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL.
      - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key.
      - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service_role key.
      - `DATABASE_URL`: Your Supabase database connection string (find it in Database -> Connection string -> URI). **Important:** Use the one for migrations, which includes the password.
      - `DIRECT_URL`: You can use the same value as `DATABASE_URL` for now.
      - Generate secrets for `NEXTAUTH_SECRET` and `ENCRYPTION_KEY` using `openssl rand -base64 32`.

### 4. Database Migration

Push the Prisma schema to your Supabase database. This will create all the tables and columns.

```bash
pnpm db:push
```

### 6. Configure and Seed the Database (Optional)

To populate the database with dummy data for testing:

1.  **Open the seed script:** Open the file `prisma/seed.ts`.
2.  **Add User IDs:** Replace the placeholder strings `YOUR_ADMIN_USER_ID_FROM_SUPABASE` and `YOUR_EMPLOYEE_USER_ID_FROM_SUPABASE` with the User UIDs you copied in the previous step.
3.  **Run the seed command:**
    ```bash
    pnpm db:seed
    ```

### 7. Running the Application

You can run the app using Next.js dev server or Docker.

**Option A: Standard Dev Server**

```bash
pnpm dev
```

**Option B: Using Docker Compose**

```bash
docker-compose -f docker/docker-compose.yml up --build
```

The application will be available at [http://localhost:3000](http://localhost:3000).

---

## 🛠️ Available Scripts

- `pnpm dev`: Starts the development server.
- `pnpm build`: Builds the application for production.
- `pnpm start`: Starts a production server.
- `pnpm lint`: Lints the codebase.
- `pnpm test`: Runs unit tests with Vitest.
- `pnpm test:e2e`: Runs E2E tests with Playwright.
- `pnpm db:generate`: Generates the Prisma client.
- `pnpm db:push`: Pushes the schema to the database.
- `pnpm db:studio`: Opens the Prisma Studio to view/edit data.
- `pnpm db:seed`: Runs the database seed script.

---

## 🔐 Security and TODOs

- **RLS is enforced on all critical tables.** Do not use the `SUPABASE_SERVICE_ROLE_KEY` for regular application logic.
- **Rate Limiting:** Implement rate limiting on critical API endpoints (`/api/clock`, `/api/login`) to prevent abuse.
- **Input Validation:** All API routes must validate payloads using Zod.
- **Webhooks:** Webhook endpoints must be secured and verify signatures.
- **TODO:** Complete E2E test coverage.
- **TODO:** Implement full PWA offline synchronization logic.

---

## 🧑‍💻 Demo Users

*(To be filled in after seeding)*

- **Admin User:**
  - **Email:** `admin@demo.com`
  - **Password:** `password123`
- **Employee User:**
  - **Email:** `employee1@demo.com`
  - **Password:** `password123`
