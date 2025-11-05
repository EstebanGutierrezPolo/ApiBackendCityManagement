-----------------------------------------------------------------------------------------------------------
------------------------------------  VACIADO GENERAL DE TABLAS  ----------------------------------------
-- Este script limpia todas las tablas, reinicia sus secuencias SERIAL
-- y mantiene la estructura, llaves primarias y foráneas.
-----------------------------------------------------------------------------------------------------------

-- 🔒 Desactivar temporalmente restricciones FK
SET session_replication_role = replica;

-- 🔽 Orden de vaciado: desde tablas hijas a tablas padre (dependencias al final)
TRUNCATE TABLE 
    seguimientos,
    estados_seguimientos,
    tipos_seguimiento,
    avances,
    tipos_avance,
    contratista,
    miembros_asociacion,
    personas,
    tipo_persona,
    asociaciones,
    tipos_asociacion,
    proyectos_barrios,
    proyectos,
    proyecto_subestado,
    proyecto_estado,
    localidades_barrios,
    barrios,
    localidades,
    programas,
    linea_estrategica_sectores,
    linea_estrategica,
    dependencias,
    sectores,
    usuarios,
    tipos_documento,
    estados_usuario,
    cargos,
    roles
RESTART IDENTITY CASCADE;

-- 🔓 Reactivar restricciones FK
SET session_replication_role = DEFAULT;

-----------------------------------------------------------------------------------------------------------
-- ✅ Confirmación
-----------------------------------------------------------------------------------------------------------
-----------------------------------------------------------------------------------------------------------