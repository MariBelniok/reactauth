import axios, { Axios, AxiosError } from "axios";
import { parseCookies, setCookie } from "nookies";
import { signOut } from "../contexts/AuthContext";
import { AuthTokenError } from "./errors/AuthTokenError";

let isRefreshing = false;
let failedRequestsQueue: any[] = [];

export function setupAPIClient(ctx = undefined) {
  let cookies = parseCookies(ctx);
  const api = axios.create();

  (api.defaults.baseURL = "http://localhost:3333"),
  (api.defaults.headers.common[
    "Authorization"
  ] = `Baerer ${cookies["nextauth.token"]}`);

  api.interceptors.response.use(response => {
    return response;
  }, (error: AxiosError) => {
    if (error.response.status === 401) {
      if(error.response.data?.code === 'token.expired') {
        // renovar o token
        cookies = parseCookies(ctx);
  
        const { 'nextauth.refreshToken': refreshToken } = cookies;
        const originalConfig = error.config;
  
        if (!isRefreshing) {
          isRefreshing = true;
          console.log('refresh')
          
          api.post('/refresh', {
            refreshToken
          }).then(response => {
            const { token } = response.data;
    
            setCookie(ctx, 'nextauth.token', token, { // tratar/setar/destruir pelo lado do browser - NOME DO COOKIE - valor do token - opções do token
              maxAge: 60 * 60 * 24 * 30, // 30 dias
              path: '/', // Quais caminhos da app vão ter acesso  
            }) 
            setCookie(ctx, 'nextauth.refreshToken', response.data.refreshToken, {
              maxAge: 60 * 60 * 24 * 30,
              path: '/',
            }) 
    
            api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  
            failedRequestsQueue.forEach(request => request.onSuccess(token));
            failedRequestsQueue = []
          }).catch(err => {
            failedRequestsQueue.forEach(request => request.onFailure(err));
            failedRequestsQueue = []
  
            if(process.browser) {
              signOut();
            }
          }).finally(() => {
            !isRefreshing
          })
        }
        return new Promise((resolve, reject) => {
          failedRequestsQueue.push({
            onSuccess: (token: string) => {
              originalConfig.headers.common['Authorization'] = `Bearer ${token}`;
  
              resolve(api(originalConfig))
            },
            onFailure: (err: AxiosError) => {
              reject(err)
            },
          })
        })
      } else {
        if(process.browser) {
          signOut();
        } else {
          return Promise.reject(new AuthTokenError())
        }
      }
    }
  
    return Promise.reject(error);
  });

  return api;
}
