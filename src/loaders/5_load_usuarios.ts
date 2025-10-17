import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface UsuarioRow {
  id_usuario?: string;
  id_rol?: string;
  id_cargo?: string;
  id_estado_usuario?: string;
  id_tipo_documento?: string;
  primer_nombre?: string;
  segundo_nombre?: string;
  primer_apellido?: string;
  segundo_apellido?: string;
  documento?: string;
  email?: string;
  password_hashed?: string;
  activo?: string;
}

/** 🧼 Limpia valores vacíos o “null” */
const sanitize = (val?: string): string | null => {
  if (!val) return null;
  const clean = val.trim();
  if (clean === "" || clean.toLowerCase() === "null") return null;
  return clean;
};

/** 🔢 Convierte a número si aplica */
const parseNumber = (val?: string): number | null => {
  if (!val) return null;
  const clean = val.trim().replace(",", ".");
  const num = Number(clean);
  return isNaN(num) ? null : num;
};

async function loadUsuarios(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/5_usuarios.csv");
  const rows: UsuarioRow[] = [];

  // 📥 Leer CSV (usa punto y coma si tu archivo viene así)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: UsuarioRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  if (rows.length === 0) {
    console.log("⚠️ No se encontraron datos en el CSV.");
    return;
  }

  const client = await pool.connect();
  let insertCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  try {
    console.log("🌱 Iniciando carga de usuarios...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = parseNumber(r.id_usuario);
      const idRol = parseNumber(r.id_rol);
      const idCargo = parseNumber(r.id_cargo);
      const idEstado = parseNumber(r.id_estado_usuario);
      const idTipoDoc = parseNumber(r.id_tipo_documento);

      const primerNombre = sanitize(r.primer_nombre);
      const segundoNombre = sanitize(r.segundo_nombre);
      const primerApellido = sanitize(r.primer_apellido);
      const segundoApellido = sanitize(r.segundo_apellido);
      const documento = sanitize(r.documento);
      const email = sanitize(r.email);
      const password = sanitize(r.password_hashed);
      const activo = r.activo ? r.activo.toLowerCase() === "true" : true;

      // Validar campos mínimos
      if (!email || !password || !primerNombre || !primerApellido) {
        console.warn(`⚠️ Fila omitida por datos incompletos (email o nombre faltante): ${email ?? "(sin email)"}`);
        skipCount++;
        continue;
      }

      try {
        const result = await client.query(
          `
          INSERT INTO usuarios (
            id_rol, id_cargo, id_estado_usuario, id_tipo_documento,
            primer_nombre, segundo_nombre, primer_apellido, segundo_apellido,
            documento, email, password_hashed, activo
          )
          VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
          ON CONFLICT (email)
          DO UPDATE SET
            id_rol = EXCLUDED.id_rol,
            id_cargo = EXCLUDED.id_cargo,
            id_estado_usuario = EXCLUDED.id_estado_usuario,
            id_tipo_documento = EXCLUDED.id_tipo_documento,
            primer_nombre = EXCLUDED.primer_nombre,
            segundo_nombre = EXCLUDED.segundo_nombre,
            primer_apellido = EXCLUDED.primer_apellido,
            segundo_apellido = EXCLUDED.segundo_apellido,
            documento = EXCLUDED.documento,
            password_hashed = EXCLUDED.password_hashed,
            activo = EXCLUDED.activo,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted;
          `,
          [
            idRol,
            idCargo,
            idEstado,
            idTipoDoc,
            primerNombre,
            segundoNombre,
            primerApellido,
            segundoApellido,
            documento,
            email,
            password,
            activo,
          ]
        );

        const wasInserted = result.rows[0]?.inserted;
        if (wasInserted) insertCount++;
        else updateCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con email=${r.email}: ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Actualizadas: ${updateCount}`);
    console.log(`   • Omitidas: ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error general al cargar usuarios:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se llama directamente
if (require.main === module) {
  loadUsuarios()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadUsuarios;