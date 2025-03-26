# Shamiri - Personal Journaling Application

Shamiri is a feature-rich journaling application built with Next.js that allows users to create, manage, and organize journal entries with AI-powered insights.

## Features

- **Rich Text Editor**: Express yourself with markdown, formatting, and more
- **Daily Inspiration**: Get inspired with daily prompts and mood-based imagery
- **Secure & Private**: Enterprise-grade security for your personal thoughts
- **AI Insights**: Get personalized feedback and analysis on your journal entries
- **Category Management**: Organize journal entries by categories

## Tech Stack

- **Frontend**: Next.js, React, TailwindCSS, Radix UI(Shadcn)
- **Backend**: Next.js API Routes (Server Actions)
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: Clerk
- **AI**: OpenAI integration (using openrouter)
- **Protection**: Arcjet for rate limiting, bot detection and request shielding

## Getting Started

### Prerequisites

- Node.js 18+
- PNPM (recommended) or NPM
- PostgreSQL database (NeonDB/Supabase)
- Clerk account for authentication
- OpenAI API key
- Arcjet account (for security features)

### Environment Setup

Create a `.env` file in the root directory with the following variables:

```
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/shamiri"

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# OpenAI
OPENROUTER_API_KEY=sk-...

# Arcjet (Security)
ARCJET_KEY=aj_...

# Image API (Optional)
PIXABAY_API_KEY=...
```

### Installation

```bash
# Install dependencies
pnpm install

# Generate Prisma client
pnpm postinstall

# Run development server with Turbopack
pnpm dev

# OR standard Next.js dev server
next dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the application.

### Build for Production

```bash
# Build the application
pnpm build

# Start the production server
pnpm start
```

## Database Setup

The application uses Prisma ORM to interact with a PostgreSQL database.

```bash
# Apply migrations
npx prisma migrate dev

# Seed database with initial data (if available)
npx prisma db seed
```

## Database Schema

Below is the entity relationship diagram showing the database structure and relationships:

![Database Schema](./db_diagram/schema.svg)

## API Documentation

### Authentication

All protected routes require authentication via Clerk. The middleware checks authentication for routes matching:

- `/dashboard(.*)`
- `/category(.*)`
- `/journal(.*)`

### Journal Entries API

#### Create Journal Entry

```js
// POST /api/journal
createJournalEntry({
  title: string,
  content: string,
  mood: string,
  categoryId?: string,
  moodScore?: number,
  moodQuery?: string
})
```

#### Get Journal Entries

```js
// GET /api/journal
getJournalEntries({
  categoryId?: string,
  orderBy: 'desc' | 'asc' = 'desc'
})
```

#### Get Single Journal Entry

```js
// GET /api/journal/:id
getJournalEntry(id: string)
```

#### Update Journal Entry

```js
// PATCH /api/journal/:id
updateJournalEntry({
  id: string,
  title?: string,
  content?: string,
  mood?: string,
  categoryId?: string
})
```

#### Delete Journal Entry

```js
// DELETE /api/journal/:id
deleteJournalEntry(id: string)
```

#### Save Draft

```js
// POST /api/journal/draft
saveDraft({
  title: string,
  content: string,
  mood: string,
  categoryId?: string
})
```

#### Get Draft

```js
// GET /api/journal/draft
getDraft();
```

#### Ask AI About Journals

```js
// POST /api/journal/:id/ai
askAIAboutJournals(questions: string[], responses: string[], id: string)
```

### Categories API

#### Create Category

```js
// POST /api/category
createCategory({
  name: string,
  description?: string
})
```

#### Get Categories

```js
// GET /api/category
getCategories();
```

#### Get Single Category

```js
// GET /api/category/:id
getCategory(id: string)
```

#### Delete Category

```js
// DELETE /api/category/:id
deleteCategory(id: string)
```

### Public API

#### Get Daily Prompt

```js
// GET /api/public/dailyPrompt
getDailyPrompt();
```

#### Get Pixabay Image

```js
// GET /api/public/pixabay
getPixabayImage(query: string)
```

## Project Structure

```
shamiri/
├── actions/           # Server actions
├── app/               # Next.js app directory
│   ├── (auth)/        # Authentication routes
│   ├── (main)/        # Main application routes
│   ├── api/           # API routes
│   └── lib/           # Client-side utilities
├── components/        # React components
├── hooks/             # Custom React hooks
├── lib/               # Server-side utilities
└── prisma/            # Database schema and migrations
```

## Technical Decision Log

### 1. Authentication Implementation (Clerk vs Custom Auth)

**Problem**: Needed a secure, scalable authentication system with minimal maintenance overhead.

**Options Considered**:

- Custom authentication with JWT
- Auth0
- Clerk
- NextAuth.js

**Decision**: Implemented Clerk for authentication

**Rationale**:

- Built-in user management dashboard
- First-class Next.js support with middleware and components
- Handles complex auth flows (MFA, social login) out of the box
- Better developer experience compared to Auth0
- More features than NextAuth.js with similar ease of use

**Trade-offs**:

- (+) Reduced development time and maintenance burden
- (+) Enterprise-grade security features included
- (-) Vendor lock-in
- (-) Higher cost at scale compared to custom solution

### 2. AI Integration Architecture (OpenRouter vs Direct OpenAI)

**Problem**: Needed reliable AI capabilities while managing costs and maintaining flexibility.

**Options Considered**:

- Direct OpenAI API integration
- OpenRouter as middleware
- Self-hosted open-source models

**Decision**: Implemented OpenRouter as AI middleware

**Rationale**:

- Access to multiple models through single API
- Better pricing compared to direct OpenAI usage
- Fallback options if one model is unavailable
- Simplified API with consistent interface

**Trade-offs**:

- (+) Cost optimization through model selection
- (+) Increased reliability with fallback options
- (-) Additional dependency in architecture
- (-) Slightly higher latency due to extra hop

### 3. Database Schema Design (Current vs Denormalized)

**Problem**: Needed to balance data integrity with query performance for journal entries.

**Options Considered**:

- Current normalized schema with separate tables
- Denormalized schema with embedded data
- Hybrid approach with selective denormalization

**Decision**: Implemented normalized schema with strategic indexes

**Rationale**:

- Clear data relationships and integrity
- Efficient category management
- Better data consistency
- Easier to extend with new features

**Trade-offs**:

- (+) Data consistency and integrity
- (+) Flexible querying capabilities
- (-) More complex queries for nested data
- (-) Slightly higher storage overhead

## System Design

### Architecture Overview

```mermaid
graph TD
    Client[Client Browser] --> CDN[CDN/Edge Cache]
    CDN --> LB[Load Balancer]
    LB --> WebApp[Next.js Web App]
    WebApp --> Cache[Redis Cache]
    WebApp --> Queue[Message Queue]
    WebApp --> |Write| DB[(PostgreSQL Main)]
    DB --> DBReplica[(DB Replicas)]
    DBReplica --> |Read| WebApp
    DBReplica --> |Read| WebApp
    Queue --> Workers[Background Workers]
    Workers --> AI[AI Service]
    Workers --> Storage[Object Storage]

    style WebApp fill:#afe,stroke:#333
    style Cache fill:#fff,stroke:#333
    style DB fill:#fff,stroke:#333
```

### Component Details

#### Edge Layer

- CloudFlare CDN for static assets and edge caching
- Edge functions for authentication and basic validations
- Global distribution for low-latency access

#### Application Layer

- Horizontally scalable Next.js instances
- Server Components for optimized rendering
- Distributed caching with Redis clusters
- Message queue for async operations (Bull MQ)

#### Database Layer

- PostgreSQL with read replicas
- Horizontal sharding by user_id
- Materialized views for analytics
- Automatic archiving of old entries

#### Storage Layer

- S3-compatible object storage for media
- Separate hot/cold storage tiers
- CDN integration for media delivery

### Data Model Optimization

#### Sharding Strategy

```
users_shard_XX
- Sharded by user_id hash
- Each shard contains max 100k users

journals_shard_XX
- Sharded by user_id hash
- Rolling partitions by date
- Automatic archival after 12 months
```

#### Caching Strategy

- L1: Edge Cache (1 minute TTL)
- L2: Application Cache (5 minutes TTL)
- L3: Database Cache (15 minutes TTL)
- Write-through with async invalidation

### Security Measures

1. **Infrastructure Security**

   - WAF for request filtering
   - DDoS protection at edge
   - Network isolation with private subnets
   - Regular security scanning

2. **Data Security**

   - Encryption at rest (AES-256)
   - Encryption in transit (TLS 1.3)
   - Key rotation every 30 days
   - Audit logging for all data access

3. **Application Security**
   - Rate limiting per user/IP
   - Input sanitization at edge
   - CSRF/XSS protection
   - Regular dependency audits

### Scaling Considerations

#### Current Limits

- 1000 req/sec per instance
- 100ms p95 latency target
- 1TB total data per shard
- 10k daily active users per instance

#### Scaling to 1M+ Users

1. **Database Scaling**

   - Implement 20+ database shards
   - Add read replicas per shard
   - Introduce query optimization layer
   - Implement cross-shard queries

2. **Application Scaling**

   - Auto-scaling groups in multiple regions
   - Sticky sessions for websocket support
   - Regional deployment with global routing
   - Separate API and web servers

3. **Cache Scaling**
   - Redis cluster with 3+ nodes
   - Cache warming for popular content
   - Predictive caching based on usage
   - Regional cache instances

### Potential Bottlenecks

1. **Database Operations**

   - Solution: Read replicas and query optimization
   - Materialized views for heavy queries
   - Automatic index management

2. **AI Processing**

   - Solution: Async processing via queue
   - Batch processing for analysis
   - Caching of AI responses
   - Rate limiting per user

3. **Media Storage**
   - Solution: CDN with regional edge caching
   - Automatic image optimization
   - Progressive loading
   - Selective replication

### Future Optimizations

1. **Real-time Features**

   - WebSocket clusters for live updates
   - Redis Pub/Sub for notifications
   - Event-driven architecture

2. **Analytics Pipeline**

   - Separate analytics database
   - Real-time aggregation
   - Machine learning pipeline
   - Predictive user insights

3. **Global Expansion**
   - Multi-region deployment
   - Data residency compliance
   - Translation and localization
   - Regional API endpoints

## License

[Add your license information here]

## Contributors

[Add contributor information here]
