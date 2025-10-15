-----------------------------------------------------------------------------------------------------------
---------------------------------------Seccion localidades/barrios-----------------------------------------
-----------------------------------------------------------------------------------------------------------

-- ==========================================
--  11. TABLA: Localidades
--  Contiene las divisiones geográficas mayores.
-- ==========================================
-- 1. Localidad Riomar
-- 2. Localidad Norte-Centro Histórico
-- 3. Localidad Suroccidente
-- 4. Localidad Suroriente
-- 5. Localidad Metropolitana
-- 6. Todas
----- COMPLETADO CSV -----
CREATE TABLE localidades (
    id_localidad SERIAL PRIMARY KEY,
    nombre_localidad VARCHAR(100) NOT NULL UNIQUE,
    geom_localidad GEOMETRY(MULTIPOLYGON, 4326),  -- Geometría con SRID 4326 (WGS84)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
--  12. TABLA: Barrios
--  Contiene subdivisiones dentro de una localidad.
-- (Actualizar barrios)
-- ==========================================
BEGIN;

-- 1️⃣ Renombrar columnas para ajustarlas a la nueva estructura
ALTER TABLE public.barrios RENAME COLUMN gid TO id_barrio;
ALTER TABLE public.barrios RENAME COLUMN name TO nombre_barrio;
ALTER TABLE public.barrios RENAME COLUMN area_has TO superficie_ha;
ALTER TABLE public.barrios RENAME COLUMN geom TO geom_barrio;

-- 2️⃣ Eliminar columnas innecesarias
ALTER TABLE public.barrios 
    DROP COLUMN id,
    DROP COLUMN nombre,
    DROP COLUMN objectid_1;

-- 3️⃣ Agregar las columnas nuevas
ALTER TABLE public.barrios
    ADD COLUMN numero_habitantes INT NULL,
    ADD COLUMN numero_predios INT NULL,
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

-- 4️⃣ Corregir la geometría (tu shapefile tiene 3D, así que forzamos a 2D para evitar errores)
ALTER TABLE public.barrios 
    ALTER COLUMN geom_barrio TYPE geometry(MULTIPOLYGON, 4326)
    USING ST_Force2D(ST_SetSRID(geom_barrio, 4326));

-- 5️⃣ Asegurar clave primaria correcta
ALTER TABLE public.barrios DROP CONSTRAINT IF EXISTS barrios_pkey;
ALTER TABLE public.barrios ADD CONSTRAINT barrios_pkey PRIMARY KEY (id_barrio);
-- ==========================================
--  13. TABLA: Localidades_Barrios
--  Relación explícita N:M entre Localidades y Barrios.
--  (Aunque normalmente un barrio pertenece a una sola localidad, esto deja flexibilidad).
-- ==========================================
----- PENDIENTE CSV -----
CREATE TABLE localidades_barrios (
    id_localidad INT NOT NULL REFERENCES localidades(id_localidad)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_barrio INT NOT NULL REFERENCES barrios(id_barrio)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    PRIMARY KEY (id_localidad, id_barrio)
);

-- ==========================================
--  14.TABLA: Proyecto_estado
--  Define los estados generales de un proyecto 
-- ==========================================
-- 1. Formulación
-- 2. Precontractual
-- 2. Contractual
-- 3. Postcontractual
----- COMPLETADO CSV -----
CREATE TABLE proyecto_estado (
    id_proyecto_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
--  15. TABLA: Proyecto_subestado
--  Subcategorías del estado, asociadas al proyecto_estado.
-- ==========================================
-- 1. Formulación
    -- 1.1. Proyecto fase I prefactibilidad
    -- 1.2. Proyecto fase II factibilidad
    -- 1.3. Proyecto fase II diseños definitivos y detalles
-- 2. Precontractual
    -- 2.1. En_Estructuración
    -- 2.2. En_Convocatoria
    -- 2.3. Perfeccionamiento y Legalización
-- 3. Contractual
    -- 3.1. En_Ejecución
    -- 3.2. Suspendido
    -- 3.3. Terminado
-- 4. Postcontractual
    -- 4.1. Terminado
    -- 4.2. Entregado
    -- 4.3. Liquidado
----- COMPLETADO CSV -----

CREATE TABLE proyecto_subestado (
    id_proyecto_subestado SERIAL PRIMARY KEY,
    id_proyecto_estado INT REFERENCES proyecto_estado(id_proyecto_estado)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    nombre_subestado VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_subestado_por_estado UNIQUE (id_proyecto_estado, nombre_subestado)
);

-- ==========================================
--  16. TABLA: Proyectos
--  Contiene la información general del proyecto.
-- ==========================================
----- PENDIENTE CSV -----

CREATE TABLE proyectos (
    id_proyecto SERIAL PRIMARY KEY,
    id_programa INT REFERENCES programas(id_programa)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    id_proyecto_estado INT REFERENCES proyecto_estado(id_proyecto_estado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    id_proyecto_subestado INT REFERENCES proyecto_subestado(id_proyecto_subestado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    direccion TEXT,
    geom_proyecto GEOMETRY(POINT, 4326),          -- Coordenada principal del proyecto
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
--  17. TABLA: Proyectos_Barrios
--  Relación N:M entre proyectos y barrios.
--  Un proyecto puede impactar varios barrios.
-- ==========================================
----- PENDIENTE CSV -----

CREATE TABLE proyectos_barrios (
    id_proyecto INT NOT NULL REFERENCES proyectos(id_proyecto)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_barrio INT NOT NULL REFERENCES barrios(id_barrio)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id_proyecto, id_barrio)
);

-- ============================================
-- 18. TABLA: tipos_asociacion
-- Contiene los tipos o clasificaciones de asociaciones.
-- ============================================
-- 1. Consorcio
-- 2. Union temporal
----- PENDIENTE CSV -----
CREATE TABLE tipos_asociacion (
    id_tipo_asociacion SERIAL PRIMARY KEY,           -- Identificador único
    nombre_tipo_de_asociacion VARCHAR(100) NOT NULL -- Nombre del tipo de asociación
);

-- ============================================
-- 19. TABLA: asociaciones
-- Registra las asociaciones con su NIT y nombre.
-- Cada asociación pertenece a un tipo.
-- ============================================
----- PENDIENTE CSV -----

CREATE TABLE asociaciones (
    id_asociacion SERIAL PRIMARY KEY,         -- Identificador único
    nit VARCHAR(14) UNIQUE NOT NULL,          -- Número de identificación tributaria
    nombre_asociacion TEXT NOT NULL,          -- Nombre de la asociación
    id_tipo_asociacion INT NOT NULL,          -- FK al tipo de asociación
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_asociacion_tipo
        FOREIGN KEY (id_tipo_asociacion)
        REFERENCES tipos_asociacion (id_tipo_asociacion)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================
-- 20. TABLA: tipo_persona
-- Clasifica los tipos de persona dentro del sistema.
-- ============================================
-- 1. Natural
-- 2. Jurídica
----- COMPLETADO CSV -----

CREATE TABLE tipo_persona (
    id_tipo_persona SERIAL PRIMARY KEY,       -- Identificador único
    nombre_tipo_persona VARCHAR(30) NOT NULL  -- Nombre del tipo de persona
);

-- ============================================
-- 21. TABLA: personas
-- Almacena la información básica de las personas.
-- Incluye FK a tipo_persona.
-- ============================================
----- PENDIENTE CSV -----

CREATE TABLE personas (
    id_persona SERIAL PRIMARY KEY,                  -- Identificador único
    nombre_persona VARCHAR(100) NOT NULL,           -- Nombre de la persona
    numero_identificacion VARCHAR(20) UNIQUE NOT NULL, -- Documento o NIT
    id_tipo_persona INT NOT NULL,                   -- FK al tipo de persona
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_persona_tipo
        FOREIGN KEY (id_tipo_persona)
        REFERENCES tipo_persona (id_tipo_persona)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);

-- ============================================
-- 22. TABLA: miembros_asociacion
-- Relaciona personas con asociaciones, indicando su porcentaje de participación.
-- ============================================
----- PENDIENTE CSV -----

CREATE TABLE miembros_asociacion (
    id_miembros_asociacion SERIAL PRIMARY KEY,      -- Identificador único
    id_persona INT NOT NULL,                        -- FK a persona
    id_asociacion INT NOT NULL,                     -- FK a asociación
    porcentaje_participacion DECIMAL(5,2) CHECK (porcentaje_participacion >= 0 AND porcentaje_participacion <= 100),
    UNIQUE (id_persona, id_asociacion),             -- Evita duplicidad
    CONSTRAINT fk_miembro_persona
        FOREIGN KEY (id_persona)
        REFERENCES personas (id_persona)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_miembro_asociacion
        FOREIGN KEY (id_asociacion)
        REFERENCES asociaciones (id_asociacion)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================
-- 23. TABLA: contratista
-- Registra a las personas contratistas, que pueden estar asociadas a una asociación.
-- ============================================
----- PENDIENTE CSV -----

CREATE TABLE contratista (
    id_contratista SERIAL PRIMARY KEY,        -- Identificador único
    id_persona INT NOT NULL,                  -- FK a persona
    id_asociacion INT,                        -- FK opcional a asociación (puede ser NULL)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT fk_contratista_persona
        FOREIGN KEY (id_persona)
        REFERENCES personas (id_persona)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    CONSTRAINT fk_contratista_asociacion
        FOREIGN KEY (id_asociacion)
        REFERENCES asociaciones (id_asociacion)
        ON UPDATE CASCADE
        ON DELETE SET NULL
);


-- ============================================
-- TABLAS DE AVANCES Y SEGUIMIENTOS
-- ============================================

-- 24. Tipos de avance
-- 1. Avance fisico
-- 2. Avance financiero
----- COMPLETADO CSV -----

CREATE TABLE tipos_avance (
    id_tipo_avance SERIAL PRIMARY KEY,
    nombre_tipo_avance VARCHAR(100) NOT NULL UNIQUE
);

-- 25. Avances
----- PENDIENTE CSV -----

CREATE TABLE avances (
    id_avance SERIAL PRIMARY KEY,
    id_tipo_avance INT NOT NULL REFERENCES tipos_avance(id_tipo_avance) ON DELETE CASCADE,
    id_usuario INT NOT NULL,  -- Se asume referencia a una tabla usuarios
    id_proyecto INT NOT NULL, -- Se asume referencia a una tabla proyectos
    porcentaje_avance DECIMAL(5,2) DEFAULT 0 CHECK (porcentaje_avance >= 0 AND porcentaje_avance <= 100),
    porcentaje_programado DECIMAL(5,2) DEFAULT 0 CHECK (porcentaje_programado >= 0 AND porcentaje_programado <= 100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 26.Tipos de seguimiento
-- 1. Actividad
-- 2. Ruta critica
----- COMPLETADO CSV -----

CREATE TABLE tipos_seguimiento (
    id_tipo_seguimiento SERIAL PRIMARY KEY,
    nombre_tipo_seguimiento VARCHAR(100) NOT NULL UNIQUE
);

-- 27. Estados de seguimiento
----- PENDIENTE CSV -----
----- PREGUNTAR A LUCHO -----
CREATE TABLE estados_seguimientos (
    id_estado_seguimiento SERIAL PRIMARY KEY,
    nombre_estado_seguimiento VARCHAR(100) NOT NULL UNIQUE
);

-- 28. Seguimientos
----- PENDIENTE CSV -----

CREATE TABLE seguimientos (
    id_seguimiento SERIAL PRIMARY KEY,
    titulo VARCHAR(255) NOT NULL,
    descripcion TEXT,
    id_usuario INT NOT NULL,  -- referencia a usuarios
    id_tipo_seguimiento INT NOT NULL REFERENCES tipos_seguimiento(id_tipo_seguimiento) ON DELETE RESTRICT,
    id_estado_seguimiento INT NOT NULL REFERENCES estados_seguimientos(id_estado_seguimiento) ON DELETE RESTRICT,
    id_proyecto INT NOT NULL,  -- referencia a proyectos
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);