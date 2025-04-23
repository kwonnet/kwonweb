// import mittEmitter, { EventEnum } from '@/mittEmitter'
import axios, { AxiosInstance } from 'axios'


function createRefreshTokenHandler() {
    let refreshTokenPromise: Promise<string | null> | null = null;
  
    return async function refreshToken(timeoutMs?: number): Promise<string | null> {
      if (refreshTokenPromise) {
        // If a refresh is already in progress, reuse the promise
        return refreshTokenPromise;
      }
  
      refreshTokenPromise = new Promise((resolve) => {
        let timeout: NodeJS.Timeout | null = null;
  
        // const handler = (token: string) => {
        //   console.log("New auth token received", token);
        //   mittEmitter.off(EventEnum.AUTH_TOKEN, handler); // Clean up the listener
        //   if (timeout) clearTimeout(timeout); // Clear the timeout if the event resolves first
        //   refreshTokenPromise = null; // Reset the promise for future calls
        //   resolve(token); // Resolve with the token value
        // };
  
        // // Add the event listener
        // mittEmitter.on(EventEnum.AUTH_TOKEN, handler);
  
        // // If a timeout is provided, resolve with null after the timeout
        // if (timeoutMs) {
        //   timeout = setTimeout(() => {
        //     mittEmitter.off(EventEnum.AUTH_TOKEN, handler); // Remove the listener to avoid leaks
        //     refreshTokenPromise = null; // Reset the promise for future calls
        //     console.warn("Token refresh timed out");
        //     resolve(null); // Resolve with null on timeout
        //   }, timeoutMs);
        // }
      });
  
      return refreshTokenPromise;
    };
  }

const refreshToken = createRefreshTokenHandler();

interface IAxios extends AxiosInstance {
    accessToken?: string | null
}

export const axiosAPI:IAxios = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_BASE_URL + '/api',
    withCredentials: true,
    
})

// intercept the request
axiosAPI.interceptors.request.use(async(config) => {
    const accessToken = axiosAPI.accessToken
    // if(!accessToken && !config.url?.includes("type=public")) return Promise.reject(new Error("No access token provided"))
    config.headers.set('Authorization', `Bearer ${accessToken}`)
    config.headers.set('Accept', 'application/json')
    return config
}, error => Promise.reject(new Error(error)))

//  intercept the response

axiosAPI.interceptors.response.use(async(response) => {
    return response
}, async function(error) {
    const originalRequest = error.config
    if(error?.response?.status === 403 && !originalRequest._retry){
        try {
            originalRequest._retry = true
            // mittEmitter.emit(EventEnum.AUTH_ERROR, "retry")
            const token = await refreshToken(3000)
            axiosAPI.accessToken = token
            return axiosAPI(originalRequest)
        } catch (err:any) {
            if(err?.response && err?.response?.data){
                return Promise.reject(err?.response?.data)
            }
            return Promise.reject(err)
        }
    }
    if(error?.response?.status === 403 && originalRequest._retry){
        // mittEmitter.emit(EventEnum.AUTH_FAILED, true)
    }
    return Promise.reject(error)
})




  