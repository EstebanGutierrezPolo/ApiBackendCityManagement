// src/loaders/load-proyectos-subestado.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ProyectoSubestadoRow {
  id_proyecto_subestado?: string;
  id_proyecto_estado?: string;
  nombre_subestado: string;
}

async function loadProyectosSubestado(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/15_proyectos_subestado.csv");
  const rows: ProyectoSubestadoRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data: ProyectoSubestadoRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de subestados de proyecto...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idSubestado = r.id_proyecto_subestado ? Number(r.id_proyecto_subestado) : undefined;
      const idEstado = r.id_proyecto_estado ? Number(r.id_proyecto_estado) : undefined;
      const nombre = r.nombre_subestado?.trim();

      if (!idSubestado || !idEstado || !nombre) {
        skipCount++;
        continue;
      }

      const result = await client.query(
        `INSERT INTO proyectos_subestado (id_proyecto_subestado, id_proyecto_estado, nombre_subestado)
         VALUES ($1, $2, $3)
         ON CONFLICT (id_proyecto_subestado) DO UPDATE
         SET id_proyecto_estado = EXCLUDED.id_proyecto_estado,
             nombre_subestado = EXCLUDED.nombre_subestado
         RETURNING xmax = 0 AS inserted;`,
        [idSubestado, idEstado, nombre]
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
    console.log(`   • Omitidas (sin datos válidos): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error al cargar subestados de proyecto:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se corre directamente este archivo
if (require.main === module) {
  loadProyectosSubestado()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadProyectosSubestado;
