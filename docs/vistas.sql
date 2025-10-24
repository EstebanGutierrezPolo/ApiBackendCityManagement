CREATE OR REPLACE VIEW vista_proyectos_detallada AS
SELECT
    p.id_proyecto,
    p.nombre_proyecto,
    s.nombre_sector,
    b.nombre_barrio,
    pe.nombre_estado AS estado_proyecto,
    p.valor_inicial_obra AS presupuesto_inicial
FROM proyectos p
-- Relación con programas
LEFT JOIN programas pr ON p.id_programa = pr.id_programa
-- Relación con sectores (a través de programas)
LEFT JOIN sectores s ON pr.id_sector = s.id_sector
-- Relación con el estado del proyecto
LEFT JOIN proyecto_estado pe ON p.id_proyecto_estado = pe.id_proyecto_estado
-- Relación con proyectos_barrios
LEFT JOIN proyectos_barrios pb ON p.id_proyecto = pb.id_proyecto
-- Relación con barrios
LEFT JOIN barrios b ON pb.id_barrio = b.id_barrio;