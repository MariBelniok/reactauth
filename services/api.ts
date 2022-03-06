import axios, { Axios, AxiosError } from 'axios';
import { parseCookies, setCookie } from 'nookies';
import { signOut } from '../contexts/AuthContext';

let cookies = parseCookies();
let isRefreshing = false;
let failedRequestsQueue: any[] = [];

export const api = axios.create();

api.defaults.baseURL = 'http://localhost:3333',
api.defaults.headers.common['Authorization'] = `Baerer ${cookies['nextauth.token']}`;

api.interceptors.response.use(response => {
    return response;
}, (error: AxiosError) => {
    if (error.response?.status === 401) {
        if (error.response.data?.code === 'token.expired') {
            cookies = parseCookies()

            const { 'nextauth.refreshToken': refreshToken } = cookies;
            const originalConfig = error.config;

            if(!isRefreshing) {
                isRefreshing = true;

                api.post('/refresh', {
                    refreshToken
                }).then(response => {
                    const { token } = response.data;
    
                    setCookie(undefined, 'nextauth.token', token, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: '/'
                    });
    
                    setCookie(undefined, 'nextauth.refreshToken', response.data.refreshToken, {
                        maxAge: 60 * 60 * 24 * 30,
                        path: '/'
                    });
    
                    api.defaults.headers.common['Authorization'] = `Baerer ${token}`

                    failedRequestsQueue.forEach(request => request.onSuccess(token));
                    failedRequestsQueue = [];
                }).catch(err => {
                    failedRequestsQueue.forEach(request => request.onSuccess(err));
                    failedRequestsQueue = [];
                }).finally(() => {
                    isRefreshing = false;
                })
            }

            return new Promise((resolve, reject) => {
                failedRequestsQueue.push({
                    onSuccess: (token: string) => {
                        if(!originalConfig.headers) {
                            console.log('originalConfig.headers is undefined');
                            return;
                        }

                        originalConfig.headers['Authorization'] = `Baerer ${token}`;

                        resolve(api(originalConfig));
                    },
                    onFail: (err: AxiosError) => {
                        reject(err);
                    } 
                })
            })
        } else {
            signOut();
        }
    }

    return Promise.reject(error);
})