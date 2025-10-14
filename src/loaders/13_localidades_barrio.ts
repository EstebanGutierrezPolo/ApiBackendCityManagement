// src/loaders/load-barrios-localidad.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface BarrioLocalidadRow {
  id_barrio: string;
  id_localidad: string;
}

async function loadBarriosLocalidad(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/13_localidades_barrio.csv");
  const rows: BarrioLocalidadRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: BarrioLocalidadRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  if (rows.length === 0) {
    console.log("⚠️ No hay datos en el archivo CSV.");
    return;
  }

  const client = await pool.connect();
  let updateCount = 0;
  let skipCount = 0;

  try {
    console.log("🌱 Iniciando actualización de barrios con localidades...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idBarrio = Number(r.id_barrio);
      const idLocalidad = Number(r.id_localidad);

      if (!idBarrio || !idLocalidad) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `UPDATE barrios
         SET id_localidad = $2
         WHERE id_barrio = $1
         RETURNING *;`,
        [idBarrio, idLocalidad]
      );

      // ✅ Usamos ?? 0 para asegurar que rowCount nunca sea null
      if ((result.rowCount ?? 0) > 0) updateCount++;
      else skipCount++;
    }

    await client.query("COMMIT");

    console.log("✅ Actualización completada con éxito:");
    console.log(`   • Total filas procesadas: ${rows.length}`);
    console.log(`   • Barrios actualizados: ${updateCount}`);
    console.log(`   • Filas omitidas: ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al actualizar barrios con localidades:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadBarriosLocalidad()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadBarriosLocalidad;
