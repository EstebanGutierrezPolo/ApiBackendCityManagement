
-----------------------------------------------------------------------------------------------------------
---------------------------------------Habilitar extensiones-----------------------------------------
-----------------------------------------------------------------------------------------------------------

CREATE EXTENSION postgis;
SELECT postgis_full_version();

-----------------------------------------------------------------------------------------------------------
---------------------------------------Seccion Usuarios aplicativo-----------------------------------------
-----------------------------------------------------------------------------------------------------------

-- Tabla: roles - Define los roles (permisos) de los usuarios en la aplicación (Ej: Administrador, Alcalde, Consultor) 
----- (Por confirmar roles) -----.

CREATE TABLE roles (
    id_rol SERIAL PRIMARY KEY, -- Identificador único del rol (PK).
    nombre_rol VARCHAR(50) UNIQUE NOT NULL, -- Nombre descriptivo del rol.
    created_at TIMESTAMPTZ DEFAULT NOW(), -- Fecha de creación del registro.
    updated_at TIMESTAMPTZ DEFAULT NOW() -- Fecha de la última actualización.
);

-- Tabla: cargos - Define los cargos que ocupan los usuarios dentro de la Alcaldía (Ej: Coordinador, Director de Proyecto) 
----- (Por confirmar cargos) ------.
CREATE TABLE cargos (
    id_cargo SERIAL PRIMARY KEY, -- Identificador único del cargo (PK).
    nombre_cargo TEXT UNIQUE NOT NULL, -- Nombre completo del cargo.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: estados_usuario - Define el estado actual de la cuenta de un usuario 
-- 1. Activo 
-- 2. Inactivo
-- 3. Bloqueado.
CREATE TABLE estados_usuario (
    id_estado_usuario SERIAL PRIMARY KEY, -- Identificador único del estado (PK).
    nombre_estado_usuario VARCHAR(30) UNIQUE NOT NULL, -- Nombre del estado.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: tipos_documento - Define los tipos de documento de identificación 
-- 1. 'CÉDULA DE CIUDADANÍA'
-- 2. 'CÉDULA EXTRANJERA' 
-- 3. 'DOCUMENTO EXTRANJERO'
-- 4. 'PASAPORTE'
-- 5. 'REGISTRO CIVIL' 
-- 6.'TARJETA DE IDENTIDAD'.
CREATE TABLE tipos_documento (
    id_tipo_documento SERIAL PRIMARY KEY, -- Identificador único del tipo de documento (PK).
    tipo_documento VARCHAR(100) UNIQUE NOT NULL, -- Nombre del tipo de documento.
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabla: usuarios - Almacena la información de las cuentas de usuario que acceden al sistema.
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
-- TABLA: Sectores
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

CREATE TABLE sectores (
    id_sector SERIAL PRIMARY KEY,
    nombre_sector VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: Dependencias
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
CREATE TABLE dependencias (
    id_dependencia SERIAL PRIMARY KEY,
    nombre_dependencia VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: Línea Estratégica
-- Contiene las líneas estratégicas de planeación institucional
-- ============================================
-- 1. Línea económica ciudad dinámica
-- 2. Línea social ciudad segura y solidaria
-- 3. Línea ambiental ciudad ambiental y sostenible
-- 4. Línea Político-administrativa gobierno eficiente y responsable

CREATE TABLE linea_estrategica (
    id_linea_estrategica SERIAL PRIMARY KEY,
    nombre_linea_estrategica TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- TABLA: Línea Estratégica - Sectores (relación N:M)
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
-- TABLA: Programas
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
--  TABLA: Localidades
--  Contiene las divisiones geográficas mayores.
-- ==========================================
-- 1. Localidad Riomar
-- 2. Localidad Norte-Centro Histórico
-- 3. Localidad Suroccidente
-- 4. Localidad Suroriente
-- 5. Localidad Metropolitana
-- 6. Todas

CREATE TABLE localidades (
    id_localidad SERIAL PRIMARY KEY,
    nombre_localidad VARCHAR(100) NOT NULL UNIQUE,
    geom_localidad GEOMETRY(MULTIPOLYGON, 4326),  -- Geometría con SRID 4326 (WGS84)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
--  TABLA: Barrios
--  Contiene subdivisiones dentro de una localidad.
-- (Actualizar barrios)
-- ==========================================
-- 1. Adela de Char.
-- 2. Altamira.
-- 3. Altos de Riomar.
-- 4. Altos del Limón.
-- 5. Altos del Prado.
-- 6. Andalucía.
-- 7. Buenavista.
-- 8. El Castillo I.
-- 9. El Golf.
-- 10. El Limoncito.
-- 11. El Poblado.
-- 12. La Castellana.
-- 13. La Floresta.
-- 14. Las Flores.
-- 15. Las Tres Avemarías.
-- 16. Miramar.
-- 17. Paraíso.
-- 18. Riomar.
-- 19. San Marino.
-- 20. San Salvador.
-- 21. San Vicente.
-- 22. Santa Mónica.
-- 23. Siape.
-- 24. Solaire.
-- 25. Villa Campestre.
-- 26. Villa Carolina.
-- 27. Villa del Este.
-- 28. Villa Santos.
-- 29. Villamar.
-- 30. Villas del Puerto.
-- 31. La Playa (centro poblado).

-- 32. Alameda del Río.
-- 33. América.
-- 34. Barlovento.
-- 35. Barranquillita.
-- 36. Barrio Abajo.
-- 37. Bellavista.
-- 38. Betania.
-- 39. Boston.
-- 40. Campo Alegre.
-- 41. Centro.
-- 42. Ciudad Jardín.
-- 43. Colombia.
-- 44. El Boliche.
-- 45. El Castillo.
-- 46. El Porvenir.
-- 47. El Prado.
-- 48. El Recreo.
-- 49. El Rosario.
-- 50. El Tabor.
-- 51. Granadillo.
-- 52. Zona Industrial Vía 40.
-- 53. La Bendición de Dios.
-- 54. La Campiña.
-- 55. La Concepción.
-- 56. La Cumbre.
-- 57. La Felicidad.
-- 58. La Loma.
-- 59. Las Colinas.
-- 60. Las Delicias.
-- 61. Las Mercedes.
-- 62. Los Alpes.
-- 63. Los Jobos.
-- 64. Los Nogales.
-- 65. Miramar (Norte-Centro Histórico).
-- 66. Modelo.
-- 67. Montecristo.
-- 68. Nuevo Horizonte.
-- 69. Paraíso (Norte-Centro Histórico).
-- 70. Parque Rosado.
-- 71. San Francisco.
-- 72. Santa Ana.
-- 73. Villa Country.
-- 74. Villa Tarel.
-- 75. Villanueva.

-- 76. 7 de Abril.
-- 77. 20 de Julio.
-- 78. Buenos Aires.
-- 79. Carrizal.
-- 80. Cevillar.
-- 81. Ciudadela 20 de Julio.
-- 82. El Santuario.
-- 83. Kennedy.
-- 84. La Sierra.
-- 85. La Sierrita.
-- 86. La Victoria.
-- 87. Las Américas.
-- 88. Las Cayenas.
-- 89. Las Gardenias.
-- 90. Las Granjas.
-- 91. Los Continentes.
-- 92. Los Girasoles.
-- 93. San José.
-- 94. San Luis.
-- 95. Santa María.
-- 96. Santo Domingo de Guzmán.
-- 97. Villa San Carlos.
-- 98. Villa San Pedro I.
-- 99. Villa San Pedro II.
-- 100. Villa Sevilla.

-- 101. 7 de Agosto.
-- 102. Bernando Hoyos.
-- 103. Buena Esperanza.
-- 104. California.
-- 105. Caribe Verde.
-- 106. Carlos Meisel.
-- 107. Cevillar (Suroccidente).
-- 108. Chiquinquirá.
-- 109. Ciudad Modesto.
-- 110. Colina Campestre.
-- 111. Cordialidad.
-- 112. Cuchilla de Villate.
-- 113. El Bosque.
-- 114. El Carmen.
-- 115. El Edén 2000.
-- 116. El Golfo.
-- 117. El Pueblo.
-- 118. El Recreo (Suroccidente).
-- 119. El Romance.
-- 120. El Rubí.
-- 121. El Silencio.
-- 122. El Valle.
-- 123. Evaristo Sourdis.
-- 124. Kalamary.
-- 125. La Ceiba.
-- 126. La Esmeralda.
-- 127. La Florida.
-- 128. La Gloria.
-- 129. La Libertad.
-- 130. La Manga.
-- 131. La Paz.
-- 132. La Pradera.
-- 133. La Sierra (Suroccidente).
-- 134. Las Colinas (Suroccidente).
-- 135. Las Estrellas.
-- 136. Las Malvinas.
-- 137. Las Mercedes Sur.
-- 138. Las Terrazas.
-- 139. Lipaya.
-- 140. Loma Fresca.
-- 141. Los Andes.
-- 142. Los Olivos I.
-- 143. Los Olivos II.
-- 144. Los Pinos.
-- 145. Los Rosales.
-- 146. Lucero.
-- 147. Mequejo.
-- 148. Olaya.
-- 149. San Felipe.
-- 150. San Isidro.
-- 151. El Por Fin.
-- 152. Villate.
-- 153. Pinar del Río.
-- 154. Villas de San Pablo.

-- 155. Alfonso López.
-- 156. Atlántico.
-- 157. Bella Arena.
-- 158. Boyacá.
-- 159. Chiquinquirá (Suroriente).
-- 160. El Campito.
-- 161. El Ferry.
-- 162. El Limón.
-- 163. El Milagro.
-- 164. José Antonio Galán.
-- 165. La Alboraya.
-- 166. La Chinita.
-- 167. La Luz.
-- 168. La Magdalena.
-- 169. La Unión.
-- 170. La Victoria (Suroriente).
-- 171. Las Dunas.
-- 172. Las Nieves.
-- 173. Las Palmas.
-- 174. Las Palmeras.
-- 175. Los Laureles.
-- 176. Los Trupillos.
-- 177. Moderno.
-- 178. Montes.
-- 179. Pasadena.
-- 180. Primero de Mayo.
-- 181. Rebolo.
-- 182. San Nicolás.
-- 183. San Roque.
-- 184. Santa Elena.
-- 185. Simón Bolívar.
-- 186. Tayrona.
-- 187. Universal I.
-- 188. Universal II.
-- 189. Villa Blanca.
-- 190. Villa del Carmen.
-- 191. Zona Franca.
CREATE TABLE barrios (
    id_barrio SERIAL PRIMARY KEY,
    id_localidad INT REFERENCES localidades(id_localidad)
        ON UPDATE CASCADE
        ON DELETE SET NULL,
    nombre_barrio VARCHAR(100) NOT NULL,
    numero_habitantes INT,
    numero_predios INT,
    superficie_ha NUMERIC(12,2),                  -- Hectáreas
    geom_barrio GEOMETRY(MULTIPOLYGON, 4326),     -- Polígono de la zona del barrio
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_barrio_localidad UNIQUE (nombre_barrio, id_localidad)
);

-- ==========================================
--  TABLA: Localidades_Barrios
--  Relación explícita N:M entre Localidades y Barrios.
--  (Aunque normalmente un barrio pertenece a una sola localidad, esto deja flexibilidad).
-- ==========================================
CREATE TABLE localidades_barrios (
    id_localidad INT NOT NULL REFERENCES localidades(id_localidad)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    id_barrio INT NOT NULL REFERENCES barrios(id_barrio)
        ON UPDATE CASCADE
        ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (id_localidad, id_barrio)
);

-- ==========================================
--  TABLA: Proyecto_estado
--  Define los estados generales de un proyecto 
-- ==========================================
-- 1. Formulación
-- 2. Precontractual
-- 2. Contractual
-- 3. Postcontractual
CREATE TABLE proyecto_estado (
    id_proyecto_estado SERIAL PRIMARY KEY,
    nombre_estado VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
--  TABLA: Proyecto_subestado
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
--  TABLA: Proyectos
--  Contiene la información general del proyecto.
-- ==========================================
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
--  TABLA: Proyectos_Barrios
--  Relación N:M entre proyectos y barrios.
--  Un proyecto puede impactar varios barrios.
-- ==========================================
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
-- TABLA: tipos_asociacion
-- Contiene los tipos o clasificaciones de asociaciones.
-- Ejemplo: "Cooperativa", "Fundación", "Asociación Civil"
-- ============================================
CREATE TABLE tipos_asociacion (
    id_tipo_asociacion SERIAL PRIMARY KEY,           -- Identificador único
    nombre_tipo_de_asociacion VARCHAR(100) NOT NULL, -- Nombre del tipo de asociación
    created_at TIMESTAMPTZ DEFAULT NOW(),            -- Fecha de creación del registro
    updated_at TIMESTAMPTZ DEFAULT NOW()             -- Fecha de última actualización
);

-- ============================================
-- TABLA: asociaciones
-- Registra las asociaciones con su NIT y nombre.
-- Cada asociación pertenece a un tipo.
-- ============================================
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
-- TABLA: tipo_persona
-- Clasifica los tipos de persona dentro del sistema.
-- Ejemplo: "Natural", "Jurídica"
-- ============================================
CREATE TABLE tipo_persona (
    id_tipo_persona SERIAL PRIMARY KEY,       -- Identificador único
    nombre_tipo_persona VARCHAR(30) NOT NULL  -- Nombre del tipo de persona
);

-- ============================================
-- TABLA: personas
-- Almacena la información básica de las personas.
-- Incluye FK a tipo_persona.
-- ============================================
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
-- TABLA: miembros_asociacion
-- Relaciona personas con asociaciones, indicando su porcentaje de participación.
-- ============================================
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
-- TABLA: contratista
-- Registra a las personas contratistas, que pueden estar asociadas a una asociación.
-- ============================================
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
