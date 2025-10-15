// src/loaders/load-proyectos.ts
import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ProyectoRow {
  id_proyecto?: string;
  nombre_proyecto?: string;
  direccion?: string;
  id_programa?: string;
  id_proyecto_estado?: string;
  id_proyecto_subestado?: string;
  coordenada_x?: string;
  coordenada_y?: string;
}

/** Limpia valores "null" o vacíos */
const sanitize = (val?: string): string | null => {
  if (!val) return null;
  const clean = val.trim();
  if (clean === "" || clean.toLowerCase() === "null") return null;
  return clean;
};

/** Convierte un valor a número si es posible */
const parseNumber = (val?: string): number | null => {
  if (!val) return null;
  const clean = val.trim().replace(",", ".");
  const num = Number(clean);
  return isNaN(num) ? null : num;
};

async function loadProyectos(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/16_proyectos.csv");
  const rows: ProyectoRow[] = [];

  // 📥 Leer CSV (usa punto y coma como delimitador)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: ProyectoRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de proyectos...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idProyecto = parseNumber(r.id_proyecto);
      const nombreProyecto = sanitize(r.nombre_proyecto);
      const direccion = sanitize(r.direccion);
      const idPrograma = parseNumber(r.id_programa);
      const idProyectoEstado = parseNumber(r.id_proyecto_estado);
      const idProyectoSubestado = parseNumber(r.id_proyecto_subestado);
      const coordenadaX = sanitize(r.coordenada_x)?.replace(",", ".") || null;
      const coordenadaY = sanitize(r.coordenada_y)?.replace(",", ".") || null;

      // ⚠️ Saltar filas sin id_programa (requerido)
      if (!idPrograma) {
        skipCount++;
        continue;
      }

      try {
        const result = await client.query(
          `
          INSERT INTO proyectos (
            id_proyecto,
            nombre_proyecto,
            direccion,
            id_programa,
            id_proyecto_estado,
            id_proyecto_subestado,
            coordenada_x,
            coordenada_y
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
          ON CONFLICT (id_proyecto) DO UPDATE 
          SET 
            nombre_proyecto = EXCLUDED.nombre_proyecto,
            direccion = EXCLUDED.direccion,
            id_programa = EXCLUDED.id_programa,
            id_proyecto_estado = EXCLUDED.id_proyecto_estado,
            id_proyecto_subestado = EXCLUDED.id_proyecto_subestado,
            coordenada_x = EXCLUDED.coordenada_x,
            coordenada_y = EXCLUDED.coordenada_y,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted;
          `,
          [
            idProyecto,
            nombreProyecto,
            direccion,
            idPrograma,
            idProyectoEstado,
            idProyectoSubestado,
            coordenadaX,
            coordenadaY,
          ]
        );

        const wasInserted = result.rows[0]?.inserted;
        if (wasInserted) insertCount++;
        else updateCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con id_proyecto=${r.id_proyecto}: ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Actualizadas: ${updateCount}`);
    console.log(`   • Omitidas (sin id_programa o con error): ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error general al cargar proyectos:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadProyectos()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadProyectos;