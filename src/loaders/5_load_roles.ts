import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface UsuarioRow {
  id_usuario?: string;
  id_rol: string;
  id_cargo?: string;
  id_estado_usuario?: string;
  id_tipo_documento: string;
  primer_nombre: string;
  segundo_nombre?: string;
  primer_apellido: string;
  segundo_apellido?: string;
  documento: string;
  email: string;
  password_hashed: string;
  activo?: string;
}

async function loadUsuarios(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/5_usuarios.csv");
  const rows: UsuarioRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
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
      const id = r.id_usuario ? Number(r.id_usuario) : undefined;
      const values = [
        r.id_rol ? Number(r.id_rol) : null,
        r.id_cargo ? Number(r.id_cargo) : null,
        r.id_estado_usuario ? Number(r.id_estado_usuario) : null,
        r.id_tipo_documento ? Number(r.id_tipo_documento) : null,
        r.primer_nombre?.trim(),
        r.segundo_nombre?.trim() || null,
        r.primer_apellido?.trim(),
        r.segundo_apellido?.trim() || null,
        r.documento?.trim(),
        r.email?.trim(),
        r.password_hashed?.trim(),
        r.activo ? r.activo.toLowerCase() === "true" : true
      ];

      if (!r.email || !r.password_hashed || !r.primer_nombre || !r.primer_apellido) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO usuarios (
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
         RETURNING xmax = 0 AS inserted;`,
        values
      );

      const wasInserted = result.rows[0]?.inserted;
      if (wasInserted) insertCount++;
      else updateCount++;
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
      console.error("❌ Error al cargar usuarios:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
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
