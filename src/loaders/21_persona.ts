import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface PersonaRow {
  id_persona?: string;
  nombre_miembro?: string;
  numero_identificacion?: string;
  id_tipo_documento?: string;
  id_tipo_persona?: string;
  id_representante_legal?: string;
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

async function loadPersonas(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/21_personas.csv");
  const rows: PersonaRow[] = [];

  // 📥 Leer CSV (usa punto y coma como delimitador)
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: PersonaRow) => rows.push(data))
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
    console.log("🌱 Iniciando carga de personas...");
    await client.query("BEGIN");

    for (const p of rows) {
      const id = parseNumber(p.id_persona);
      const nombre = sanitize(p.nombre_miembro);
      const numeroIdentificacion = sanitize(p.numero_identificacion);
      const idTipoPersona = parseNumber(p.id_tipo_persona);

      try {
        const result = await client.query(
          `
          INSERT INTO personas (
            id_persona,
            nombre_persona,
            numero_identificacion,
            id_tipo_persona
          ) VALUES ($1, $2, $3, $4)
          ON CONFLICT (id_persona) DO UPDATE 
          SET 
            nombre_persona = EXCLUDED.nombre_persona,
            numero_identificacion = EXCLUDED.numero_identificacion,
            id_tipo_persona = EXCLUDED.id_tipo_persona,
            updated_at = NOW()
          RETURNING xmax = 0 AS inserted;
          `,
          [id, nombre, numeroIdentificacion, idTipoPersona]
        );

        const wasInserted = result.rows[0]?.inserted;
        if (wasInserted) insertCount++;
        else updateCount++;
      } catch (err: any) {
        console.error(`❌ Error en fila con id_persona=${p.id_persona}: ${err.message}`);
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
      console.error("❌ Error general al cargar personas:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar directamente
if (require.main === module) {
  loadPersonas()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadPersonas;
