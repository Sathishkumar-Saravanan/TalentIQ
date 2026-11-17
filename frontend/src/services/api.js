import axios from "axios";

let loadingHandlers = {
  startLoading: () => {},
  stopLoading: () => {},
};

export const configureLoading = (handlers) => {
  loadingHandlers = handlers;
};

/* =====================================================
   AXIOS INSTANCE
===================================================== */

const API = axios.create({
  baseURL:
    import.meta.env.VITE_API_URL ||
    "http://localhost:5000/api",

  headers: {
    "Content-Type": "application/json",
  },
});

/* =====================================================
   REQUEST INTERCEPTOR
===================================================== */

API.interceptors.request.use(
  (config) => {
    loadingHandlers.startLoading();

    /* -----------------------------------------------
       GET JWT TOKEN
    ------------------------------------------------ */

    const token =
      localStorage.getItem("token") ||
      localStorage.getItem("talentIQToken") ||
      localStorage.getItem("authToken") ||
      localStorage.getItem("accessToken");

    /* -----------------------------------------------
       ATTACH TOKEN
    ------------------------------------------------ */

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },

  (error) => {
    loadingHandlers.stopLoading();

    return Promise.reject(error);
  }
);

/* =====================================================
   RESPONSE INTERCEPTOR
===================================================== */

API.interceptors.response.use(
  (response) => {
    loadingHandlers.stopLoading();

    return response;
  },

  (error) => {
    loadingHandlers.stopLoading();

    /* -----------------------------------------------
       OPTIONAL AUTH ERROR HANDLING
    ------------------------------------------------ */

    if (error.response?.status === 401) {
      console.warn("Authentication expired or invalid.");
    }

    return Promise.reject(error);
  }
);

export default API;