# SIRA-APP-v0.9.8

This release simplifies daily project management while retaining all existing data and advanced backend capabilities.

## Changes

- Three main tabs: Overview, Tasks and Documents
- Compact Phases module inside Overview
- Compact waiting reason instead of a separate blocker workspace
- Project notes and automatic history combined as Activity
- Finance summary retained in Overview
- Short project creation form with optional More details section
- Fixed collation-sensitive SQL comparisons used by phases, blockers and deliverable approvals

## Deployment

Deploy `SIRA-APP-v0.9.8.zip` and restart the Node.js application. No additional SQL import is needed when migration 011 from v0.9.7 was already imported.
