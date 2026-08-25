# Module Standard

Each module must contain:
- schema / validation
- types
- repository
- service
- API routes
- UI pages/components
- permissions
- audit events
- tests

No module may access another module's tables directly without a defined service contract.
