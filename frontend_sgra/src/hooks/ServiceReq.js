import { GET, POST } from "./Connection";

export async function registrarRequisito(data, token) {
    // ... tu código de registrar (sin cambios si ya funciona) ...
    let datos = null;
    try {
        datos = await POST("/api/requisito/registrar", data, token);
        return datos; 
    } catch (error) {
        return error.response ? error.response.data : { code: 500, msg: error.message };
    }
}

// --- MODIFICA ESTA FUNCIÓN ---
export async function listarRequisitos(externalProyecto, token) {
    try {
        // Hacemos la petición GET
        const response = await GET(`/api/requisito/listar/${externalProyecto}`, token);
        
        // CORRECCIÓN CRÍTICA:
        // El log muestra que 'response' es un objeto Axios con { status: 200, data: {...}, ... }
        // Debemos retornar 'response.data' para que el componente reciba el JSON limpio.
        
        return response.data; 

    } catch (error) {
        return error.response ? error.response.data : { code: 500, msg: error.message };
    }
}