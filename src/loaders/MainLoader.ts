// src/loaders/load-all.ts
import pool from "../config/db";

// Importar todos los loaders que has creado
import loadEstadosUsuario from "./3_load_estados_usuarios";
import loadTiposDocumento from "./4_load_tipos_documentos";
import loadSectores from "./6_load_sectores";
import loadDependencias from "./7_load_dependencias";
import loadLineasEstrategicas from "./8_load_linea_estrategica";
import loadLineasEstrategicasSectores from "./9_linea_estrategica_sectores";
import loadProgramas from "./10_programas";
import loadBarriosLocalidad from "./13_localidades_barrio";
import loadProyectosEstado from "./14_proyecto_estado";
import loadProyectosSubestado from "./15_proyecto_subestado";
import loadTiposAsociacion from "./18_tipo_asociacion";
import loadTiposPersona from "./20_tipo_persona";
import loadTiposAvance from "./24_tipo_avance";
import loadTiposSeguimiento from "./26_tipo_segumiento";


async function loadAll() {
  try {
    console.log("🚀 Iniciando carga de todos los CSVs...");
    await loadEstadosUsuario();
    await loadTiposDocumento();
    await loadSectores();
    await loadDependencias();
    await loadLineasEstrategicas();
    await loadLineasEstrategicasSectores();
    await loadProgramas();
    await loadBarriosLocalidad();
    await loadProyectosEstado();
    await loadProyectosSubestado();
    await loadTiposAsociacion();
    await loadTiposPersona();
    await loadTiposAvance();
    await loadTiposSeguimiento();

    console.log("🎉 Todos los CSVs fueron cargados correctamente.");
  } catch (error) {
    if (error instanceof Error) console.error("❌ Error global al cargar CSVs:", error.message);
    else console.error("❌ Error desconocido al cargar CSVs:", error);
  } finally {
    await pool.end();
  }
}

// Ejecutar solo si se corre directamente
if (require.main === module) {
  loadAll();
}

export default loadAll;
