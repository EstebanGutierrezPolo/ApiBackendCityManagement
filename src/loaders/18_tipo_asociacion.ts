// src/loaders/load-tipos-asociacion.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface TipoAsociacionRow {
  id_tipo_asociacion?: string;
  nombre_tipo_de_asociacion: string;
}

async function loadTiposAsociacion(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/18_tipos_asociacion.csv");
  const rows: TipoAsociacionRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: TipoAsociacionRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  if (rows.length === 0) {
    console.log("⚠️ No hay datos en el archivo CSV.");
    return;
  }

  const client = await pool.connect();
  let insertCount = 0;
  let updateCount = 0;
  let skipCount = 0;

  try {
    console.log("🌱 Iniciando carga de tipos de asociación...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_tipo_asociacion ? Number(r.id_tipo_asociacion) : undefined;
      const nombre = r.nombre_tipo_de_asociacion?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO tipos_asociacion (id_tipo_asociacion, nombre_tipo_de_asociacion)
         VALUES ($1, $2)
         ON CONFLICT (id_tipo_asociacion) DO UPDATE
         SET nombre_tipo_de_asociacion = EXCLUDED.nombre_tipo_de_asociacion
         RETURNING xmax = 0 AS inserted;`,
        [id, nombre]
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
    console.log(`   • Omitidas (sin nombre válido): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al cargar tipos de asociación:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadTiposAsociacion()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadTiposAsociacion;
