ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE percentage_statements ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all for service role" ON users FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON projects FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON daily_reports FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON percentage_statements FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON performance_contracts FOR ALL USING (true);
CREATE POLICY "Enable all for service role" ON notifications FOR ALL USING (true);
