CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'المدير العام', 'General Manager',
    'مدير عام الفرع', 'Branch General Manager',
    'المدير الإداري', 'Admin Manager',
    'المهندس المشرف', 'Supervising Engineer',
    'المهندس', 'Engineer',
    'المراقب', 'Observer'
  )),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
