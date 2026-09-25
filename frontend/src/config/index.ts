// Application configuration
// Note: Demo Mode vs Normal Mode is authoritative from backend environment (.env -> APP_MODE)
export const APP_CONFIG = {
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
};

export default APP_CONFIG;
