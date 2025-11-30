import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface RepresentanteLegalRow {
  id_representante_legal?: string;
  nombre_representante_legal?: string;
  id_tipo_documento?: string;
  numero_identificacion?: string;
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

async function loadRepresentantesLegales(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/31_representante_legal.csv");
  const rows: RepresentanteLegalRow[] = [];

  // 📥 Leer CSV (usa punto y coma como delimitador)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: RepresentanteLegalRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de representantes legales...");
    await client.query("BEGIN");

    for (const r of rows) {
      const id = parseNumber(r.id_representante_legal);
      const nombre = sanitize(r.nombre_representante_legal);
      const idTipoDocumento = parseNumber(r.id_tipo_documento);
      const numeroIdentificacion = sanitize(r.numero_identificacion);

      try {
        const result = await client.query(
          `
          INSERT INTO representante_legal (
            id_representante_legal,
            nombre_representante_legal,
            id_tipo_documento,
            numero_identificacion
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_representante_legal) DO UPDATE 
          SET 
            nombre_representante_legal = EXCLUDED.nombre_representante_legal,
            id_tipo_documento = EXCLUDED.id_tipo_documento,
            numero_identificacion = EXCLUDED.numero_identificacion,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted;
          `,
          [id, nombre, idTipoDocumento, numeroIdentificacion]
        );

        const wasInserted = result.rows[0]?.inserted;
        if (wasInserted) insertCount++;
        else updateCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con id_representante_legal=${r.id_representante_legal}: ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Actualizadas: ${updateCount}`);
    console.log(`   • Filas con error: ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    if (error instanceof Error) {
      console.error("❌ Error general al cargar representantes legales:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadRepresentantesLegales()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadRepresentantesLegales;
