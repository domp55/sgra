import { PATCH, POST } from "./Connection";
import { GET } from "./Connection";




export async function listarVersiones(external, token) {
  let datos = null;
  try {
    datos = await GET("/api/version/listarVersiones/" +external, token);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}

export async function eliminarRequisito(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/version/eliminarRequisito/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}