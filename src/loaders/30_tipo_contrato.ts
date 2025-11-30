import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface TipoContratoRow {
  id_tipo_contrato?: string;
  nombre_tipo_contrato: string;
}

async function loadTiposContrato(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/30_tipo_contrato.csv");
  const rows: TipoContratoRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: TipoContratoRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  const client = await pool.connect();
  let insertCount = 0;
  let updateCount = 0;

  try {
    console.log("🌱 Iniciando carga de tipos de contrato...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_tipo_contrato ? Number(r.id_tipo_contrato) : undefined;
      const nombre = r.nombre_tipo_contrato?.trim();

      if (!nombre) continue;

      const result = await client.query(
        `INSERT INTO tipos_contrato (id_tipo_contrato, nombre_tipo_contrato)
         VALUES ($1, $2)
         ON CONFLICT (id_tipo_contrato) DO UPDATE
         SET nombre_tipo_contrato = EXCLUDED.nombre_tipo_contrato
         RETURNING xmax = 0 AS inserted;`,
        [id, nombre]
      );

      const wasInserted = result.rows[0]?.inserted;
      if (wasInserted) insertCount++;
      else updateCount++;
    }

    await client.query("COMMIT");
    console.log(`✅ Carga completada: ${insertCount} nuevos, ${updateCount} actualizados.`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error al cargar tipos de contrato:", (error as Error).message);
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadTiposContrato()
    .then(async () => await pool.end())
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadTiposContrato;