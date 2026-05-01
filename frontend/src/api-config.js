// Configuration de l'URL de l'API backend
const apiUrl =
  import.meta.env.VITE_API_URL || "https://planningphoto.onrender.com/api";
console.log("🔧 API_BASE_URL:", apiUrl);
console.log("🔧 VITE_API_URL env:", import.meta.env.VITE_API_URL);
export const API_BASE_URL = apiUrl;
