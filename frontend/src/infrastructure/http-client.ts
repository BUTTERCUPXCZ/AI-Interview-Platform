// Infrastructure layer - HTTP client abstraction
// This abstracts away the specific HTTP library (axios) from the domain

import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'
import { DomainError, UnauthorizedError } from '../domain/entities'

export interface HttpClient {
    get<T>(url: string, config?: AxiosRequestConfig): Promise<T>
    post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>
    delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>
}

export class AxiosHttpClient implements HttpClient {
    private client: AxiosInstance

    constructor(baseURL: string = '/api') {
        this.client = axios.create({
            baseURL,
            withCredentials: true, // Include cookies for authentication
            headers: {
                'Content-Type': 'application/json',
            },
        })

        // Request interceptor
        this.client.interceptors.request.use(
            (config) => {
                return config
            },
            (error) => {
                return Promise.reject(error)
            }
        )

        // Response interceptor for error handling
        this.client.interceptors.response.use(
            (response: AxiosResponse) => {
                return response
            },
            (error) => {
                if (error.response?.status === 401) {
                    throw new UnauthorizedError()
                }

                if (error.response?.data?.error) {
                    throw new DomainError(
                        error.response.data.error,
                        'API_ERROR',
                        error.response.status
                    )
                }

                if (error.code === 'NETWORK_ERROR') {
                    throw new DomainError(
                        'Network error. Please check your connection.',
                        'NETWORK_ERROR',
                        0
                    )
                }

                throw new DomainError(
                    error.message || 'An unexpected error occurred',
                    'UNKNOWN_ERROR',
                    error.response?.status || 500
                )
            }
        )
    }

    async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.get<T>(url, config)
        return response.data
    }

    async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.post<T>(url, data, config)
        return response.data
    }

    async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.put<T>(url, data, config)
        return response.data
    }

    async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
        const response = await this.client.delete<T>(url, config)
        return response.data
    }
}

// Singleton instance
export const httpClient = new AxiosHttpClient(import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api')