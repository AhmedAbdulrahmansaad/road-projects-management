CREATE TABLE percentage_statements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  statement_date DATE NOT NULL,
  item_description TEXT NOT NULL,
  planned_percentage DECIMAL(5, 2) NOT NULL CHECK (planned_percentage >= 0 AND planned_percentage <= 100),
  actual_percentage DECIMAL(5, 2) NOT NULL CHECK (actual_percentage >= 0 AND actual_percentage <= 100),
  notes TEXT,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_percentage_statements_project_id ON percentage_statements(project_id);
CREATE INDEX idx_percentage_statements_created_by ON percentage_statements(created_by);
CREATE INDEX idx_percentage_statements_date ON percentage_statements(statement_date DESC);
