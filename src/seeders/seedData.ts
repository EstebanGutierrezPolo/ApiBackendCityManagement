import pool from "../config/db";

async function seedDatabase() {
  const client = await pool.connect();
  try {
    console.log('🌱 Iniciando carga de datos base...');
    await client.query('BEGIN');

    // -------------------------------------------------
    // 🔹 1. Roles
    // -------------------------------------------------
    await client.query(`
      INSERT INTO roles (nombre_rol)
      VALUES
        ('Administrador'),
        ('Alcalde'),
        ('Consultor')
      ON CONFLICT (nombre_rol) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 2. Cargos
    // -------------------------------------------------
    await client.query(`
      INSERT INTO cargos (nombre_cargo)
      VALUES
        ('Director de Proyecto'),
        ('Coordinador'),
        ('Analista'),
        ('Supervisor')
      ON CONFLICT (nombre_cargo) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 3. Estados de usuario
    // -------------------------------------------------
    await client.query(`
      INSERT INTO estados_usuario (nombre_estado_usuario)
      VALUES
        ('Activo'),
        ('Inactivo'),
        ('Bloqueado')
      ON CONFLICT (nombre_estado_usuario) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 4. Tipos de documento
    // -------------------------------------------------
    await client.query(`
      INSERT INTO tipos_documento (tipo_documento)
      VALUES
        ('CÉDULA DE CIUDADANÍA'),
        ('CÉDULA EXTRANJERA'),
        ('DOCUMENTO EXTRANJERO'),
        ('PASAPORTE'),
        ('REGISTRO CIVIL'),
        ('TARJETA DE IDENTIDAD'),
        ('NIT')
      ON CONFLICT (tipo_documento) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 5. Sectores
    // -------------------------------------------------
    await client.query(`
      INSERT INTO sectores (nombre_sector)
      VALUES
        ('Agua potable y saneamiento básico'),
        ('Arroyos'),
        ('Cultura'),
        ('Desarrollo urbano'),
        ('EcoTurismo'),
        ('Educación'),
        ('Energía sostenible'),
        ('Recreación y deporte'),
        ('Salud'),
        ('Seguridad'),
        ('Transporte'),
        ('Vivienda')
      ON CONFLICT (nombre_sector) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 6. Dependencias
    // -------------------------------------------------
    await client.query(`
      INSERT INTO dependencias (nombre_dependencia)
      VALUES
        ('ADI'),
        ('EDUBAR'),
        ('Gerencia de ciudad'),
        ('IUB'),
        ('K-yena'),
        ('Obras públicas'),
        ('PDO'),
        ('Siembra+')
      ON CONFLICT (nombre_dependencia) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 7. Líneas estratégicas
    // -------------------------------------------------
    await client.query(`
      INSERT INTO linea_estrategica (nombre_linea_estrategica)
      VALUES
        ('Línea económica ciudad dinámica'),
        ('Línea social ciudad segura y solidaria'),
        ('Línea ambiental ciudad ambiental y sostenible'),
        ('Línea Político-administrativa gobierno eficiente y responsable')
      ON CONFLICT (nombre_linea_estrategica) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 8. Localidades
    // -------------------------------------------------
    await client.query(`
      INSERT INTO localidades (nombre_localidad)
      VALUES
        ('Riomar'),
        ('Norte-Centro Histórico'),
        ('Suroccidente'),
        ('Suroriente'),
        ('Metropolitana'),
        ('Todas')
      ON CONFLICT (nombre_localidad) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 9. Estados de proyecto
    // -------------------------------------------------
    await client.query(`
      INSERT INTO proyecto_estado (nombre_estado)
      VALUES
        ('Formulación'),
        ('Precontractual'),
        ('Contractual'),
        ('Postcontractual')
      ON CONFLICT (nombre_estado) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 10. Tipos de persona
    // -------------------------------------------------
    await client.query(`
      INSERT INTO tipo_persona (nombre_tipo_persona)
      VALUES
        ('Natural'),
        ('Jurídica')
      ON CONFLICT (nombre_tipo_persona) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 11. Tipos de asociación
    // -------------------------------------------------
    await client.query(`
      INSERT INTO tipos_asociacion (nombre_tipo_de_asociacion)
      VALUES
        ('Cooperativa'),
        ('Fundación'),
        ('Asociación Civil')
      ON CONFLICT (nombre_tipo_de_asociacion) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 12. Tipos de avance
    // -------------------------------------------------
    await client.query(`
      INSERT INTO tipos_avance (nombre_tipo_avance)
      VALUES
        ('Físico'),
        ('Financiero'),
        ('Técnico')
      ON CONFLICT (nombre_tipo_avance) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 13. Tipos de seguimiento
    // -------------------------------------------------
    await client.query(`
      INSERT INTO tipos_seguimiento (nombre_tipo_seguimiento)
      VALUES
        ('Visita técnica'),
        ('Informe mensual'),
        ('Fotográfico')
      ON CONFLICT (nombre_tipo_seguimiento) DO NOTHING;
    `);

    // -------------------------------------------------
    // 🔹 14. Estados de seguimiento
    // -------------------------------------------------
    await client.query(`
      INSERT INTO estados_seguimientos (nombre_estado_seguimiento)
      VALUES
        ('En proceso'),
        ('Finalizado'),
        ('Revisado')
      ON CONFLICT (nombre_estado_seguimiento) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('✅ Carga de datos base completada exitosamente.');
  } catch (error) {
    await client.query('ROLLBACK');
    if (error instanceof Error) {
      console.error('❌ Error al insertar datos:', error.message);
    } else {
      console.error('❌ Error desconocido:', error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar el seeding
seedDatabase()
  .then(async () => {
    console.log('🌱 Seeding finalizado.');
    await pool.end();
  })
  .catch(async (err) => {
    console.error('❌ Error global en seeding:', err);
    await pool.end();
  });
