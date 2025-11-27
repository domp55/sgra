import { POST } from "./Connection";
import { save, saveToken } from "./SessionUtil";

export async function inicio_sesion(data) {
    try {
        const sesion = await POST('/api/privado/cuenta/sesion', data, "");
        console.log(sesion)
        // Si todo está bien
        if (sesion.code === 200 && sesion.token) {
            saveToken(sesion.token);
            save('user', sesion.user);
            save('external', sesion.external);
        }

        return sesion;

    } catch (error) {
        if (error.response && error.response.data) {
            return error.response.data; 
        }
    }
}