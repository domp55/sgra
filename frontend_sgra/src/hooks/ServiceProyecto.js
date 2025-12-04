import { PATCH, POST } from "./Connection";
import { GET } from "./Connection";



export async function aceptarProyecto(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/proyecto/cambiarEstado/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}

export async function listarProyectos(token) {
  let datos = null;
  try {
    datos = await GET("/api/proyecto/listarTodos", token);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}
export async function listarProyectosTodos(token) {
  let datos = null;
  try {
    datos = await GET("/api/proyecto/listarActivos", token);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}
