-- 032: Habilitar RLS en plan_views y restringir acceso a nutricionistas propios
ALTER TABLE plan_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nutricionistas ven sus propias visualizaciones" ON plan_views
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM nutrition_plans np
      WHERE np.id = plan_views.plan_id
      AND np.nutritionist_id = (SELECT auth.uid())
    )
  );

-- Permitir inserciones anónimas desde la PWA del paciente (sin auth)
CREATE POLICY "Inserción anónima de visualizaciones" ON plan_views
  FOR INSERT WITH CHECK (true);
