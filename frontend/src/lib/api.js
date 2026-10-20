import axios from "axios";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:8000";
export const API = `${BACKEND_URL}/api`;

export const api = axios.create({ baseURL: API });

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  return cfg;
});

api.interceptors.response.use(
  (r) => r,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") window.location.href = "/login";
    }
    return Promise.reject(err);
  }
);

export async function signTransaction({ clientTxnId, total, deviceId, nonce }) {
  const { data } = await api.post("/umkm/transactions/signature", {
    client_txn_id: clientTxnId,
    total,
    device_id: deviceId,
    nonce,
  });
  return data.signature;
}

export function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "DEV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem("device_id", id);
  }
  return id;
}
