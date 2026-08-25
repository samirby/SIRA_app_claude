# Environments

Local:
- localhost
- local database
- demo data
- no production secrets

Development:
- develop branch
- development services

Staging:
- production-like test environment
- isolated staging database
- migrations and integrations tested here

Production:
- main branch / release tags
- real customer data
- controlled migrations and rollback

Recommended flow:
feature branch → develop → staging → main → production
