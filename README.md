# newbackend

A CLI scaffolder that generates a production-oriented **Express + TypeScript + Prisma 7 + PostgreSQL** backend foundation. It automates repetitive setup — dependencies, tooling, architecture, security middleware — and leaves all application-specific logic (models, controllers, business rules) to you.

## What this is (and isn't)

`newbackend` gives you a **starting foundation**, not a framework and not a finished application. It installs a sensible, opinionated stack and wires up the boring parts correctly. It does not generate business logic, models, authentication, or any feature code — that's your job.

It is **production-oriented**, not "production-ready" out of the box. Security middleware (Helmet, CORS, body limits) is configured, but you still need to review configuration, add authentication, write your schema, and test thoroughly before deploying anything it generates.

## Requirements

- Node.js >= 20
- npm
- Git (optional — used for `git init` only)
- PostgreSQL (for the generated project; not required to run the scaffolder itself)

## Installation

```bash
npm install -g newbackend
```

## Usage

```bash
newbackend <project-name>
```

```bash
newbackend my-api
```

Other commands:

```bash
newbackend --help
newbackend --version
```

### Project name rules

- Lowercase letters, numbers, hyphens, and underscores only (`my-api`, `user_service`)
- No uppercase (rejected, never silently converted)
- No absolute paths
- Cannot be `.`, `..`, or `node_modules`
- Must not already exist as a directory

## What gets generated

```
my-api/
├── .github/
├── prisma/                  (owned by Prisma)
│   └── schema.prisma
├── generated/prisma/        (created by "npm run db:generate")
├── src/
│   ├── @types/
│   ├── config/
│   │   └── logger.ts        Pino structured logger
│   ├── database/
│   │   └── prisma.ts        Prisma Client with the PostgreSQL adapter
│   ├── errors/
│   ├── middleware/
│   │   ├── errorHandler.ts
│   │   └── notFoundHandler.ts
│   ├── modules/             feature code goes here (empty)
│   ├── shared/
│   ├── utils/
│   ├── app.ts                Express app: helmet, cors, compression, pino-http, /health
│   └── server.ts              startup + graceful shutdown (SIGINT/SIGTERM)
├── tests/
│   ├── e2e/
│   └── fixtures/
├── .env.example
├── .gitignore
├── eslint.config.js
├── .prettierrc.json / .prettierignore
├── vitest.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json
```

### Intended architecture

```
Client → Route → Controller → Service → Repository → Prisma → PostgreSQL
```

| Layer | Responsibility |
|---|---|
| Routes | URL/method mapping, middleware composition |
| Controllers | HTTP request/response handling, no direct DB access |
| Services | Business logic, orchestration, validation |
| Repositories | Prisma queries, persistence only |
| Middleware | Auth, validation, error handling, logging |

None of these layers are populated with example code — the scaffold builds the skeleton, not the muscle.

## Stack

**Runtime:** Express, Prisma 7 (`@prisma/client`, `@prisma/adapter-pg`), `pg`, `dotenv`, `cors`, `helmet`, `compression`, `zod`, `pino`, `pino-http`

**Development:** TypeScript, `tsx`, Prisma CLI, ESLint (flat config, `typescript-eslint`), Prettier, Vitest

`tsx watch` is used for the dev server — no `nodemon`.

## Getting the generated project running

A freshly scaffolded project **will not start immediately**. This is intentional: the scaffolder does not run migrations or generate the Prisma client automatically, since it doesn't know your schema yet.

```bash
cd my-api

# 1. Configure your database connection
#    (Prisma's own "init" usually creates .env for you — otherwise copy .env.example)

# 2. Define your schema in prisma/schema.prisma

# 3. Generate the client and run your first migration
npm run db:generate
npm run db:migrate

# 4. Start the dev server
npm run dev
```

### Available scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start dev server (`tsx watch`) |
| `npm run build` | Compile TypeScript to `dist/` |
| `npm start` | Run the compiled build |
| `npm run lint` / `lint:fix` | ESLint |
| `npm run format` | Prettier |
| `npm test` / `test:watch` | Vitest |
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |

## Ownership boundaries

The scaffolder respects file ownership between tools rather than overwriting things blindly:

- **Prisma owns** `prisma/`, `prisma7.config.ts`, `.env`, and whatever else it generates during `prisma init` — the scaffolder detects and preserves these rather than assuming a fixed file list, since Prisma's generated output changes between versions.
- **`.gitignore` is merged**, not overwritten — Prisma's own generated `.gitignore` is preserved, and only missing required entries are appended.
- **`.env` is never created or overwritten** by the scaffolder. If Prisma didn't create one, you'll get a warning pointing you to `.env.example`.

## Safety behavior

- The project directory is only ever deleted automatically if **this specific run** created it and a required step then failed. An existing directory is never touched.
- Commands run via `execFileSync` with argument arrays (not shell string concatenation), aside from a Windows-specific `.cmd`-resolution requirement (see below).
- `git init` runs automatically, but `git add`/`git commit` do not — committing is left as a deliberate decision for you to make after reviewing the generated project.
- No automatic `npm audit fix`, `npm audit fix --force`, `prisma migrate`, or `prisma generate` — nothing is applied to your dependencies or database without you running it yourself.
- npm's install-script blocking (for `prisma`, `@prisma/engines`, `esbuild`) is handled as a best-effort step; failures are reported, never hidden.

### A note on Windows and `shell: true`

On Windows, `npm.cmd` and `git.exe` batch wrappers cannot be invoked directly by Node's `execFileSync` without `shell: true` — this is a Windows-specific limitation, not a general security relaxation. The scaffolder only enables `shell: true` on `win32`, and only ever runs its own hardcoded commands (`npm`, `git`) with arguments that are either fixed strings or the already-validated project name — there is no path by which untrusted input reaches the shell.

## Limitations

- No package manager choice — npm only.
- No automatic authentication, CRUD, or domain modeling — by design.
- No Docker, CI pipelines, or deployment configuration — by design.
- `npm audit` output is not automatically resolved; review it yourself.
- Tested primarily on Windows (Git Bash/MINGW64) and should work on macOS/Linux, but hasn't been exhaustively verified there yet.

## Development (contributing to the scaffolder itself)

```bash
git clone <this-repo>
cd newbackend
npm pack
npm install -g ./newbackend-0.1.0.tgz
```

Then test in a throwaway directory:

```bash
cd /tmp
newbackend test-project
cd test-project
npm run lint
npm test
```

Before publishing a new version:

```bash
npm pack
tar -tf newbackend-<version>.tgz   # confirm only bin/ + package.json are included
npm install -g ./newbackend-<version>.tgz
# test from a completely unrelated directory before "npm publish"
```

## Versioning

Currently `0.x.x` while behavior is still settling. `1.0.0` will follow once the CLI, generated project, and packaged install have all been verified stable across platforms.

## License

MIT