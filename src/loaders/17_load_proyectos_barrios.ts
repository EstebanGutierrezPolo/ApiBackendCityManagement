import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ProyectoBarrioRow {
  id_proyecto: string;
  id_barrio: string;
}

async function loadProyectosBarrios(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/17_proyectos_barrios.csv");
  const rows: ProyectoBarrioRow[] = [];

  // 🧹 Eliminar BOM si existe
  const fileContent = fs.readFileSync(filePath, "utf-8").replace(/^\uFEFF/, "");
  const tempFile = path.join(__dirname, "../seeders/_temp_proyectos_barrios.csv");
  fs.writeFileSync(tempFile, fileContent);

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(tempFile)
      .pipe(csv({ separator: ",", mapHeaders: ({ header }) => header.trim().toLowerCase() }))
      .on("data", (data: ProyectoBarrioRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  fs.unlinkSync(tempFile);

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  const client = await pool.connect();

  let insertCount = 0;
  let skipCount = 0;
  let fkErrorCount = 0;
  let otherErrorCount = 0;

  try {
    console.log("🚀 Iniciando carga de proyectos_barrios...");

    for (const [index, r] of rows.entries()) {
      const id_proyecto = Number(r.id_proyecto);
      const id_barrio = Number(r.id_barrio);

      if (isNaN(id_proyecto) || isNaN(id_barrio)) {
        console.warn(`⚠️ Fila ${index + 1}: contiene NaN (id_proyecto=${r.id_proyecto}, id_barrio=${r.id_barrio})`);
        skipCount++;
        continue;
      }

      try {
        await client.query(
          `
          INSERT INTO proyectos_barrios (id_proyecto, id_barrio)
          VALUES ($1, $2)
          ON CONFLICT (id_proyecto, id_barrio) DO NOTHING;
          `,
          [id_proyecto, id_barrio]
        );
        insertCount++;
      } catch (err: any) {
        if (err.code === "23503") {
          fkErrorCount++;
          console.warn(
            `⚠️ Fila ${index + 1}: id_proyecto=${id_proyecto}, id_barrio=${id_barrio} → violación de llave foránea (FK)`
          );
          continue; // 👉 seguimos con la siguiente fila
        } else {
          otherErrorCount++;
          console.error(`❌ Error inesperado en fila ${index + 1}:`, err.message);
          continue;
        }
      }
    }

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas nuevas: ${insertCount}`);
    console.log(`   • Omitidas (NaN o inválidas): ${skipCount}`);
    console.log(`   • Fallidas por FK inexistente: ${fkErrorCount}`);
    console.log(`   • Otros errores: ${otherErrorCount}`);
  } catch (error) {
    if (error instanceof Error) {
      console.error("❌ Error general al cargar proyectos_barrios:", error.message);
    } else {
      console.error("❌ Error desconocido:", error);
    }
  } finally {
    client.release();
  }
}

if (require.main === module) {
  loadProyectosBarrios()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadProyectosBarrios;