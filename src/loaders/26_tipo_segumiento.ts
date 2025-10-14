// src/loaders/load-tipos-seguimiento.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface TipoSeguimientoRow {
  id_tipo_seguimiento?: string;
  nombre_tipo_seguimiento: string;
}

async function loadTiposSeguimiento(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/tipos_seguimiento.csv");
  const rows: TipoSeguimientoRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: TipoSeguimientoRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de tipos de seguimiento...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_tipo_seguimiento ? Number(r.id_tipo_seguimiento) : undefined;
      const nombre = r.nombre_tipo_seguimiento?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO tipos_seguimiento (id_tipo_seguimiento, nombre_tipo_seguimiento)
         VALUES ($1, $2)
         ON CONFLICT (id_tipo_seguimiento) DO UPDATE
         SET nombre_tipo_seguimiento = EXCLUDED.nombre_tipo_seguimiento
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
      console.error("❌ Error al cargar tipos de seguimiento:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadTiposSeguimiento()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadTiposSeguimiento;
