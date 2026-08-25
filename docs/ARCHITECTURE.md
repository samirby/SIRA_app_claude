# SIRA Enterprise Architecture

SIRA uses a modular monolith architecture.

UI → API v1 → validation → service → repository → MySQL

Core principles:
- every business module is isolated;
- organization_id is required on business data;
- API routes are versioned;
- SQL stays in repositories;
- business rules stay in services;
- all inputs are validated;
- sensitive actions are audited;
- schema changes use numbered migrations;
- version 0.x remains active until the full core platform is complete.


## Platform Hub

SIRA includes a future Platform Hub capability for monitoring and managing
independent applications such as Smart Xhamia and other company platforms.

The Hub communicates through secured, versioned APIs and must not use
unrestricted direct access to connected platform databases.

See `docs/PLATFORM-HUB.md`.
