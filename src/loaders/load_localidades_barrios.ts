// src/loaders/load-localidades-barrios.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface LocalidadBarrioRow {
  id_localidad?: string;
  id_barrio?: string;
}

async function loadLocalidadesBarrios(): Promise<void> {
  const filePath = path.join(__dirname, "../data/localidades-barrios.csv");
  const rows: LocalidadBarrioRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: LocalidadBarrioRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de localidades-barrios...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idLocalidad = r.id_localidad ? Number(r.id_localidad) : undefined;
      const idBarrio = r.id_barrio ? Number(r.id_barrio) : undefined;

      if (!idLocalidad || !idBarrio) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO localidades_barrios (id_localidad, id_barrio)
         VALUES ($1, $2)
         ON CONFLICT (id_localidad, id_barrio) DO NOTHING
         RETURNING xmax = 0 AS inserted;`,
        [idLocalidad, idBarrio]
      );

      const wasInserted = result.rows[0]?.inserted;
      if (wasInserted) insertCount++;
      else updateCount++; // Aunque con DO NOTHING normalmente no se actualiza
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Actualizadas: ${updateCount}`);
    console.log(`   • Omitidas (sin id válido): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al cargar localidades-barrios:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadLocalidadesBarrios()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadLocalidadesBarrios;
