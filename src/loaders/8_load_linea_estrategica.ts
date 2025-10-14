// src/loaders/load-lineas-estrategicas.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface LineaEstrategicaRow {
  id_linea_estrategica?: string;
  nombre_linea_estrategica: string;
  created_at?: string;
  updated_at?: string;
}

async function loadLineasEstrategicas(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/8_lineas_estrategica.csv");
  const rows: LineaEstrategicaRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: LineaEstrategicaRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de lineas_estrategicas...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_linea_estrategica ? Number(r.id_linea_estrategica) : undefined;
      const nombre = r.nombre_linea_estrategica?.trim();
      const createdAt = r.created_at ? new Date(r.created_at) : new Date();
      const updatedAt = r.updated_at ? new Date(r.updated_at) : new Date();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO lineas_estrategicas 
          (id_linea_estrategica, nombre_linea_estrategica, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_linea_estrategica) DO UPDATE 
         SET nombre_linea_estrategica = EXCLUDED.nombre_linea_estrategica,
             updated_at = EXCLUDED.updated_at
         RETURNING xmax = 0 AS inserted;`,
        [id, nombre, createdAt, updatedAt]
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
      console.error("❌ Error al cargar lineas_estrategicas:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadLineasEstrategicas()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadLineasEstrategicas;
