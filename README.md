# Educa React

Simple full-stack starter architecture for a school management system.

## Structure

```text
Educa-react/
|-- client/    # React app (UI, routes, pages, components)
|-- server/    # Express API + Prisma + MySQL/MariaDB
|-- package.json
`-- .gitignore
```

## Why This Structure

- `client/` stays focused on UI and user experience
- `server/` stays focused on business logic, authentication, and database work
- the root only contains helper scripts so the project is easy to understand

## Client Folders

```text
client/src/
|-- app/         # app shell and router
|-- components/  # shared and reusable UI blocks
|-- features/    # domain-specific UI logic
|-- layouts/     # page layouts
|-- lib/         # query client, http client, utilities
|-- pages/       # route pages
|-- providers/   # app-level providers
`-- styles/      # global styles
```

## Server Folders

```text
server/
|-- prisma/        # Prisma schema and migrations
|-- src/
|   |-- config/    # env and Prisma config
|   |-- middlewares/
|   |-- modules/   # feature-based API modules
|   |-- routes/
|   `-- utils/
```

## Next Steps

1. Install the dependencies.
2. Create `.env` files for `client/` and `server/`.
3. Configure the database in `server/.env`.
4. Run Prisma generate and create the first migration.
5. Start building the auth flow and dashboard UI.

