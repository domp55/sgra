const URL_BACKEND = "http://localhost:3001";



import axios from 'axios';

// Metodo POST
export const POST = async (resource, data, token = "NONE") => {
    let headers = {
        headers: {
            "Accept": "application/json",
            "Content-Type": "application/json"
        }
    }
    if (token != "NONE") {
        headers = {
            headers: {
                "Accept": "application/json",
                "X-Access-Token": token
            }
        }
    }
    return await axios.post(URL_BACKEND + resource, data, headers)
}



export const GET = async (resource, token = "NONE") => {
    let headers = {
        headers: {
            "Accept": "application/json",
        }
    }
    if (token != "NONE") {
        headers = {
            headers: {
                "Accept": "application/json",
                "X-Access-Token": token,
            }
        }
    }
    return await axios.get(URL_BACKEND + resource, headers);
}


export const PATCH = async (resource, token = "NONE") => {
    let headers = {
        headers: {
            "Accept": "application/json",
        }
    }
    if (token != "NONE") {
        headers = {
            headers: {
                "Accept": "application/json",
                "X-Access-Token": token,
            }
        }
    }
    return await axios.patch(URL_BACKEND + resource, headers);
}