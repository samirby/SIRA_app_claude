# SIRA Quran Module v0.6.4

- Dashboard requests one random ayah on every page load.
- The `Ajeti tjetër` button loads another ayah without refreshing the page.
- Server endpoint: `GET /api/v1/quran/random`.
- Default Albanian edition: `sq.nahi` (configurable with `QURAN_EDITION`).
- If the external Quran service is unavailable, a small local fallback set is used.
- Arabic text is not shown in the Dashboard card.
- Source attribution is displayed in the card.

Future phase: import a licensed local Albanian dataset so all 6,236 ayahs remain available offline.
