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


CREATE OR REPLACE VIEW vista_resumen_dashboard AS
SELECT
    -- ✅ Cuenta todos los proyectos excepto los que están en estado Postcontractual
    COUNT(*) FILTER (WHERE p.id_proyecto_estado IS NOT NULL AND p.id_proyecto_estado <> (
        SELECT id_proyecto_estado FROM proyecto_estado WHERE LOWER(nombre_estado) = 'postcontractual' LIMIT 1
    )) AS total_proyectos_activos,

    -- ✅ Total de sectores distintos
    COUNT(DISTINCT s.id_sector) AS total_sectores,

    -- ✅ Presupuesto total (en billones)
    ROUND(SUM(CAST(p.valor_inicial_obra AS NUMERIC)) / 1000000000000, 2) AS presupuesto_total_billones
FROM proyectos p
LEFT JOIN programas pr ON pr.id_programa = p.id_programa
LEFT JOIN sectores s ON s.id_sector = pr.id_sector;


--- Resumen dashboard
CREATE OR REPLACE VIEW vista_resumen_proyectos AS
WITH conteo_por_estado AS (
    SELECT 
        pe.nombre_estado AS fase_proyecto,
        COUNT(p.id_proyecto) AS total_proyectos
    FROM proyectos p
    LEFT JOIN proyecto_estado pe 
        ON p.id_proyecto_estado = pe.id_proyecto_estado
    GROUP BY pe.nombre_estado
),
conteo_por_sector AS (
    SELECT 
        s.nombre_sector,
        COUNT(p.id_proyecto) AS total_proyectos,
        COUNT(*) FILTER (WHERE pe.nombre_estado = 'Formulacion') AS formulacion,
        COUNT(*) FILTER (WHERE pe.nombre_estado = 'Precontractual') AS precontractual,
        COUNT(*) FILTER (WHERE pe.nombre_estado = 'Contractual') AS contractual,
        COUNT(*) FILTER (WHERE pe.nombre_estado = 'Postcontractual') AS postcontractual
    FROM proyectos p
    LEFT JOIN programas prog 
        ON p.id_programa = prog.id_programa
    LEFT JOIN sectores s 
        ON prog.id_sector = s.id_sector
    LEFT JOIN proyecto_estado pe 
        ON p.id_proyecto_estado = pe.id_proyecto_estado
    GROUP BY s.nombre_sector
),
tasa_general AS (
    SELECT 
        COUNT(*) FILTER (WHERE pe.nombre_estado = 'Postcontractual')::numeric AS total_postcontractual,
        COUNT(*)::numeric AS total_proyectos,
        ROUND(
            (COUNT(*) FILTER (WHERE pe.nombre_estado = 'Postcontractual')::numeric / 
             NULLIF(COUNT(*), 0)) * 100, 2
        ) AS tasa_exito_general
    FROM proyectos p
    LEFT JOIN proyecto_estado pe 
        ON p.id_proyecto_estado = pe.id_proyecto_estado
)
SELECT 
    json_build_object(
        'proyectos_por_fase', (
            SELECT json_agg(
                json_build_object(
                    'fase_proyecto', fase_proyecto,
                    'total_proyectos', total_proyectos
                )
            )
            FROM conteo_por_estado
        ),
        'proyectos_por_sector', (
            SELECT json_agg(
                json_build_object(
                    'nombre_sector', nombre_sector,
                    'total_proyectos', total_proyectos,
                    'formulacion', formulacion,
                    'precontractual', precontractual,
                    'contractual', contractual,
                    'postcontractual', postcontractual
                )
            )
            FROM conteo_por_sector
        ),
        'tasa_exito_general', (
            SELECT tasa_exito_general FROM tasa_general
        )
    ) AS resumen
FROM tasa_general;


CREATE OR REPLACE VIEW vw_resumen_sectores AS
SELECT 
    s.id_sector,
    s.nombre_sector,
    
    COUNT(p.id_proyecto) AS total_proyectos,

    COUNT(*) FILTER (
        WHERE pe.nombre_estado ILIKE '%contractual%'
    ) AS proyectos_contractuales,

    COUNT(*) FILTER (
        WHERE pe.nombre_estado ILIKE '%postcontractual%'
    ) AS proyectos_postcontractuales,

    COALESCE(SUM(p.valor_inicial_obra), 0) AS presupuesto_total

FROM sectores s
LEFT JOIN programas pr ON pr.id_sector = s.id_sector
LEFT JOIN proyectos p ON p.id_programa = pr.id_programa
LEFT JOIN proyecto_estado pe ON pe.id_proyecto_estado = p.id_proyecto_estado

GROUP BY s.id_sector, s.nombre_sector
ORDER BY s.nombre_sector;