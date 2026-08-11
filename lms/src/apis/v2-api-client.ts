import {ApiClient} from "@/apis/api-client";

export const V2ApiClient = new ApiClient({
  baseURL: import.meta.env.VITE_API_DOMAIN_NAME,
  timeout: 10000,
  withCredentials: true
})