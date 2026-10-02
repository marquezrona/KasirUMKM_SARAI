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

// Demo HMAC secret matches backend HMAC_SECRET. In production this would be a
// per-device key exchanged via secure channel — this is a prototype/demo only.
const HMAC_SECRET_DEMO = "k4s1r-s4bu-r41ju4-hmac-2026-secret";

async function hmacSHA256Hex(message, key) {
  const enc = new TextEncoder();
  const cryptoKey = await window.crypto.subtle.importKey(
    "raw", enc.encode(key),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const sig = await window.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, "0")).join("");
}

export async function signTransaction({ clientTxnId, total, deviceId, nonce }) {
  const msg = `${clientTxnId}|${total}|${deviceId}|${nonce}`;
  return await hmacSHA256Hex(msg, HMAC_SECRET_DEMO);
}

export function getDeviceId() {
  let id = localStorage.getItem("device_id");
  if (!id) {
    id = "DEV-" + Math.random().toString(36).slice(2, 10).toUpperCase();
    localStorage.setItem("device_id", id);
  }
  return id;
}
