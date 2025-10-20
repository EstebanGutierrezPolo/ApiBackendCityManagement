import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ContratoProyectoRow {
  id_proyecto?: string;
  id_contrato?: string;
}

async function loadContratosProyectos(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/33_contratos_proyectos.csv");
  const rows: ContratoProyectoRow[] = [];

  // 📥 Leer CSV
  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: "," })) // CSV separado por coma
      .on("data", (data: ContratoProyectoRow) => rows.push(data))
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  if (rows.length === 0) {
    console.log("⚠️ No se encontraron datos en el archivo CSV.");
    return;
  }

  const client = await pool.connect();
  let insertCount = 0;
  let skipCount = 0;

  try {
    console.log("🌱 Iniciando carga de contratos_proyectos...");
    await client.query("BEGIN");

    for (const r of rows) {
      const idProyecto = r.id_proyecto ? Number(r.id_proyecto) : null;
      const idContrato = r.id_contrato ? Number(r.id_contrato) : null;

      if (!idProyecto || !idContrato) {
        console.warn(`⚠️ Fila omitida: valores inválidos -> id_proyecto=${idProyecto}, id_contrato=${idContrato}`);
        skipCount++;
        continue;
      }

      try {
        await client.query(
          `
          INSERT INTO contratos_proyectos (id_proyecto, id_contrato)
          VALUES ($1, $2)
          ON CONFLICT (id_proyecto, id_contrato) 
          DO UPDATE SET 
            updated_at = NOW();
          `,
          [idProyecto, idContrato]
        );
        insertCount++;
      } catch (err: any) {
        console.error(`❌ Error insertando fila (proyecto=${idProyecto}, contrato=${idContrato}): ${err.message}`);
        skipCount++;
      }
    }

    await client.query("COMMIT");

    console.log("✅ Carga completada con éxito:");
    console.log(`   • Total filas en CSV: ${rows.length}`);
    console.log(`   • Insertadas/actualizadas: ${insertCount}`);
    console.log(`   • Omitidas o con error: ${skipCount}`);
  } catch (error) {
    await client.query("ROLLBACK");
    console.error("❌ Error general al cargar contratos_proyectos:", (error as Error).message);
  } finally {
    client.release();
  }
}

// 🚀 Ejecutar si se llama directamente
if (require.main === module) {
  loadContratosProyectos()
    .then(async () => {
      await pool.end();
    })
    .catch(async (err) => {
      console.error("❌ Error global:", err);
      await pool.end();
    });
}

export default loadContratosProyectos;
