// src/loaders/load-dependencias.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface DependenciaRow {
  id_dependencia?: string;
  nombre_dependencia: string;
}

async function loadDependencias(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/7_dependencias.csv");
  const rows: DependenciaRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: DependenciaRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de dependencias...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_dependencia ? Number(r.id_dependencia) : undefined;
      const nombre = r.nombre_dependencia?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO dependencias (id_dependencia, nombre_dependencia)
         VALUES ($1, $2)
         ON CONFLICT (id_dependencia) DO UPDATE 
         SET nombre_dependencia = EXCLUDED.nombre_dependencia
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
      console.error("❌ Error al cargar dependencias:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadDependencias()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadDependencias;
