<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

# ms-email

NestJS microservice for sending emails via RabbitMQ.

## Description

Microservice dedicated to email management and sending with Handlebars template support.

### Package Manager

This project uses **pnpm** as package manager. All commands must use `pnpm`.

## Installation

```bash
# Clone the repository
$ git clone https://github.com/MGardier/ms-email.git

# Install dependencies
$ pnpm install

# Create .env file from .env.example
$ cp .env.example .env

# Run Prisma migrations
$ pnpx prisma migrate dev

# Start the server
$ pnpm run start:dev
```

## Docker

The project ships a `docker-compose.yml` with the following services:

| Service | Profile | Ports | Description |
|---------|---------|-------|-------------|
| `rabbitmq` | default | `5672` (AMQP), `15672` (management UI) | Message broker |
| `postgres` | default | `5432` | PostgreSQL 17 database |
| `pgadmin` | `dev` | `5050` (web UI) | PostgreSQL admin interface |
| `mailpit` | `dev` | `1025` (SMTP), `8025` (web UI) | Local SMTP server for email testing |

> Set the required variables in your `.env` file before starting (at least `POSTGRES_PASSWORD` and `PGADMIN_PASSWORD`).

```bash
# Start the core services (rabbitmq + postgres)
$ docker compose up -d

# Start everything including dev tools (pgadmin + mailpit)
$ docker compose --profile dev up -d

# Start a single service
$ docker compose up -d postgres

# Check the status of the services
$ docker compose ps

# Follow the logs (all services or a specific one)
$ docker compose logs -f
$ docker compose logs -f postgres

# Stop the services (containers are kept)
$ docker compose stop

# Stop and remove the containers
$ docker compose down

# Stop, remove the containers AND delete the volumes (data loss)
$ docker compose down -v
```

## Configuration

### Environment Variables

- Prefer using `this.configService.get('VARIABLE')` over `process.env.VARIABLE`


## Development Conventions

### Project Structure

```
src/
├── modules/
│   ├── email/
│   │   ├── dto/                   # DTOs (validation)
│   │   ├── types.ts               # Module-specific interfaces/types
│   │   ├── email.controller.ts
│   │   ├── email.service.ts
│   │   ├── email.repository.ts
│   │   └── email.module.ts
│   │
│   └── template/
│       ├── types.ts
│       ├── template.service.ts
│       ├── template.module.ts
│       └── pages/                 # Email templates (Handlebars)
│
├── common/
│   ├── filters/                   # Global exception filters
│   ├── enums/                     # Error codes & status enums
│   └── types/                     # Shared type definitions
│
├── app.module.ts
└── main.ts
```

---

### Layer Rules

| Layer | File | Does | Does NOT |
|---|---|---|---|
| **Controller** | `*.controller.ts` | Message pattern handling, call service, return response | Business logic, DB queries |
| **Service** | `*.service.ts` | Business logic, orchestration, call repository | Direct ORM calls |
| **Repository** | `*.repository.ts` | Database operations only | Business rules |
| **Types** | `types.ts` | Define interfaces and types for the module | Contain implementation |

---

### Code Flow

```
RabbitMQ Message → Controller → Service → Repository → Database
                       ↓           ↓
                     DTO      Interface
```

---

### Naming Conventions

```
email.controller.ts           # Controller
email.service.ts              # Service
email.repository.ts           # Repository implementation
types.ts                      # Module types/interfaces

rpc-exception.filter.ts       # Exception filter
send-email.dto.ts             # DTO
```

---

### DTOs Conventions

#### Naming
- **Classes**: PascalCase + `Dto` (e.g., `SendEmailDto`, `DeleteEmailDto`)

#### Files
- DTOs in `dto/` directory
- File naming: `{action}-{entity}.dto.ts` (e.g., `send-email.dto.ts`)

---

### Typing Conventions

**Required prefixes:**
- `I` for interfaces: `IEmailSendResult`, `IRpcErrorResponse`
- `T` for types: `TEmailStatus`

**File organization:**

| Location | Purpose | Examples |
|----------|---------|----------|
| `src/modules/*/types.ts` | Module-specific interfaces/types | `IEmailSendResult`, `ITemplateContext` |
| `src/common/types/*.ts` | Shared types (thematic) | `IRpcErrorResponse` |

**Rules:**
- One `types.ts` file per module containing ALL module interfaces/types
- Shared types go in `common/types/` grouped by theme
- No "Interface" or "Type" suffix in names (the I/T prefix is sufficient)

---

### Architecture Guidelines

#### `common/` - Technical Infrastructure

| Directory | Purpose | Examples |
|-----------|---------|----------|
| `database/` | Database connection | `PrismaService`, `PrismaModule` |
| `filters/` | Global exception filters | `RpcExceptionFilter` |
| `enums/` | Error codes & status | `ErrorCode` |
| `types/` | Shared type definitions | `IRpcErrorResponse` |

**Rule:** If it's used by multiple modules → `common/`

---

### Commit Conventions

This project follows the [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/#summary) specification.

**Format:** `<type>(<scope>): <description>`

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

**Examples:**
```bash
feat(email): add retry logic for failed emails
fix(template): resolve path traversal vulnerability
docs: update installation instructions
refactor(email): simplify error handling logic
```

---

## Integration with Gateway

### Gateway Side (NestJS)

```bash
# Install microservices
pnpm i --save @nestjs/microservices amqplib amqp-connection-manager
```

```typescript
// In your module
@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'RABBITMQ_TRANSPORT',
        transport: Transport.RMQ,
        options: {
          urls: [process.env.RABBITMQ_URL],
          queue: process.env.RABBITMQ_QUEUE || 'email_queue',
          queueOptions: {
            durable: true,
          },
        },
      },
    ]),
  ],
})

// In your service
@Inject('RABBITMQ_TRANSPORT') private rabbitClient: ClientProxy;

// Send a message (request/response)
await firstValueFrom(this.rabbitClient.send('send_email', payload));

// Emit an event (fire-and-forget)
this.rabbitClient.emit('send_email_async', payload);
```

### Available Message Patterns

| Pattern | Type | Description | Payload |
|---------|------|-------------|---------|
| `send_email` | `MessagePattern` (request/response) | Send an email and return the result | `SendEmailDto` |
| `send_email_async` | `EventPattern` (fire-and-forget) | Send an email without waiting for the result | `SendEmailDto` |

---

## License

[MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE)
