import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface AsociacionRow {
  id_asociacion?: string;
  nit?: string;
  id_representante_legal?: string;
  id_tipo_asociacion?: string;
  nombre_asociacion?: string;
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

async function loadAsociaciones(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/19_asociaciones.csv");
  const rows: AsociacionRow[] = [];

  // 📥 Leer CSV (usa punto y coma como delimitador)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: AsociacionRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de asociaciones...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = parseNumber(r.id_asociacion);
      const nit = sanitize(r.nit);
      const idRepresentante = parseNumber(r.id_representante_legal);
      const idTipoAsociacion = parseNumber(r.id_tipo_asociacion);
      const nombre = sanitize(r.nombre_asociacion);

      // ⚠️ Validar nombre obligatorio
      if (!nombre) {
        skipCount++;
        continue;
      }

      try {
        const result = await client.query(
          `
          INSERT INTO asociaciones (
            id_asociacion,
            nit,
            id_representante_legal,
            id_tipo_asociacion,
            nombre_asociacion
          ) VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id_asociacion) DO UPDATE 
          SET 
            nit = EXCLUDED.nit,
            id_representante_legal = EXCLUDED.id_representante_legal,
            id_tipo_asociacion = EXCLUDED.id_tipo_asociacion,
            nombre_asociacion = EXCLUDED.nombre_asociacion,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted;
          `,
          [id, nit, idRepresentante, idTipoAsociacion, nombre]
        );

        const wasInserted = result.rows[0]?.inserted;
        if (wasInserted) insertCount++;
        else updateCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con id_asociacion=${r.id_asociacion}: ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Actualizadas: ${updateCount}`);
    console.log(`   • Filas con error/omitidas: ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error general al cargar asociaciones:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadAsociaciones()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadAsociaciones;