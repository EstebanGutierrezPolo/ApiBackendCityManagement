-----------------------------------------------------------------------------------------------------------
---------------------------------------Habilitar extensiones-----------------------------------------
-----------------------------------------------------------------------------------------------------------

------ EJECUTAR PRIMERO TABLA POLIGONOS -------
-----------------------------------------------------------------------------------------------------------
---------------------------------------Seccion Usuarios aplicativo-----------------------------------------
-----------------------------------------------------------------------------------------------------------

-- Tabla: roles - Define los roles (permisos) de los usuarios en la aplicación (Ej: Administrador, Alcalde, Consultor) 
----- (Por confirmar roles) -----.
-- 1. Super Admin - - - Los desarrolladores van a ser super admins
-- 2. Admin - - - El grupo de trabajo van a ser los Admin (Ellos subiran la data)
-- 3. Gerencial - - - Los gerenciales van a ser el Alcalde o la Gerente (Ellos van a tener una vista especial)
----- COMPLETADO CSV ----- 

CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY, -- Identificador único del rol (PK).
    nombre_rol VARCHAR(50) UNIQUE NOT NULL -- Nombre descriptivo del rol.
);

-- Tabla: cargos - Define los cargos que ocupan los usuarios dentro de la Alcaldía (Ej: Coordinador, Director de Proyecto) 
----- (Por confirmar cargos) ------.
-- 1. Alcalde
-- 2. Gerente
-- 3. Asesor - - - Todos los otros usuarios que no son el alcalde o la gerente
----- COMPLETADO CSV ----- 

CREATE TABLE cargos (
    id_cargo SERIAL PRIMARY KEY, -- Identificador único del cargo (PK).
    nombre_cargo TEXT UNIQUE NOT NULL -- Nombre completo del cargo.
);

-- 3. Tabla: estados_usuario - Define el estado actual de la cuenta de un usuario 
-- 1. Activo 
-- 2. Inactivo
-- 3. Bloqueado.
----- COMPLETADO CSV ----- 

CREATE TABLE estados_usuario (
    id_estado_usuario SERIAL PRIMARY KEY, -- Identificador único del estado (PK).
    nombre_estado_usuario VARCHAR(30) UNIQUE NOT NULL -- Nombre del estado.
);

-- 4. Tabla: tipos_documento - Define los tipos de documento de identificación 
-- 1. 'CÉDULA DE CIUDADANÍA'
-- 2. 'CÉDULA EXTRANJERA' 
-- 3. 'DOCUMENTO EXTRANJERO'
-- 4. 'PASAPORTE'
-- 5. 'REGISTRO CIVIL' 
-- 6.'TARJETA DE IDENTIDAD'.
-- 7. 'NIT'

----- COMPLETADO CSV -----
CREATE TABLE tipos_documento (
    id_tipo_documento SERIAL PRIMARY KEY, -- Identificador único del tipo de documento (PK).
    tipo_documento VARCHAR(100) UNIQUE NOT NULL -- Nombre del tipo de documento.
);

-- 5. Tabla: usuarios - Almacena la información de las cuentas de usuario que acceden al sistema.
----- PENDIENTE CSV -----

CREATE TABLE usuarios (
    id_usuario SERIAL PRIMARY KEY, -- Identificador único del usuario (PK).
    id_rol INT NOT NULL REFERENCES roles(id_rol) ON UPDATE CASCADE ON DELETE RESTRICT, -- FK a roles. Define el nivel de acceso.
    id_cargo INT REFERENCES cargos(id_cargo) ON UPDATE CASCADE ON DELETE SET NULL, -- FK a cargos. Cargo actual del usuario.
    id_estado_usuario INT REFERENCES estados_usuario(id_estado_usuario) ON UPDATE CASCADE ON DELETE SET NULL, -- FK a estados_usuario. Estado de la cuenta.
    id_tipo_documento INT REFERENCES tipos_documento(id_tipo_documento) ON UPDATE CASCADE ON DELETE RESTRICT, -- FK a tipos_documento.

    primer_nombre VARCHAR(50) NOT NULL,
    segundo_nombre VARCHAR(50), -- Segundo nombre (opcional).
    primer_apellido VARCHAR(50) NOT NULL,
    segundo_apellido VARCHAR(50), -- Segundo apellido (opcional).
    documento VARCHAR(20) NOT NULL, -- Número de identificación.
    email VARCHAR(150) UNIQUE NOT NULL, -- Correo electrónico único (para login y notificaciones).
    password_hashed VARCHAR(255) NOT NULL, -- Contraseña hasheada (cifrada).

    activo BOOLEAN DEFAULT TRUE, -- Bandera para indicar si la cuenta está activa lógicamente.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    UNIQUE (id_tipo_documento, documento) -- Restricción: No puede haber el mismo número de documento con el mismo tipo.
);

-----------------------------------------------------------------------------------------------------------
--------------Sectores/Dependencias/Linea estrategica/linea_estrategica_sectores/Programa------------------
-----------------------------------------------------------------------------------------------------------

-- ============================================
-- 6. TABLA: Sectores
-- Contiene los sectores institucionales a los que pueden pertenecer los programas
-- ============================================
-- 1. Agua_potable y saneamiento básico 
-- 2. Arroyos
-- 3. Cultura
-- 4. Desarrollo urbano
-- 5. EcoTurismo
-- 6. Educacion
-- 7. Energia sostenible
-- 8. Recreacion y deporte
-- 9. Salud
-- 10. Seguridad
-- 11. Transporte
-- 12. Vivienda
----- COMPLETADO CSV -----
CREATE TABLE sectores (
    id_sector SERIAL PRIMARY KEY,
    nombre_sector VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================
-- 7. TABLA: Dependencias
-- Define las dependencias o áreas responsables dentro de la organización
-- ============================================
-- 1. ADI
-- 2. EDUBAR
-- 3. Gerencia de ciudad
-- 4. IUB
-- 5. K-yena
-- 6. Obras publicas
-- 7. PDO
-- 8. Siembra+
----- COMPLETADO CSV -----
CREATE TABLE dependencias (
    id_dependencia SERIAL PRIMARY KEY,
    nombre_dependencia VARCHAR(100) NOT NULL UNIQUE
);

-- ============================================
-- 8. TABLA: Línea Estratégica
-- Contiene las líneas estratégicas de planeación institucional
-- ============================================
-- 1. Línea económica ciudad dinámica
-- 2. Línea social ciudad segura y solidaria
-- 3. Línea ambiental ciudad ambiental y sostenible
-- 4. Línea Político-administrativa gobierno eficiente y responsable
----- COMPLETADO CSV -----
CREATE TABLE linea_estrategica (
    id_linea_estrategica SERIAL PRIMARY KEY,
    nombre_linea_estrategica TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 9. TABLA: Línea Estratégica - Sectores (relación N:M)
-- Relaciona los sectores con sus líneas estratégicas correspondientes
-- ============================================
CREATE TABLE linea_estrategica_sectores (
    id_linea_estrategica INT NOT NULL,
    id_sector INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    PRIMARY KEY (id_linea_estrategica, id_sector),

    CONSTRAINT fk_linea_estrategica
        FOREIGN KEY (id_linea_estrategica)
        REFERENCES linea_estrategica(id_linea_estrategica)
        ON UPDATE CASCADE
        ON DELETE CASCADE,

    CONSTRAINT fk_sector
        FOREIGN KEY (id_sector)
        REFERENCES sectores(id_sector)
        ON UPDATE CASCADE
        ON DELETE CASCADE
);

-- ============================================
-- 10. TABLA: Programas
-- Cada programa pertenece a un sector y a una dependencia
-- ============================================
-- 1. Agua potable y saneamiento básico
-- 2. Arroyos
-- 3. Barrios a la obra
-- 4. CAI
-- 5. Colegios
-- 6. Conchas acusticas
-- 7. Consultoria
-- 8. EcoParque Mallorquin
-- 9. Edificaciones culturales 
-- 10. Eficiencia Energética
-- 11. Escenarios deportivos
-- 12. Estaciones
-- 13. Generacion
-- 14. Hospital
-- 15. Huertas
-- 16. Malecon
-- 17. Melecon de suroiente
-- 18. Malla vial
-- 19. Mantenimeinto y adecuacion
-- 20. Mejoramiento de viviendas
-- 21. Parques
-- 22. Recuperación Playas de Puerto Mocho
-- 23. Plazas de mercado
-- 24. Pasos
-- 25. SITP
-- 26. Tren turistico
-- 27. Transformacion de entornos urbanos
-- 28. SITP
-- 29. Transformacion de entornos urbanos
-- 30. Universidad
----- COMPLETADO CSV -----
CREATE TABLE programas (
    id_programa SERIAL PRIMARY KEY,
    nombre_programa VARCHAR(100) NOT NULL,
    id_sector INT NOT NULL,
    id_dependencia INT NOT NULL,

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT fk_sector_programa
        FOREIGN KEY (id_sector)
        REFERENCES sectores(id_sector)
        ON UPDATE CASCADE
        ON DELETE RESTRICT,

    CONSTRAINT fk_dependencia_programa
        FOREIGN KEY (id_dependencia)
        REFERENCES dependencias(id_dependencia)
        ON UPDATE CASCADE
        ON DELETE RESTRICT
);


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
-- CREATE TABLE localidades (
--     id_localidad SERIAL PRIMARY KEY,
--     nombre_localidad VARCHAR(100) NOT NULL UNIQUE,
--     geom_localidad GEOMETRY(MULTIPOLYGON, 4326),  -- Geometría con SRID 4326 (WGS84)
--     created_at TIMESTAMPTZ DEFAULT NOW(),
--     updated_at TIMESTAMPTZ DEFAULT NOW()
-- );
-- Renombrar la tabla
ALTER TABLE localidades_bq RENAME TO localidades;

-- Renombrar columnas para mantener consistencia
ALTER TABLE localidades
    RENAME COLUMN localidad TO nombre_localidad;

-- Renombrar columnas de área
ALTER TABLE localidades
    RENAME COLUMN area_has TO superficie_ha;

ALTER TABLE localidades
    RENAME COLUMN area_m2 TO superficie_m2;

-- Eliminar columnas innecesarias
ALTER TABLE localidades
    DROP COLUMN shape_leng,
    DROP COLUMN shape_area;

-- Renombrar la columna de geometría
ALTER TABLE localidades
    RENAME COLUMN geom TO geom_localidad;

-- Asegurar tipo correcto de geometría (MULTIPOLYGON con Z y SRID 4326)
ALTER TABLE localidades
    ALTER COLUMN geom_localidad TYPE geometry(MULTIPOLYGONZ, 4326)
    USING ST_Force3D(geom_localidad);

-- Agregar timestamps si no existen
ALTER TABLE localidades
    ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Renombrar la columna de ID
ALTER TABLE localidades
    RENAME COLUMN gid TO id_localidad;
-- ==========================================
--  12. TABLA: Barrios
--  Contiene subdivisiones dentro de una localidad.
-- (Actualizar barrios)
-- ==========================================
--  Renombrar columnas para ajustarlas a la nueva estructura
ALTER TABLE public.barrios RENAME COLUMN gid TO id_barrio;
ALTER TABLE public.barrios RENAME COLUMN barrio TO nombre_barrio;
ALTER TABLE public.barrios RENAME COLUMN area_has TO superficie_ha;
ALTER TABLE public.barrios RENAME COLUMN geom TO geom_barrio;

--  Eliminar columnas innecesarias
ALTER TABLE public.barrios 
    DROP COLUMN localidad,
    DROP COLUMN area_km2;

--  Agregar las columnas nuevas
ALTER TABLE public.barrios
    ADD COLUMN numero_habitantes INT NULL,
    ADD COLUMN numero_predios INT NULL,
    ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW(),
    ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();

--  Corregir la geometría (tu shapefile tiene 3D, así que forzamos a 2D para evitar errores)
ALTER TABLE public.barrios 
    ALTER COLUMN geom_barrio TYPE geometry(MULTIPOLYGON, 4326)
    USING ST_Force2D(ST_SetSRID(geom_barrio, 4326));

--  Asegurar clave primaria correcta
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
    nombre_estado VARCHAR(50) NOT NULL UNIQUE
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
    nombre_proyecto TEXT NULL,
    direccion TEXT NULL,
    id_programa INT NOT NULL REFERENCES programas(id_programa)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    id_proyecto_estado INT NULL REFERENCES proyecto_estado(id_proyecto_estado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    id_proyecto_subestado INT NULL REFERENCES proyecto_subestado(id_proyecto_subestado)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    coordenada_x VARCHAR(255) NULL,
    coordenada_y VARCHAR(255) NULL,
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