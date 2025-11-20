CREATE OR REPLACE FUNCTION get_projects_count_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
BEGIN
  RETURN QUERY
  SELECT p.status, COUNT(*)::BIGINT
  FROM projects p
  GROUP BY p.status;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION get_recent_activities(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  id UUID,
  activity_type TEXT,
  description TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    'project'::TEXT as activity_type,
    p.project_name as description,
    p.created_at
  FROM projects p
  UNION ALL
  SELECT 
    dr.id,
    'daily_report'::TEXT,
    'تقرير يومي: ' || pr.project_name,
    dr.created_at
  FROM daily_reports dr
  JOIN projects pr ON dr.project_id = pr.id
  ORDER BY created_at DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;
