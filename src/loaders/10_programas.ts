// src/loaders/load-programas.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ProgramaRow {
  id_programa?: string;
  nombre_programa: string;
  id_sector?: string;
  id_dependencia?: string;
  created_at?: string;
  updated_at?: string;
}

async function loadProgramas(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/10_programas.csv");
  const rows: ProgramaRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: ProgramaRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de programas...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idPrograma = r.id_programa ? Number(r.id_programa) : undefined;
      const nombre = r.nombre_programa?.trim();
      const idSector = r.id_sector ? Number(r.id_sector) : undefined;
      const idDependencia = r.id_dependencia ? Number(r.id_dependencia) : undefined;
      const createdAt = r.created_at ? new Date(r.created_at) : new Date();
      const updatedAt = r.updated_at ? new Date(r.updated_at) : new Date();

      if (!idPrograma || !nombre || !idSector || !idDependencia) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO programas 
           (id_programa, nombre_programa, id_sector, id_dependencia, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (id_programa) DO UPDATE
         SET nombre_programa = EXCLUDED.nombre_programa,
             id_sector = EXCLUDED.id_sector,
             id_dependencia = EXCLUDED.id_dependencia,
             updated_at = EXCLUDED.updated_at
         RETURNING xmax = 0 AS inserted;`,
        [idPrograma, nombre, idSector, idDependencia, createdAt, updatedAt]
      );

      const wasInserted = result.rows[0]?.inserted;
      if (wasInserted) insertCount++;
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas/Actualizadas: ${insertCount}`);
    console.log(`   • Omitidas (sin datos válidos): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al cargar programas:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadProgramas()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadProgramas;
