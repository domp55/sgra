import { POST, PUT } from "./Connection";
import { save, saveToken } from "./SessionUtil";

export async function inicio_sesion(data) {
    try {
        const sesion = await POST('/api/privado/cuenta/sesion', data, "");
        console.log(sesion)
        // Si todo está bien
        if (sesion.code === 200 && sesion.token) {
            saveToken(sesion.token);
            save('user', sesion.user);
            save('external_cuenta', sesion.external_cuenta);
            save('external', sesion.external_persona);
        }

        return sesion;

    } catch (error) {
        if (error.response && error.response.data) {
            return error.response.data;
        }
    }
}

export const resetearContrasena = async (correo, token = "") => {
    try {
        const respuesta = await PUT(
            "/api/privado/admin/restablecer",
            { correo }, // <-- aquí lo metemos en un objeto
            token
        );
        return respuesta;
    } catch (error) {
        console.error("Error en resetearContrasena:", error);
        return error.response?.data || { msg: "Error desconocido" };
    }
};