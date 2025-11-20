CREATE TABLE performance_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_number TEXT NOT NULL,
  project_name TEXT NOT NULL,
  contractor_name TEXT NOT NULL,
  year INTEGER NOT NULL CHECK (year >= 2020 AND year <= 2100),
  month TEXT NOT NULL,
  contractor_score DECIMAL(10, 2) NOT NULL,
  yearly_weighted DECIMAL(10, 2) NOT NULL,
  difference DECIMAL(10, 2) NOT NULL,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_performance_contracts_created_by ON performance_contracts(created_by);
CREATE INDEX idx_performance_contracts_year ON performance_contracts(year DESC);
CREATE INDEX idx_performance_contracts_contract_number ON performance_contracts(contract_number);
