import {ApiClient} from "@/apis/api-client";

export const V2ApiClient = new ApiClient({
  baseURL: import.meta.env.VITE_STATIC_BASE_URL + ":8085" + import.meta.env.VITE_BASE_PATH,
  timeout: 10000
})