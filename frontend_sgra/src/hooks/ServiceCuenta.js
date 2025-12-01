import { PATCH, POST } from "./Connection";
import { GET } from "./Connection";

export async function desactivarCuenta(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/cuenta/desactivar/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}

export async function aceptarCuenta(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/cuenta/aprobar/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}

export async function listarCuentas(token) {
  let datos = null;
  try {
    datos = await GET("/api/cuenta/listarCuentas", token);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}

export async function listarCuentasPorAprobar(token) {
  let datos = null;
  try {
    datos = await GET("/api/cuenta/listarCuentasPorAprobar", token);
    console.log(datos);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}

export async function listarCuentasAprobadas(token) {
  let datos = null;
  console.log("hookks   " +token);
  try {
    datos = await GET("/api/cuenta/listarCuentasAprobadas", token);
    console.log(datos);
  } catch (error) {
    return error;
  }
  console.log(datos.data);
  return datos.data;
}

export async function registroUsuario(data) {
  let datos = null;
  try {
    datos = await POST("/api/cuenta/registro", data);
  } catch (error) {
    console.log(error);
    return error;
  }

  return datos;
}

export async function cambiarEstadoCuenta(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/cuenta/cambiarEstado/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}

export async function eliminarCuenta(external, token) {
  let datos = null;
  try {
    datos = await PATCH("/api/cuenta/eliminar/" + external, token);
  } catch (error) {
    return error;
  }
  return datos.data;
}