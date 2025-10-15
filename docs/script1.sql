
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


