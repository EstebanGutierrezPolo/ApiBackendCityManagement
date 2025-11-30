// src/loaders/load-tipos-documento.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface TipoDocumentoRow {
  id_tipo_documento?: string;
  tipo_documento: string;
}

async function loadTiposDocumento(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/4_tipos_documento.csv");
  const rows: TipoDocumentoRow[] = [];

  // Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: TipoDocumentoRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de tipos de documento...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_tipo_documento ? Number(r.id_tipo_documento) : undefined;
      const nombre = r.tipo_documento?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO tipos_documento (id_tipo_documento, tipo_documento)
         VALUES ($1, $2)
         ON CONFLICT (id_tipo_documento) DO UPDATE SET tipo_documento = EXCLUDED.tipo_documento
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
      console.error("❌ Error al cargar tipos de documento:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  loadTiposDocumento()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadTiposDocumento;
