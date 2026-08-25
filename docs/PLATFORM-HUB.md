# SIRA Platform Hub

## Objective

SIRA Platform Hub is the central control center for applications and platforms
built or operated by SIRA Solutions.

The Business Manager remains responsible for business operations, while the
Platform Hub is responsible for platform registration, monitoring, health,
version visibility and controlled administration.

## Initial connected platforms

- SIRA Business Manager
- Smart Xhamia
- Invoice App
- Client portals
- Future company platforms

Each platform remains technically independent, with its own codebase,
database, deployment lifecycle and users.

## Core rule

Connected platforms must not share unrestricted direct database access.

Communication should happen through secured and versioned platform APIs.

Example endpoints:

```text
/api/platform/v1/health
/api/platform/v1/status
/api/platform/v1/version
/api/platform/v1/metrics
/api/platform/v1/modules
/api/platform/v1/backups
```

## Monitoring capabilities

For each platform, the Hub should support:

- platform name and type;
- owning organization;
- environment;
- domain and base URL;
- current version;
- online/offline status;
- API health;
- database health;
- storage health;
- active users;
- module status;
- last deployment;
- last successful backup;
- warning and critical error counts;
- last successful communication.

## Management levels

### Level 1 — Monitoring

- online/offline status;
- health checks;
- version visibility;
- backup status;
- deployment history;
- error visibility;
- module visibility.

### Level 2 — Controlled management

- enable maintenance mode;
- trigger a health recheck;
- retry a failed background job;
- send administrator notifications;
- view selected logs;
- manage approved configuration values;
- enable or disable approved modules.

### Level 3 — Advanced operations

- deploy a new version;
- rollback a release;
- restart a service;
- manage licenses;
- create organizations;
- manage global integrations;
- manage AI usage;
- manage domains;
- initiate recovery workflows.

Advanced operations require stronger permissions, confirmation and audit logging.

## Suggested data model

### platforms

```text
id
name
code
organization_id
platform_type
base_url
environment
version
status
health_endpoint
api_key_reference
last_seen_at
created_at
updated_at
```

### platform_health_checks

```text
id
platform_id
status
response_time_ms
database_status
storage_status
reported_version
checked_at
error_message
```

### platform_actions

```text
id
platform_id
actor_user_id
action
request_data
result_status
result_message
created_at
```

## Security

Every connected platform should authenticate through one of:

- service account;
- API key;
- OAuth client credentials;
- signed request.

Secrets must not be stored as plain text. The Hub should store only encrypted
secret references or references to a secret manager.

Every remote action must record:

- actor;
- target platform;
- action;
- timestamp;
- result;
- request correlation ID.

## Smart Xhamia

Smart Xhamia should be the first external platform connected to the Hub.

Initial integration:

- online/offline state;
- version;
- domain;
- database status;
- last backup;
- last deployment;
- active users;
- module status;
- error count.

Later capabilities:

- maintenance mode;
- module management;
- organization settings;
- log visibility;
- backup management;
- controlled deployment actions.

## Platform separation

Recommended model:

```text
SIRA Business Manager
→ manages SIRA Solutions business operations

SIRA Platform Hub
→ monitors and manages connected platforms

Smart Xhamia
→ independent mosque management platform

Invoice App
→ independent invoicing platform
```

Shared standards may include:

- SIRA Identity;
- SIRA API contracts;
- SIRA Monitoring;
- SIRA Notifications;
- SIRA AI;
- SIRA Licensing.

The platforms should remain isolated even when they share standards or services.
