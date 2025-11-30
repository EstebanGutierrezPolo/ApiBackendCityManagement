import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface CargoRow {
  id_cargo?: string;
  nombre_cargo: string;
}

async function loadCargos(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/2_cargos.csv");
  const rows: CargoRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: CargoRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de cargos...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = r.id_cargo ? Number(r.id_cargo) : undefined;
      const nombre = r.nombre_cargo?.trim();

      if (!nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO cargos (id_cargo, nombre_cargo)
         VALUES ($1, $2)
         ON CONFLICT (id_cargo) DO UPDATE 
         SET nombre_cargo = EXCLUDED.nombre_cargo
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
      console.error("❌ Error al cargar cargos:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadCargos()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadCargos;