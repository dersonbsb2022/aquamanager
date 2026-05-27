-- Salinidade marinha: escala densidade/SG×1000 (1024 = 1,024), não ppt
UPDATE test_parameters
SET
  unit = 'densidade',
  description = 'Escala SG×1000 (ex.: 1024 = densidade 1,024). Ideal marinho: 1024–1026.'
WHERE name = 'Salinidade';

UPDATE parameter_ranges pr
SET ideal_min = 1024, ideal_max = 1026
FROM test_parameters tp
WHERE pr.test_parameter_id = tp.id
  AND tp.name = 'Salinidade'
  AND pr.water_type = 'SALTWATER';

-- Recalcula is_within_range para valores já lançados em escala densidade
UPDATE water_test_results wtr
SET is_within_range = (wtr.value >= 1024 AND wtr.value <= 1026)
FROM test_parameters tp
WHERE wtr.test_parameter_id = tp.id
  AND tp.name = 'Salinidade'
  AND wtr.value >= 100;
