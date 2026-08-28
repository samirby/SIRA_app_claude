-- SIRA App v0.14.6 (plotësim)
-- Kodi i ri (project.service.ts, FIXED_PROJECT_PHASES) i jep emrat e rinj universalë
-- (Ide / Ndërtim / Implementim & Testim / Publikim & Përfundim) VETËM projekteve TË REJA,
-- të krijuara pas 0.14.6. Ky migrim riemërton fazat te projektet EKZISTUESE (që kishin
-- emra të vjetër, sipas llojit të projektit ose emrave fillestarë të Kanban-it), duke
-- përputhur çdo fazë me pozicionin e saj (sort_order 0-3) me emrin e ri universal.
-- S'ndryshon statusin e fazave apo detyrave — vetëm emrin dhe përshkrimin.

UPDATE project_milestones
SET name = 'Ide', description = 'Kërkesat, materialet dhe plani fillestar'
WHERE sort_order = 0;

UPDATE project_milestones
SET name = 'Ndërtim', description = 'Realizimi i punës'
WHERE sort_order = 1;

UPDATE project_milestones
SET name = 'Implementim & Testim', description = 'Vendosja dhe kontrolli i cilësisë'
WHERE sort_order = 2;

UPDATE project_milestones
SET name = 'Publikim & Përfundim', description = 'Dorëzimi te klienti'
WHERE sort_order = 3;
