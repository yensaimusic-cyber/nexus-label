-- Create project_budgets table

CREATE TABLE IF NOT EXISTS project_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    label TEXT NOT NULL,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE project_budgets ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to project_budgets" ON project_budgets;
CREATE POLICY "Public access to project_budgets" ON project_budgets FOR ALL TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_project_budgets_project_id ON project_budgets(project_id);
CREATE INDEX IF NOT EXISTS idx_project_budgets_status ON project_budgets(status);
