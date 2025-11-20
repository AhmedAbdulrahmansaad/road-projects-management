CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  location TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  consultant_name TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  contract_value DECIMAL(15, 2) NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('جاري العمل', 'منجز', 'متأخر', 'متقدم', 'متعثر', 'متوقف', 'تم الرفع بالاستلام الابتدائي', 'تم الاستلام النهائي')),
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_projects_created_by ON projects(created_by);
CREATE INDEX idx_projects_status ON projects(status);
CREATE INDEX idx_projects_project_number ON projects(project_number);