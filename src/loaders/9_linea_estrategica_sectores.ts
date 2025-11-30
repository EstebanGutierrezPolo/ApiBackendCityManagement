// src/loaders/load-lineas-estrategicas-sectores.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface LineaSectorRow {
  id_linea_estrategica?: string;
  id_sector?: string;
  created_at?: string;
  updated_at?: string;
}

async function loadLineasEstrategicasSectores(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/9_linea_estrategica_sectores.csv");
  const rows: LineaSectorRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: LineaSectorRow) => rows.push(data))
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
  let skipCount = 0;

  try {
    console.log("🌱 Iniciando carga de líneas estratégicas por sector...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idLinea = r.id_linea_estrategica ? Number(r.id_linea_estrategica) : undefined;
      const idSector = r.id_sector ? Number(r.id_sector) : undefined;
      const createdAt = r.created_at ? new Date(r.created_at) : new Date();
      const updatedAt = r.updated_at ? new Date(r.updated_at) : new Date();

      if (!idLinea || !idSector) {
        skipCount++;
        continue;
      }

      await client.query(
        `INSERT INTO linea_estrategica_sectores 
           (id_linea_estrategica, id_sector, created_at, updated_at)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (id_linea_estrategica, id_sector) DO UPDATE 
         SET updated_at = EXCLUDED.updated_at
         RETURNING xmax = 0 AS inserted;`,
        [idLinea, idSector, createdAt, updatedAt]
      );

      insertCount++; // En este caso, consideramos insert como insert/update
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas/Actualizadas: ${insertCount}`);
    console.log(`   • Omitidas (sin id válido): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al cargar líneas estratégicas por sector:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadLineasEstrategicasSectores()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadLineasEstrategicasSectores;
