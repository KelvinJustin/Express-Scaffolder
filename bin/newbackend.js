#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// --------------------------------------------------
// CLI arg parsing
// --------------------------------------------------

const args = process.argv.slice(2);

function readOwnVersion() {
    const pkgPath = path.join(__dirname, "..", "package.json");
    try {
        return JSON.parse(fs.readFileSync(pkgPath, "utf8")).version;
    } catch {
        return "0.0.0";
    }
}

function printHelp() {
    console.log(`
newbackend <project-name>

Scaffolds an Express + TypeScript + Prisma 7 + PostgreSQL backend foundation.

Options:
  -h, --help       Show this help message
  -v, --version    Show the CLI version

Example:
  newbackend my-api
`);
}

if (args.includes("-h") || args.includes("--help")) {
    if (args.length > 1) {
        console.error("\nError: --help does not accept additional arguments.");
        process.exit(1);
    }

    printHelp();
    process.exit(0);
}

if (args.includes("-v") || args.includes("--version")) {
    if (args.length > 1) {
        console.error("\nError: --version does not accept additional arguments.");
        process.exit(1);
    }

    console.log(readOwnVersion());
    process.exit(0);
}

if (args.length > 1) {
    console.error("\nError: Too many arguments. Usage: newbackend <project-name>");
    process.exit(1);
}

const rawProjectName = args[0];

// --------------------------------------------------
// Configuration
// --------------------------------------------------

const runtimeDependencies = [
    "express",
    "@prisma/client@7",
    "@prisma/adapter-pg",
    "pg",
    "dotenv",
    "cors",
    "helmet",
    "compression",
    "zod",
    "pino",
    "pino-http"
];

const devDependencies = [
    "typescript",
    "tsx",
    "prisma@7",
    "@types/node",
    "@types/express",
    "@types/pg",
    "@types/cors",
    "@types/compression",
    "eslint",
    "@eslint/js",
    "typescript-eslint",
    "eslint-config-prettier",
    "prettier",
    "vitest"
];

const packagesNeedingScriptApproval = [
    "prisma",
    "@prisma/engines",
    "esbuild"
];

const reservedNames = new Set([
    ".",
    "..",
    "node_modules"
]);

// --------------------------------------------------
// Small helpers
// --------------------------------------------------

function log(message) {
    console.log(`\n${message}`);
}

function warn(message) {
    console.warn(`\nWarning: ${message}`);
}

let projectCreated = false;
let projectPathForCleanup = null;

function fail(message) {
    console.error(`\nError: ${message}`);

    if (projectCreated && projectPathForCleanup) {
        try {
            fs.rmSync(projectPathForCleanup, {
                recursive: true,
                force: true
            });
            console.error(
                `Cleaned up directory created by this run: ${projectPathForCleanup}`
            );
        } catch {
            console.error(
                `Warning: could not clean up ${projectPathForCleanup}. ` +
                `Please remove it manually.`
            );
        }
    }

    process.exit(1);
}

function run(command, args, cwd) {
    console.log(`\n> ${command} ${args.join(" ")}`);

    try {
        execFileSync(command, args, {
            cwd,
            stdio: "inherit",
            shell: process.platform === "win32"
        });
    } catch (error) {
        console.error("\nCommand failed.");
        console.error(`Command: ${command} ${args.join(" ")}`);

        if (error.status !== undefined && error.status !== null) {
            console.error(`Exit code: ${error.status}`);
        }

        fail("A required command failed. See output above.");
    }
}

// Best-effort execution for genuinely optional steps.
function runSoft(command, args, cwd) {
    console.log(`\n> ${command} ${args.join(" ")}`);

    try {
        const output = execFileSync(command, args, {
            cwd,
            stdio: ["ignore", "pipe", "pipe"],
            shell: process.platform === "win32"
        });

        return {
            ok: true,
            stdout: output.toString("utf8"),
            stderr: ""
        };
    } catch (error) {
        return {
            ok: false,
            stdout: error.stdout ? error.stdout.toString("utf8") : "",
            stderr: error.stderr ? error.stderr.toString("utf8") : "",
            error
        };
    }
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content, "utf8");
}

function createDirectory(directory) {
    fs.mkdirSync(directory, { recursive: true });
}

function getNpmCommand() {
    return process.platform === "win32" ? "npm.cmd" : "npm";
}

function getGitCommand() {
    return process.platform === "win32" ? "git.exe" : "git";
}

function mergeGitignore(existingContent, requiredLines) {
    const existingLines = existingContent
        ? existingContent.split(/\r?\n/)
        : [];

    const existingSet = new Set(
        existingLines
            .map((line) => line.trim())
            .filter((line) => line.length > 0 && !line.startsWith("#"))
    );

    const linesToAppend = requiredLines.filter(
        (line) => !existingSet.has(line)
    );

    if (linesToAppend.length === 0) {
        return existingContent.endsWith("\n")
            ? existingContent
            : `${existingContent}\n`;
    }

    const separator =
        existingContent.length > 0 && !existingContent.endsWith("\n")
            ? "\n"
            : "";

    const header =
        existingContent.length > 0
            ? `${separator}\n# Added by newbackend scaffolder\n`
            : "";

    return `${existingContent}${header}${linesToAppend.join("\n")}\n`;
}

// --------------------------------------------------
// Validate project name (strict — no silent transforms)
// --------------------------------------------------

if (!rawProjectName) {
    fail("Usage: newbackend <project-name>");
}

if (path.isAbsolute(rawProjectName)) {
    fail("Project name must not be an absolute path.");
}

if (reservedNames.has(rawProjectName)) {
    fail(`"${rawProjectName}" is a reserved name and cannot be used.`);
}

if (!/^[a-z0-9_-]+$/.test(rawProjectName)) {
    fail(
        "Invalid project name. Use only lowercase letters, numbers, " +
        "hyphens and underscores (e.g. my-api). Uppercase characters " +
        "are not allowed and will not be auto-converted."
    );
}

const projectName = rawProjectName;

// --------------------------------------------------
// Project paths
// --------------------------------------------------

const projectPath = path.resolve(process.cwd(), projectName);
projectPathForCleanup = projectPath;

if (fs.existsSync(projectPath)) {
    fail(`Directory already exists: ${projectPath}`);
}

// --------------------------------------------------
// Start
// --------------------------------------------------

console.log(`
========================================
      NEW BACKEND PROJECT
========================================

Project: ${projectName}
Location: ${projectPath}
`);

log("Creating project directory...");
createDirectory(projectPath);
projectCreated = true;

// --------------------------------------------------
// npm init
// --------------------------------------------------

log("Initializing npm project...");
run(getNpmCommand(), ["init", "-y"], projectPath);

// --------------------------------------------------
// Install dependencies
// --------------------------------------------------

log("Installing runtime dependencies...");
run(getNpmCommand(), ["install", ...runtimeDependencies], projectPath);

log("Installing development dependencies...");
run(getNpmCommand(), ["install", "-D", ...devDependencies], projectPath);

// --------------------------------------------------
// Best-effort install-script approval
// --------------------------------------------------

log("Checking for blocked install scripts...");

const scriptApprovalResults = [];

for (const pkg of packagesNeedingScriptApproval) {
    const result = runSoft(
        getNpmCommand(),
        ["install-scripts", "approve", pkg],
        projectPath
    );

    scriptApprovalResults.push({ pkg, ok: result.ok });

    if (!result.ok) {
        warn(
            `Could not auto-approve install scripts for "${pkg}". ` +
            `Your npm version may not support "install-scripts", or nothing ` +
            `needed approval. Check manually with: npm install-scripts ls`
        );
        if (result.stderr) {
            console.error(result.stderr.trim());
        }
    }
}

// --------------------------------------------------
// package.json
// --------------------------------------------------

const packagePath = path.join(projectPath, "package.json");
const packageJson = JSON.parse(fs.readFileSync(packagePath, "utf8"));

packageJson.name = projectName;
packageJson.type = "module";
packageJson.engines = { node: ">=20.0.0" };

packageJson.scripts = {
    dev: "tsx watch src/server.ts",
    build: "tsc",
    start: "node dist/server.js",

    lint: "eslint .",
    "lint:fix": "eslint . --fix",
    format: "prettier --write .",

    test: "vitest run",
    "test:watch": "vitest",

    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:studio": "prisma studio",
    "db:format": "prisma format",
    "db:validate": "prisma validate"
};

writeFile(packagePath, JSON.stringify(packageJson, null, 2) + "\n");

// --------------------------------------------------
// TypeScript
// --------------------------------------------------

log("Initializing TypeScript...");
run(getNpmCommand(), ["exec", "tsc", "--", "--init"], projectPath);

const tsconfig = {
    compilerOptions: {
        target: "ES2023",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        resolveJsonModule: true,
        sourceMap: true,
        rootDir: "./src",
        outDir: "./dist",
        types: ["node"]
    },
    include: ["src"]
};

writeFile(
    path.join(projectPath, "tsconfig.json"),
    JSON.stringify(tsconfig, null, 2) + "\n"
);

// --------------------------------------------------
// Prisma 7
// --------------------------------------------------

const preInitEntries = new Set(fs.readdirSync(projectPath));

log("Initializing Prisma 7...");
run(
    getNpmCommand(),
    [
        "exec",
        "prisma",
        "--",
        "init",
        "--datasource-provider",
        "postgresql",
        "--output",
        "../generated/prisma"
    ],
    projectPath
);

const postInitEntries = fs.readdirSync(projectPath);
const prismaInitEntries = postInitEntries.filter(
    (entry) => !preInitEntries.has(entry)
);

if (prismaInitEntries.length > 0) {
    log(`Prisma init created: ${prismaInitEntries.join(", ")}`);
}

// --------------------------------------------------
// Architecture directories
// --------------------------------------------------

log("Creating backend architecture...");

const directories = [
    ".github",
    "src",
    "src/@types",
    "src/config",
    "src/database",
    "src/errors",
    "src/middleware",
    "src/modules",
    "src/shared",
    "src/utils",
    "tests",
    "tests/e2e",
    "tests/fixtures"
];

for (const directory of directories) {
    createDirectory(path.join(projectPath, directory));
}

// --------------------------------------------------
// .env.example
// --------------------------------------------------

log("Writing environment template...");

const envExample = `DATABASE_URL="postgresql://username:password@localhost:5432/database?schema=public"
PORT=5000
NODE_ENV=development
LOG_LEVEL=info
CORS_ORIGIN=*
`;

writeFile(path.join(projectPath, ".env.example"), envExample);

const envPath = path.join(projectPath, ".env");
if (!fs.existsSync(envPath)) {
    warn(
        "Prisma did not create a .env file. " +
        "Create one manually using .env.example as a template before " +
        "running the app."
    );
} else {
    log(".env already created by Prisma init — leaving it untouched.");
}

// --------------------------------------------------
// .gitignore
// --------------------------------------------------

log("Merging .gitignore...");

const requiredGitignoreLines = [
    "node_modules/",
    "dist/",
    ".env",
    "coverage/",
    "generated/",
    "*.log",
    ".DS_Store"
];

const gitignorePath = path.join(projectPath, ".gitignore");
const existingGitignore = fs.existsSync(gitignorePath)
    ? fs.readFileSync(gitignorePath, "utf8")
    : "";

writeFile(
    gitignorePath,
    mergeGitignore(existingGitignore, requiredGitignoreLines)
);

// --------------------------------------------------
// src/config/logger.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/config/logger.ts"),
    `import "dotenv/config";

import pino from "pino";

export const logger = pino({
    level: process.env.LOG_LEVEL ?? "info"
});
`
);

// --------------------------------------------------
// src/database/prisma.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/database/prisma.ts"),
    `import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../../generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL ?? "";

const adapter = new PrismaPg({
    connectionString
});

export const prisma = new PrismaClient({
    adapter
});
`
);

// --------------------------------------------------
// src/middleware/errorHandler.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/middleware/errorHandler.ts"),
    `import type { NextFunction, Request, Response } from "express";

const isDevelopment = process.env.NODE_ENV === "development";

export function errorHandler(
    err: Error,
    req: Request,
    res: Response,
    _next: NextFunction
) {
    req.log?.error(err);

    res.status(500).json({
        error: isDevelopment ? err.message : "Internal Server Error"
    });
}
`
);

// --------------------------------------------------
// src/middleware/notFoundHandler.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/middleware/notFoundHandler.ts"),
    `import type { Request, Response } from "express";

export function notFoundHandler(req: Request, res: Response) {
    res.status(404).json({
        error: \`Route not found: \${req.method} \${req.originalUrl}\`
    });
}
`
);

// --------------------------------------------------
// src/app.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/app.ts"),
    `import express from "express";
import cors from "cors";
import helmet from "helmet";
import compression from "compression";
import pinoHttp from "pino-http";

import { logger } from "./config/logger.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFoundHandler } from "./middleware/notFoundHandler.js";

export function createApp() {
    const app = express();

    app.use(helmet());

    app.use(
        cors({
            origin: process.env.CORS_ORIGIN ?? "*"
        })
    );

    app.use(compression());
    app.use(express.json({ limit: "1mb" }));
    app.use(pinoHttp({ logger }));

    app.get("/health", (_req, res) => {
        res.json({ status: "ok" });
    });

    // Mount feature routes from src/modules here, e.g.:
    // app.use("/api/users", userRouter);

    app.use(notFoundHandler);
    app.use(errorHandler);

    return app;
}
`
);

// --------------------------------------------------
// src/server.ts
// --------------------------------------------------

writeFile(
    path.join(projectPath, "src/server.ts"),
    `import "dotenv/config";

import { createApp } from "./app.js";
import { logger } from "./config/logger.js";
import { prisma } from "./database/prisma.js";

const port = Number(process.env.PORT ?? 5000);

const app = createApp();

const server = app.listen(port, () => {
    logger.info(\`Server listening on port \${port}\`);
});

let shuttingDown = false;

async function shutdown(signal: string) {
    if (shuttingDown) {
        return;
    }

    shuttingDown = true;

    logger.info(\`Received \${signal}, shutting down gracefully...\`);

    server.close(async () => {
        try {
            await prisma.$disconnect();
        } catch (error) {
            logger.error(error, "Error disconnecting Prisma");
        }

        logger.info("Shutdown complete.");
        process.exit(0);
    });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
`
);

// --------------------------------------------------
// ESLint / Prettier / Vitest
// --------------------------------------------------

log("Writing tooling configuration...");

writeFile(
    path.join(projectPath, "eslint.config.js"),
    `import js from "@eslint/js";
import tseslint from "typescript-eslint";
import eslintConfigPrettier from "eslint-config-prettier";

export default tseslint.config(
    js.configs.recommended,
    ...tseslint.configs.recommended,
    eslintConfigPrettier,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": [
                "error",
                { argsIgnorePattern: "^_" }
            ]
        }
    },
    {
        ignores: ["dist/**", "generated/**", "node_modules/**"]
    }
);
`
);

writeFile(
    path.join(projectPath, ".prettierrc.json"),
    JSON.stringify(
        {
            semi: true,
            singleQuote: false,
            tabWidth: 4,
            trailingComma: "none",
            printWidth: 80
        },
        null,
        2
    ) + "\n"
);

writeFile(
    path.join(projectPath, ".prettierignore"),
    "dist/\ngenerated/\nnode_modules/\ncoverage/\n"
);

writeFile(
    path.join(projectPath, "vitest.config.ts"),
    `import { defineConfig } from "vitest/config";

export default defineConfig({
    test: {
        environment: "node",
        include: ["tests/**/*.test.ts"],
        passWithNoTests: true
    }
});
`
);

writeFile(path.join(projectPath, "tests/e2e/.gitkeep"), "");
writeFile(path.join(projectPath, "tests/fixtures/.gitkeep"), "");

// --------------------------------------------------
// Git
// --------------------------------------------------

log("Initializing git repository...");

const gitInit = runSoft(getGitCommand(), ["init"], projectPath);

if (!gitInit.ok) {
    warn("git init failed. Skipping git setup.");
    if (gitInit.stderr) {
        console.error(gitInit.stderr.trim());
    }
}

// --------------------------------------------------
// Finish
// --------------------------------------------------

const scriptApprovalSummary = scriptApprovalResults
    .map((r) => `    ${r.ok ? "Attempted" : "Failed"}: ${r.pkg}`)
    .join("\n");

console.log(`
========================================
      PROJECT CREATED SUCCESSFULLY
========================================

Project: ${projectName}

IMPORTANT — setup before "npm run dev" will work:

    1. Configure DATABASE_URL (and other values) in .env
       (copy from .env.example if .env wasn't created by Prisma)
    2. Define your schema in prisma/schema.prisma
    3. Run:
           npm run db:generate
           npm run db:migrate
    4. Then:
           npm run dev

The generated project cannot start until Prisma Client has been
generated at least once, because src/database/prisma.ts imports the
generated Prisma client from generated/prisma/.

Structure:

${projectName}/
├── .github/
├── prisma/                (owned by Prisma)
├── generated/prisma/      (created by "npm run db:generate")
├── src/
│   ├── @types/
│   ├── config/logger.ts
│   ├── database/prisma.ts
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
│   ├── e2e/          (.gitkeep — directory placeholder, not a test)
│   └── fixtures/     (.gitkeep — directory placeholder, not a fixture)
├── .env.example
├── .gitignore  (merged with Prisma's, if generated)
├── .prettierrc.json / .prettierignore
├── eslint.config.js
├── vitest.config.ts
├── package.json
├── package-lock.json
└── tsconfig.json

Prisma initialization entries detected this run:
${
    prismaInitEntries.length > 0
        ? prismaInitEntries.map((e) => `    ${e}`).join("\n")
        : "    (none detected)"
}

Install-script approval attempts:
${scriptApprovalSummary}
If any failed, check manually: npm install-scripts ls

Git: ${gitInit.ok ? "repository initialized (no commit made yet)" : "not initialized — see warning above"}

Notes:
    - No migrations were run automatically.
    - No initial git commit was made — review the project, then commit
      yourself when ready.
    - "npm audit" was not run automatically. Run it yourself when ready.
`);