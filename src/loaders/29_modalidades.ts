// src/loaders/load-modalidades.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ModalidadRow {
  id_modalidad?: string;
  nombre_modalidad?: string;
}

/** Limpia texto nulo o vacío */
const sanitize = (val?: string): string | null => {
  if (!val) return null;
  const clean = val.trim();
  if (clean === "" || clean.toLowerCase() === "null") return null;
  return clean;
};

async function loadModalidades(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/29_modalidad.csv");
  const rows: ModalidadRow[] = [];

  // 📥 Leer CSV (separado por comas)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: "," }))
      .on("data", (data: ModalidadRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de modalidades...");
    await client.query("BEGIN");

    for (const r of rows) {
      const nombre = sanitize(r.nombre_modalidad);
      const id = r.id_modalidad ? Number(r.id_modalidad) : null;

      if (!nombre) {
        skipCount++;
        continue;
      }

      try {
        await client.query(
          `
          INSERT INTO modalidades (id_modalidad, nombre_modalidad)
          VALUES ($1, $2)
          ON CONFLICT (nombre_modalidad) DO NOTHING;
          `,
          [id, nombre]
        );
        insertCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con id_modalidad=${id}: ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas: ${insertCount}`);
    console.log(`   • Omitidas (duplicadas o inválidas): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error general al cargar modalidades:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadModalidades()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadModalidades;