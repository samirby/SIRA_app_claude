ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS project_milestone_id BIGINT UNSIGNED NULL AFTER project_id;

ALTER TABLE tasks
  ADD INDEX IF NOT EXISTS idx_tasks_project_milestone (organization_id, project_id, project_milestone_id);

ALTER TABLE tasks
  ADD CONSTRAINT fk_tasks_project_milestone
    FOREIGN KEY (project_milestone_id) REFERENCES project_milestones(id) ON DELETE SET NULL;
