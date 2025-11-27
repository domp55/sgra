import { PATCH, POST } from "./Connection";
import { GET} from "./Connection";


export async function desactivarCuenta(external,token) {
    let datos = null;
    try{
        datos = await PATCH('/api/cuenta/desactivar/'+ external, token);
    }
    catch(error){ 
        return error;
    }
    return datos.data
}
export async function aceptarCuenta(external,token) {
    let datos = null;
    try{
        datos = await PATCH('/api/cuenta//aprobar/'+ external, token);
    }
    catch(error){ 
        return error;
    }
    return datos.data
}

export async function listarCuentas(token) {
    let datos = null;
    try{
        datos = await GET('/api/cuenta/listarCuentas', token);
    }
    catch(error){
        return error;
    }
    console.log(datos.data);
    return datos.data
}

export async function registroUsuario(data) {
    let datos = null;
    try {
        datos = await POST("/api/cuenta/registro", data);
    } catch (error) {
        console.log(error);
        return error;

    }

    return datos.data;
}