// src/loaders/load-sectores.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface SectorRow {
  id_sector?: string;
  nombre_sector: string;
}

async function loadSectores(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/6_sectores.csv");
  const rows: SectorRow[] = [];

  // Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: SectorRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de sectores...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_sector ? Number(r.id_sector) : undefined;
      const nombre = r.nombre_sector?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO sectores (id_sector, nombre_sector)
         VALUES ($1, $2)
         ON CONFLICT (id_sector) DO UPDATE SET nombre_sector = EXCLUDED.nombre_sector
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
      console.error("❌ Error al cargar sectores:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  loadSectores()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadSectores;
