\# newbackend



A minimal production-oriented backend scaffolder for \*\*Express + TypeScript + Prisma 7 + PostgreSQL\*\*.



`newbackend` creates a structured backend foundation so you can spend less time configuring projects and more time building the application itself.



\## Features



\* Express.js backend

\* TypeScript with strict mode

\* Prisma 7 with PostgreSQL

\* Prisma PostgreSQL driver adapter

\* Environment variable support with `dotenv`

\* Security headers with Helmet

\* Configurable CORS

\* Response compression

\* Request logging with Pino

\* Centralized error handling

\* 404 route handling

\* Graceful server shutdown

\* ESLint + Prettier

\* Vitest testing setup

\* Git repository initialization

\* Safe project creation and cleanup

\* No application-specific business logic



\## Philosophy



`newbackend` is a \*\*foundation, not a framework\*\*.



It automates repetitive setup while leaving application decisions to the developer.



The generated architecture follows:



```text

Client

&#x20; ↓

Route

&#x20; ↓

Controller

&#x20; ↓

Service

&#x20; ↓

Repository

&#x20; ↓

Prisma

&#x20; ↓

PostgreSQL

```



Feature-specific code belongs inside `src/modules/`.



The scaffolder intentionally does \*\*not\*\* generate:



\* Authentication

\* Users

\* CRUD examples

\* Business models

\* Controllers with fake functionality

\* Services with fake functionality

\* Repository abstractions without a feature

\* Automatic database migrations

\* Application-specific middleware

\* Unnecessary dependencies



This keeps the generated project clean and adaptable.



\---



\## Requirements



\* Node.js 20+

\* npm

\* Git (optional)

\* PostgreSQL



Prisma 7 is used by the generated project.



\---



\## Installation



Install the CLI globally:



```bash

npm install -g newbackend

```



Then create a project:



```bash

newbackend my-api

```



Or run it without installing globally:



```bash

npx newbackend my-api

```



\---



\## Usage



\### Create a project



```bash

newbackend my-api

```



Project names must use:



\* lowercase letters

\* numbers

\* hyphens

\* underscores



For example:



```bash

newbackend payment-api

newbackend inventory\_service

newbackend backend2026

```



Uppercase characters are intentionally rejected rather than automatically converted.



\### Help



```bash

newbackend --help

```



or:



```bash

newbackend -h

```



\### Version



```bash

newbackend --version

```



or:



```bash

newbackend -v

```



\---



\# Generated Project



A generated project looks approximately like this:



```text

my-api/

├── .github/

├── prisma/

│   └── schema.prisma

├── generated/

│   └── prisma/

├── src/

│   ├── @types/

│   ├── config/

│   │   └── logger.ts

│   ├── database/

│   │   └── prisma.ts

│   ├── errors/

│   ├── middleware/

│   │   ├── errorHandler.ts

│   │   └── notFoundHandler.ts

│   ├── modules/

│   ├── shared/

│   ├── utils/

│   ├── app.ts

│   └── server.ts

├── tests/

│   ├── e2e/

│   │   └── .gitkeep

│   └── fixtures/

│       └── .gitkeep

├── .env

├── .env.example

├── .gitignore

├── .prettierignore

├── .prettierrc.json

├── eslint.config.js

├── package.json

├── package-lock.json

├── tsconfig.json

└── vitest.config.ts

```



The `generated/prisma/` directory is created by Prisma and is intentionally ignored by Git.



\---



\# Getting Started



After creating the project:



```bash

cd my-api

```



\## 1. Configure the environment



If Prisma created `.env`, update it with your PostgreSQL connection:



```env

DATABASE\_URL="postgresql://username:password@localhost:5432/database?schema=public"

PORT=5000

NODE\_ENV=development

LOG\_LEVEL=info

CORS\_ORIGIN=\*

```



If `.env` does not exist, copy `.env.example`:



```bash

cp .env.example .env

```



On Windows PowerShell:



```powershell

Copy-Item .env.example .env

```



Then configure `DATABASE\_URL`.



\---



\## 2. Define your Prisma schema



Edit:



```text

prisma/schema.prisma

```



For example:



```prisma

model User {

&#x20; id    String @id @default(uuid())

&#x20; name  String

&#x20; email String @unique

}

```



Your application models belong here.



\---



\## 3. Generate Prisma Client



Run:



```bash

npm run db:generate

```



This creates the Prisma client under:



```text

generated/prisma/

```



The scaffolder does not automatically generate the client because Prisma owns the generated output and database workflow.



\---



\## 4. Create your database migration



Once your schema and database connection are configured:



```bash

npm run db:migrate

```



Prisma will create and apply a development migration.



\---



\## 5. Start the development server



```bash

npm run dev

```



The default server runs on:



```text

http://localhost:5000

```



Health check:



```text

GET /health

```



Expected response:



```json

{

&#x20; "status": "ok"

}

```



\---



\# Available Scripts



| Script                | Purpose                                      |

| --------------------- | -------------------------------------------- |

| `npm run dev`         | Start the development server with watch mode |

| `npm run build`       | Compile TypeScript                           |

| `npm start`           | Start the compiled application               |

| `npm run lint`        | Run ESLint                                   |

| `npm run lint:fix`    | Fix ESLint issues where possible             |

| `npm run format`      | Format the project with Prettier             |

| `npm test`            | Run tests                                    |

| `npm run test:watch`  | Run tests in watch mode                      |

| `npm run db:generate` | Generate Prisma Client                       |

| `npm run db:migrate`  | Create/apply development migrations          |

| `npm run db:studio`   | Open Prisma Studio                           |

| `npm run db:format`   | Format Prisma schema                         |

| `npm run db:validate` | Validate Prisma schema                       |



\---



\# Project Architecture



The generated project is organized around feature modules and clear separation of responsibilities.



```text

src/

├── config/

├── database/

├── errors/

├── middleware/

├── modules/

├── shared/

├── utils/

└── ...

```



A typical feature can eventually look like:



```text

src/modules/users/

├── user.routes.ts

├── user.controller.ts

├── user.service.ts

├── user.repository.ts

└── user.schema.ts

```



The scaffolder does not create these files automatically because their structure and contents depend on the application.



\---



\# Environment Variables



The generated `.env.example` contains:



```env

DATABASE\_URL="postgresql://username:password@localhost:5432/database?schema=public"

PORT=5000

NODE\_ENV=development

LOG\_LEVEL=info

CORS\_ORIGIN=\*

```



\### `DATABASE\_URL`



PostgreSQL connection string used by Prisma.



\### `PORT`



Port used by the Express server.



Default:



```text

5000

```



\### `NODE\_ENV`



Application environment.



Typical values:



```text

development

production

test

```



\### `LOG\_LEVEL`



Pino logging level.



Example:



```text

info

```



\### `CORS\_ORIGIN`



Allowed CORS origin.



For development:



```text

\*

```



For a specific frontend:



```text

https://example.com

```



\---



\# Database



`newbackend` uses Prisma 7 with PostgreSQL.



The generated Prisma client uses the PostgreSQL driver adapter:



```text

Express

&#x20;  ↓

Service

&#x20;  ↓

Repository

&#x20;  ↓

Prisma Client

&#x20;  ↓

@prisma/adapter-pg

&#x20;  ↓

PostgreSQL

```



Database-specific application logic should remain inside the appropriate feature repositories/services rather than being placed directly inside controllers.



\---



\# Error Handling



The generated application includes:



\### 404 handling



Requests to undefined routes return:



```json

{

&#x20; "error": "Route not found: GET /example"

}

```



\### Centralized errors



Unhandled application errors are processed by:



```text

src/middleware/errorHandler.ts

```



In development, the error message is returned.



In production, the response uses:



```text

Internal Server Error

```



This prevents accidental exposure of internal error details.



\---



\# Logging



The project uses:



\* Pino

\* pino-http



The logger is available through:



```text

src/config/logger.ts

```



HTTP requests are automatically logged through `pino-http`.



Logging level can be configured with:



```env

LOG\_LEVEL=info

```



\---



\# Security



The generated Express application includes:



\* Helmet

\* CORS

\* JSON request-size limits

\* Compression

\* Centralized error handling



The scaffold provides sensible defaults but does not claim to make an application automatically secure.



Application-specific security requirements remain the developer's responsibility.



\---



\# Testing



Vitest is included for testing.



Tests are expected under:



```text

tests/

├── e2e/

└── fixtures/

```



Run tests with:



```bash

npm test

```



Or use watch mode:



```bash

npm run test:watch

```



No meaningless example tests are generated.



\---



\# Git



If Git is installed, `newbackend` initializes a Git repository in the new project.



It does \*\*not\*\* create an initial commit.



This allows you to review the generated project before deciding what should be committed.



\---



\# Design Principles



\### Automate the boring parts



Project initialization, dependency installation, tooling configuration, directory structure, and basic infrastructure should not need to be recreated manually.



\### Enforce conventions



Generated projects should start with consistent conventions for configuration, logging, errors, testing, and database access.



\### Preserve tool ownership



Tools such as Prisma own their generated files and configuration. `newbackend` should configure them without taking over their responsibilities.



\### Fail safely



The CLI refuses to overwrite an existing project directory and cleans up a directory only when that directory was created by the current scaffolding run.



\### Don't make application decisions



The developer decides:



\* What models exist

\* How authentication works

\* What modules exist

\* How business logic works

\* Which API endpoints exist

\* How repositories are implemented

\* How authorization works



`newbackend` provides the foundation for those decisions rather than making them.



\---



\# Roadmap



Potential future improvements may include:



\* Additional project configuration options

\* Optional database providers

\* More testing utilities

\* Optional Docker configuration

\* Improved CLI diagnostics

\* Additional scaffolding templates



The core goal remains keeping the generated project \*\*small, understandable, and production-oriented\*\*.



\---



\# Contributing



Contributions, bug reports, and suggestions are welcome.



Before submitting a change, please consider whether it belongs in a backend foundation or whether it introduces application-specific behavior.



For larger changes, open an issue first to discuss the proposed approach.



\---



\# License



MIT



