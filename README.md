# ByteStash
<p align="center">
  <img src="https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/client/public/logo192.png" />
</p>

ByteStash is a self-hosted web application designed to store, organise, and manage your code snippets efficiently. With support for creating, editing, and filtering snippets, ByteStash helps you keep track of your code in one secure place.

![ByteStash App](https://raw.githubusercontent.com/jordan-dalby/ByteStash/refs/heads/main/media/app-image.png)

## Demo
Check out the [ByteStash demo](https://bytestash-demo.pikapod.net/) powered by PikaPods!  
Username: demo  
Password: demodemo

## Features
- Create and Edit Snippets: Easily add new code snippets or update existing ones with an intuitive interface.
- Filter by Language and Content: Quickly find the right snippet by filtering based on programming language or keywords in the content.
- Secure Storage: All snippets are securely stored in a sqlite database, ensuring your code remains safe and accessible only to you.
- AI Integration (MCP): Connect AI assistants such as Claude, OpenAI and Perplexity through a built-in [Model Context Protocol](https://modelcontextprotocol.io) endpoint to search and manage your snippets, authenticated with your existing API key. See [MCP (AI assistants)](#mcp-ai-assistants).

## Howto
### Unraid
ByteStash is now on the Unraid App Store! Install it from [there](https://unraid.net/community/apps).

### PikaPods
Also available on [PikaPods](https://www.pikapods.com/) for [1-click install](https://www.pikapods.com/pods?run=bytestash) from $1/month.

### Docker
ByteStash can also be hosted manually via the docker-compose file:
```yaml
services:
  bytestash:
    image: "ghcr.io/jordan-dalby/bytestash:latest"
    restart: always
    volumes:
      - /your/snippet/path:/data/snippets
    ports:
      - "5000:5000"
    environment:
      # See https://github.com/jordan-dalby/ByteStash/wiki/FAQ#environment-variables
      #ALLOWED_HOSTS: localhost,my.domain.com,my.domain.net
      BASE_PATH: ""
      JWT_SECRET: your-secret
      TOKEN_EXPIRY: 24h
      ALLOW_NEW_ACCOUNTS: "true"
      DEBUG: "true"
      DISABLE_ACCOUNTS: "false"
      DISABLE_INTERNAL_ACCOUNTS: "false"

      # See https://github.com/jordan-dalby/ByteStash/wiki/Single-Sign%E2%80%90on-Setup for more info
      OIDC_ENABLED: "false"
      OIDC_DISPLAY_NAME: ""
      OIDC_ISSUER_URL: ""
      OIDC_CLIENT_ID: ""
      OIDC_CLIENT_SECRET: ""
      OIDC_SCOPES: ""
```

## Tech Stack
- Frontend: React, Tailwind CSS
- Backend: Node.js, Express
- Containerisation: Docker

## API Documentation
Once the server is running you can explore the API via Swagger UI. Open
`/api-docs` in your browser to view the documentation for all endpoints.

## MCP (AI assistants)
ByteStash exposes a remote [Model Context Protocol](https://modelcontextprotocol.io)
endpoint so AI assistants such as **Claude** (desktop & web), **OpenAI/ChatGPT** and
**Perplexity** can search, read and manage your snippets directly.

- **Endpoint:** `https://<your-host>/mcp` (or `https://<your-host><BASE_PATH>/mcp` when a
  base path is configured). It is served on the same host/port as the app, so nothing extra
  needs to be exposed in your deployment.
- **Transport:** Streamable HTTP.
- **Auth:** the **same API key** used by the REST API. Create one under
  *Settings → API Keys* in the UI, then send it as `Authorization: Bearer <api-key>`
  (or the `x-api-key` header). The MCP tools only ever access snippets owned by that key.

### Available tools
`list_snippets`, `get_snippet`, `create_snippet`, `update_snippet`, `delete_snippet`,
`list_metadata`.

### Connecting clients
- **Claude Desktop** (`claude_desktop_config.json`):
  ```json
  {
    "mcpServers": {
      "bytestash": {
        "type": "http",
        "url": "https://your-host/mcp",
        "headers": { "Authorization": "Bearer YOUR_API_KEY" }
      }
    }
  }
  ```
- **Claude.ai / web & other custom connectors:** add a custom connector pointing at
  `https://your-host/mcp` and supply the `Authorization: Bearer YOUR_API_KEY` header.
- **OpenAI Responses API:** pass it as an MCP tool:
  ```json
  {
    "type": "mcp",
    "server_label": "bytestash",
    "server_url": "https://your-host/mcp",
    "headers": { "Authorization": "Bearer YOUR_API_KEY" }
  }
  ```
- **Perplexity:** add a remote MCP connector with the URL above and the same
  `Authorization` header.

> The endpoint requires HTTPS for remote clients — terminate TLS at your reverse
> proxy/ingress as you already do for the web UI.

## Contract Testing

### What is Contract Testing?

Contract testing verifies that an API implementation conforms to its documented specification. Instead of writing assertions by hand, the API's OpenAPI specification acts as the "contract" — a single source of truth that defines every endpoint, request format, and response schema. A contract testing tool reads this specification and automatically validates the running application against it.

### How It Works in This Project

ByteStash uses [Specmatic](https://specmatic.io/) as its contract testing tool. The integration consists of:

| Component | Location | Purpose |
|---|---|---|
| OpenAPI specification | `server/docs/swagger.yaml` | The contract — defines all endpoints, schemas, and security schemes |
| Example files | `server/docs/swagger_examples/` | 22 request/response pairs that Specmatic replays against the server |
| Data dictionary | `server/docs/swagger_dictionary.yaml` | Domain-specific test values (usernames, snippet titles, languages) used during test generation |
| Specmatic configuration | `server/specmatic.yaml` | Connects the specification to the running server and configures coverage thresholds |
| Test database seeder | `server/scripts/seed-test-db.js` | Seeds deterministic test data (users, snippets, API keys, shares) before each test run |
| Test database cleaner | `server/scripts/clear-test-db.js` | Clears test data from the database after contract test completion |
| CI workflow | `.github/workflows/contract-tests.yml` | Automates validation, contract testing, and post-test cleanup on every push and pull request |

## Running Specmatic Contract Tests

ByteStash uses [Specmatic](https://specmatic.io/) to validate the backend API against its OpenAPI specification (`server/docs/swagger.yaml`). This ensures every endpoint conforms to its documented contract.

### Prerequisites

- **Node.js ≥ 22** (see `engines` in `package.json`)
- **npm** (included with Node.js)

### 1. Install Dependencies

```bash
cd server
npm install
```

This installs all runtime and dev dependencies, including the `specmatic` CLI and `cross-env`.

### 2. Validate OpenAPI Examples (Offline)

Before starting any services, verify that all example files are consistent with the specification:

```bash
npm run specmatic:validate
```
This step reads only `docs/swagger.yaml` and `docs/swagger_examples/*.json` from disk — no running server is required.

### 3. Start the Test Server

The `start:test` script seeds the database with deterministic test data and starts the Express server with the required environment variables:

```bash
npm run start:test
```

Wait until you see `Server running on port 5000` in the console before proceeding.

### 4. Run Contract Tests

In a **separate terminal**, run:

```bash
cd server
npm run test:contract
```

This executes the Specmatic contract test suite against `http://localhost:5000`, with generative (resiliency) testing enabled.

### 5. Clean Up Test Database

After running tests, you can clear all test data from the database:

```bash
npm run clear:test
```

*(Note: In CI, database cleanup runs automatically after contract testing finishes, even if tests fail.)*

### Understanding the Output

Specmatic prints a summary at the end of the test run:

- **Successes**: Endpoints that returned responses matching the OpenAPI specification.
- **Failures**: Endpoints where the response status code or body did not match the contract. Each failure includes the endpoint, the rule violated (e.g., `R0002: HTTP status mismatch`), and a description.
- An **API Coverage** table shows which operations were exercised and which were not.

### Troubleshooting

| Symptom | Cause | Fix |
|---|---|---|
| `EADDRINUSE: address already in use :::5000` | A previous server process is still running on port 5000 | Kill the existing process and retry |
| `Username already exists` errors in the server log | Specmatic's registration test attempts to re-register `testuser` | Run `npm run clear:test` to reset database state, then `npm run start:test` |
| Validation reports `0 examples found` | Running from the wrong directory | Ensure you run all commands from the `server/` directory |

## Contributing
Contributions are welcome! Please submit a pull request or open an issue for any improvements or bug fixes.

### I18n
To add phrases for a new language, follow these steps. Example for `fr` locale:
- Add the locale name to the `Locale` enum in the `client/src/i18n/types.ts` file
- Add the locale name to the `locales` array in the `client/i18next.config.ts` file
- Run translation synchronization: `cd client && npm run i18n:extract`
- Replace all `__TRANSLATE_ME__` lines with the desired phrases
- Create new resources file as `client/src/i18n/resources/fr.ts`
- Update export resources in file `client/src/i18n/resources/index.ts`
- Run the server in development mode: `npm run dev`
- Run the client in development mode: `cd client && npm run start`
