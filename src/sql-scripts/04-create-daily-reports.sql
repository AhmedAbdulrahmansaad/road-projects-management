CREATE TABLE daily_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  report_date DATE NOT NULL,
  weather TEXT NOT NULL,
  work_description TEXT NOT NULL,
  workers_count INTEGER NOT NULL CHECK (workers_count >= 0),
  equipment_used TEXT,
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_daily_reports_project_id ON daily_reports(project_id);
CREATE INDEX idx_daily_reports_created_by ON daily_reports(created_by);
CREATE INDEX idx_daily_reports_date ON daily_reports(report_date DESC);
