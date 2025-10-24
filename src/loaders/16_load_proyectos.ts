import fs from "fs";
import path from "path";
import csv from "csv-parser";
import pool from "../config/db";

interface ProyectoRowRaw {
  [k: string]: string | undefined;
}

function logInvalidValue(col: string, value: string | undefined, proyecto: string | null) {
  console.warn(
    `⚠️ Valor inválido '${value ?? "undefined"}' en columna '${col}' → reemplazado por NULL ${
      proyecto ? `(proyecto=${proyecto})` : ""
    }`
  );
}

function safeInt(v: string | undefined, col: string, proyecto: string | null): number | null {
  if (!v) return null;
  const t = v.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  const n = Number(t.replace(/\s+/g, ""));
  if (Number.isNaN(n)) {
    logInvalidValue(col, v, proyecto);
    return null;
  }
  return Math.trunc(n);
}

function safeFloatFromMoney(v: string | undefined, col: string, proyecto: string | null): number | null {
  if (!v) return null;
  const t = v.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  const cleaned = t.replace(/[^\d,.-]/g, "").replace(/\./g, "").replace(",", ".");
  const n = Number(cleaned);
  if (Number.isNaN(n)) {
    logInvalidValue(col, v, proyecto);
    return null;
  }
  return n;
}

function safeCoord(v: string | undefined, col: string, proyecto: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  if (t.match(/[A-Za-z]/)) {
    logInvalidValue(col, v, proyecto);
    return null;
  }
  return t.replace(/\s+/g, "").replace(",", ".");
}

function parseFechaIso(v: string | undefined, col: string, proyecto: string | null): string | null {
  if (!v) return null;
  const t = v.trim();
  if (t === "" || t.toLowerCase() === "null") return null;
  const parts = t.split("/");
  if (parts.length !== 3) {
    logInvalidValue(col, v, proyecto);
    return null;
  }
  const [d, m, y] = parts;
  if (!d || !m || !y) {
    logInvalidValue(col, v, proyecto);
    return null;
  }
  return `${y.padStart(4, "0")}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
}

function parseBool(v: string | undefined): boolean | null {
  if (!v) return null;
  const t = v.trim().toLowerCase();
  if (t === "true" || t === "1" || t === "t") return true;
  if (t === "false" || t === "0" || t === "f") return false;
  return null;
}

async function loadProyectos(): Promise<void> {
  const filePath = path.join(__dirname, "../seeders/16_proyectos.csv");
  const rows: ProyectoRowRaw[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv({ separator: ";" }))
      .on("data", (data: ProyectoRowRaw) => {
        if (Object.prototype.hasOwnProperty.call(data, "")) delete data[""];
        rows.push(data);
      })
      .on("end", () => resolve())
      .on("error", (err) => reject(err));
  });

  console.log(`📄 CSV cargado: ${rows.length} filas encontradas.`);

  if (rows.length === 0) return;

  const client = await pool.connect();

  let inserted = 0;
  let updated = 0;
  let skipped = 0;
  let errorCount = 0;

  try {
    console.log("🚀 Iniciando carga de proyectos...");
    await client.query("BEGIN");

    for (const r of rows) {
      const nombreProyecto = r["nombre_proyecto"]?.trim() || null;

      // conversión con detección de errores
      const idProyecto = safeInt(r["id_proyecto"], "id_proyecto", nombreProyecto);
      const direccion =
        r["direccion"] && r["direccion"].trim().toLowerCase() !== "null"
          ? r["direccion"].trim()
          : null;
      const idPrograma = safeInt(r["id_programa"], "id_programa", nombreProyecto);
      const idProyectoEstado = safeInt(r["id_proyecto_estado"], "id_proyecto_estado", nombreProyecto);
      const idProyectoSubestado = safeInt(
        r["id_proyecto_subestado"],
        "id_proyecto_subestado",
        nombreProyecto
      );
      const coordenadaX = safeCoord(r["coordenada_x"], "coordenada_x", nombreProyecto);
      const coordenadaY = safeCoord(r["coordenada_y"], "coordenada_y", nombreProyecto);

      const valor_inicial_obra = safeFloatFromMoney(
        r["valor_inicial_obra"],
        "valor_inicial_obra",
        nombreProyecto
      );
      const valor_total_adicionado_obra = safeFloatFromMoney(
        r["valor_total_adicionado_obra"],
        "valor_total_adicionado_obra",
        nombreProyecto
      );
      const valor_total_facturado_obra = safeFloatFromMoney(
        r["valor_total_facturado_obra"],
        "valor_total_facturado_obra",
        nombreProyecto
      );
      const valor_total_pagado_obra = safeFloatFromMoney(
        r["valor_total_pagado_obra"],
        "valor_total_pagado_obra",
        nombreProyecto
      );

      const valor_inicial_interventoria = safeFloatFromMoney(
        r["valor_inicial_interventoria"],
        "valor_inicial_interventoria",
        nombreProyecto
      );
      const valor_total_adicionado_interventoria = safeFloatFromMoney(
        r["valor_total_adicionado_interventoria"],
        "valor_total_adicionado_interventoria",
        nombreProyecto
      );
      const valor_total_facturado_interventoria = safeFloatFromMoney(
        r["valor_total_facturado_interventoria"],
        "valor_total_facturado_interventoria",
        nombreProyecto
      );
      const valor_total_pagado_interventoria = safeFloatFromMoney(
        r["valor_total_pagado_interventoria"],
        "valor_total_pagado_interventoria",
        nombreProyecto
      );

      const fecha_entrega = parseFechaIso(r["fecha_entrega"], "fecha_entrega", nombreProyecto);
      const ampliacion_contractual = parseBool(r["ampliacion_contractual"]);

      // omitir fila sin id_programa
      if (idPrograma === null) {
        skipped++;
        console.warn(`⚠️ Omitida fila sin id_programa (proyecto=${nombreProyecto})`);
        continue;
      }

      await client.query("SAVEPOINT sp");
      try {
        if (idProyecto !== null) {
          const query = `
            INSERT INTO proyectos (
              id_proyecto, nombre_proyecto, direccion,
              id_programa, id_proyecto_estado, id_proyecto_subestado,
              coordenada_x, coordenada_y,
              valor_inicial_obra, valor_total_adicionado_obra, valor_total_facturado_obra, valor_total_pagado_obra,
              valor_inicial_interventoria, valor_total_adicionado_interventoria,
              valor_total_facturado_interventoria, valor_total_pagado_interventoria,
              fecha_entrega, ampliacion_contractual
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18
            )
            ON CONFLICT (id_proyecto)
            DO UPDATE SET
              nombre_proyecto = EXCLUDED.nombre_proyecto,
              direccion = EXCLUDED.direccion,
              id_programa = EXCLUDED.id_programa,
              id_proyecto_estado = EXCLUDED.id_proyecto_estado,
              id_proyecto_subestado = EXCLUDED.id_proyecto_subestado,
              coordenada_x = EXCLUDED.coordenada_x,
              coordenada_y = EXCLUDED.coordenada_y,
              valor_inicial_obra = EXCLUDED.valor_inicial_obra,
              valor_total_adicionado_obra = EXCLUDED.valor_total_adicionado_obra,
              valor_total_facturado_obra = EXCLUDED.valor_total_facturado_obra,
              valor_total_pagado_obra = EXCLUDED.valor_total_pagado_obra,
              valor_inicial_interventoria = EXCLUDED.valor_inicial_interventoria,
              valor_total_adicionado_interventoria = EXCLUDED.valor_total_adicionado_interventoria,
              valor_total_facturado_interventoria = EXCLUDED.valor_total_facturado_interventoria,
              valor_total_pagado_interventoria = EXCLUDED.valor_total_pagado_interventoria,
              fecha_entrega = EXCLUDED.fecha_entrega,
              ampliacion_contractual = EXCLUDED.ampliacion_contractual,
              updated_at = NOW()
            RETURNING xmax = 0 AS inserted;
          `;
          const vals = [
            idProyecto,
            nombreProyecto,
            direccion,
            idPrograma,
            idProyectoEstado,
            idProyectoSubestado,
            coordenadaX,
            coordenadaY,
            valor_inicial_obra,
            valor_total_adicionado_obra,
            valor_total_facturado_obra,
            valor_total_pagado_obra,
            valor_inicial_interventoria,
            valor_total_adicionado_interventoria,
            valor_total_facturado_interventoria,
            valor_total_pagado_interventoria,
            fecha_entrega,
            ampliacion_contractual,
          ];

          const res = await client.query(query, vals);
          const wasInserted = res.rows[0]?.inserted;
          if (wasInserted) inserted++;
          else updated++;
        } else {
          const query = `
            INSERT INTO proyectos (
              nombre_proyecto, direccion,
              id_programa, id_proyecto_estado, id_proyecto_subestado,
              coordenada_x, coordenada_y,
              valor_inicial_obra, valor_total_adicionado_obra, valor_total_facturado_obra, valor_total_pagado_obra,
              valor_inicial_interventoria, valor_total_adicionado_interventoria,
              valor_total_facturado_interventoria, valor_total_pagado_interventoria,
              fecha_entrega, ampliacion_contractual
            )
            VALUES (
              $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17
            )
            RETURNING id_proyecto;
          `;
          const vals = [
            nombreProyecto,
            direccion,
            idPrograma,
            idProyectoEstado,
            idProyectoSubestado,
            coordenadaX,
            coordenadaY,
            valor_inicial_obra,
            valor_total_adicionado_obra,
            valor_total_facturado_obra,
            valor_total_pagado_obra,
            valor_inicial_interventoria,
            valor_total_adicionado_interventoria,
            valor_total_facturado_interventoria,
            valor_total_pagado_interventoria,
            fecha_entrega,
            ampliacion_contractual,
          ];
          await client.query(query, vals);
          inserted++;
        }

        await client.query("RELEASE SAVEPOINT sp");
      } catch (err) {
        await client.query("ROLLBACK TO SAVEPOINT sp");
        errorCount++;
        console.error(`❌ Error en fila proyecto='${nombreProyecto}':`, (err as Error).message);
      }
    }

    await client.query("COMMIT");
    console.log("✅ Carga completada:");
    console.log(`   • Insertadas: ${inserted}`);
    console.log(`   • Actualizadas: ${updated}`);
    console.log(`   • Omitidas: ${skipped}`);
    console.log(`   • Filas con error: ${errorCount}`);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("❌ Error general:", (err as Error).message);
  } finally {
    client.release();
  }
}

if (require.main === module) {
  loadProyectos()
    .then(async () => {
      await pool.end();
    })
    .catch(async (e) => {
      console.error("❌ Error global:", e);
      await pool.end();
    });
}

export default loadProyectos;