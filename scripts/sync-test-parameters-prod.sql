-- =============================================================================
-- AquaManager — sincronizar parâmetros de teste + faixas ideais (dev → produção)
-- =============================================================================
-- Uso: psql "$DATABASE_URL" -f scripts/sync-test-parameters-prod.sql
--
-- • Idempotente: pode rodar mais de uma vez (UPSERT por nome do parâmetro).
-- • Não apaga parâmetros que existem só em produção.
-- • Atualiza unidade/descrição e faixas ideais conforme o seed do projeto.
--
-- Depois de rodar, reavalie testes antigos no app: Parâmetros → editar → Salvar
-- (ou registre um novo teste de água) para corrigir alertas.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Parâmetros (test_parameters)
-- ---------------------------------------------------------------------------
INSERT INTO test_parameters (id, name, unit, description, created_at)
VALUES
  (gen_random_uuid(), 'pH', '—', 'Acidez/alcalinidade da água', NOW()),
  (gen_random_uuid(), 'Amônia (NH3/NH4)', 'ppm', 'Altamente tóxico para peixes', NOW()),
  (gen_random_uuid(), 'Nitrito (NO2)', 'ppm', 'Produto intermediário do ciclo do N', NOW()),
  (gen_random_uuid(), 'Nitrato (NO3)', 'ppm', 'Produto final, tóxico em altas conc.', NOW()),
  (gen_random_uuid(), 'KH', '°dH', 'Dureza carbonatada / capacidade tampão', NOW()),
  (gen_random_uuid(), 'GH', '°dH', 'Dureza geral', NOW()),
  (gen_random_uuid(), 'Temperatura', '°C', 'Faixa de conforto térmico', NOW()),
  (gen_random_uuid(), 'CO2', 'mg/L', 'Plantas precisam, peixes toleram', NOW()),
  (gen_random_uuid(), 'Oxigênio (O2)', 'mg/L', 'Essencial para fauna', NOW()),
  (gen_random_uuid(), 'Fosfato (PO4)', 'ppm', 'Nutriente / causador de algas', NOW()),
  (gen_random_uuid(), 'Ferro (Fe)', 'ppm', 'Essencial para plantas', NOW()),
  (gen_random_uuid(), 'Cobre (Cu)', 'ppm', 'Tóxico para invertebrados', NOW()),
  (
    gen_random_uuid(),
    'Salinidade',
    'densidade',
    'Escala SG×1000 (ex.: 1024 = densidade 1,024). Ideal marinho: 1024–1026.',
    NOW()
  ),
  (gen_random_uuid(), 'Cálcio (Ca)', 'ppm', 'Crítico para corais e invertebrados', NOW()),
  (gen_random_uuid(), 'Magnésio (Mg)', 'ppm', 'Estabiliza cálcio e alcalinidade', NOW()),
  (gen_random_uuid(), 'Alcalinidade (dKH)', 'dKH', 'Capacidade tampão (medida marinha)', NOW())
ON CONFLICT (name) DO UPDATE SET
  unit = EXCLUDED.unit,
  description = EXCLUDED.description;

-- ---------------------------------------------------------------------------
-- 2) Faixas ideais (parameter_ranges) — helper via INSERT ... SELECT
-- ---------------------------------------------------------------------------
-- water_type: FRESHWATER | SALTWATER | BRACKISH

-- pH
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 6.5, 7.5 FROM test_parameters tp WHERE tp.name = 'pH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 8.0, 8.4 FROM test_parameters tp WHERE tp.name = 'pH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 7.5, 8.3 FROM test_parameters tp WHERE tp.name = 'pH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Amônia (NH3/NH4)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0, 0.25 FROM test_parameters tp WHERE tp.name = 'Amônia (NH3/NH4)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 0, 0.1 FROM test_parameters tp WHERE tp.name = 'Amônia (NH3/NH4)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 0, 0.25 FROM test_parameters tp WHERE tp.name = 'Amônia (NH3/NH4)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Nitrito (NO2)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0, 0.25 FROM test_parameters tp WHERE tp.name = 'Nitrito (NO2)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 0, 0.1 FROM test_parameters tp WHERE tp.name = 'Nitrito (NO2)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 0, 0.25 FROM test_parameters tp WHERE tp.name = 'Nitrito (NO2)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Nitrato (NO3)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0, 40 FROM test_parameters tp WHERE tp.name = 'Nitrato (NO3)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 0, 20 FROM test_parameters tp WHERE tp.name = 'Nitrato (NO3)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 0, 30 FROM test_parameters tp WHERE tp.name = 'Nitrato (NO3)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- KH
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 3, 8 FROM test_parameters tp WHERE tp.name = 'KH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 7, 11 FROM test_parameters tp WHERE tp.name = 'KH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 5, 12 FROM test_parameters tp WHERE tp.name = 'KH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- GH
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 4, 12 FROM test_parameters tp WHERE tp.name = 'GH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 8, 20 FROM test_parameters tp WHERE tp.name = 'GH'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Temperatura
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 24, 28 FROM test_parameters tp WHERE tp.name = 'Temperatura'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 24, 27 FROM test_parameters tp WHERE tp.name = 'Temperatura'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 24, 28 FROM test_parameters tp WHERE tp.name = 'Temperatura'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- CO2 (só doce)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 15, 35 FROM test_parameters tp WHERE tp.name = 'CO2'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Oxigênio (O2)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 5, NULL FROM test_parameters tp WHERE tp.name = 'Oxigênio (O2)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 6, NULL FROM test_parameters tp WHERE tp.name = 'Oxigênio (O2)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Fosfato (PO4)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0.5, 2 FROM test_parameters tp WHERE tp.name = 'Fosfato (PO4)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 0, 0.03 FROM test_parameters tp WHERE tp.name = 'Fosfato (PO4)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Ferro (Fe) (só doce)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0.1, 0.5 FROM test_parameters tp WHERE tp.name = 'Ferro (Fe)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Cobre (Cu)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0, 0.03 FROM test_parameters tp WHERE tp.name = 'Cobre (Cu)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 0, 0.01 FROM test_parameters tp WHERE tp.name = 'Cobre (Cu)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Salinidade (densidade SG×1000)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'FRESHWATER'::"WaterType", 0, 1 FROM test_parameters tp WHERE tp.name = 'Salinidade'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 1024, 1026 FROM test_parameters tp WHERE tp.name = 'Salinidade'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'BRACKISH'::"WaterType", 5, 15 FROM test_parameters tp WHERE tp.name = 'Salinidade'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Cálcio (Ca) (só salgada)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 380, 450 FROM test_parameters tp WHERE tp.name = 'Cálcio (Ca)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Magnésio (Mg) (só salgada)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 1250, 1400 FROM test_parameters tp WHERE tp.name = 'Magnésio (Mg)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

-- Alcalinidade (dKH) (só salgada)
INSERT INTO parameter_ranges (id, test_parameter_id, water_type, ideal_min, ideal_max)
SELECT gen_random_uuid(), tp.id, 'SALTWATER'::"WaterType", 7, 11 FROM test_parameters tp WHERE tp.name = 'Alcalinidade (dKH)'
ON CONFLICT (test_parameter_id, water_type) DO UPDATE SET ideal_min = EXCLUDED.ideal_min, ideal_max = EXCLUDED.ideal_max;

COMMIT;

-- Conferência rápida
SELECT tp.name, tp.unit, pr.water_type, pr.ideal_min, pr.ideal_max
FROM test_parameters tp
LEFT JOIN parameter_ranges pr ON pr.test_parameter_id = tp.id
ORDER BY tp.name, pr.water_type;
