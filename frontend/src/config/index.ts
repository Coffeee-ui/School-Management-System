export type AppMode = 'normal' | 'demo';

const mode: AppMode =
  (import.meta.env.VITE_APP_MODE as string)?.toLowerCase() === 'demo' ? 'demo' : 'normal';

export const APP_CONFIG = {
  MODE: mode,
  DEMO_MODE: mode === 'demo',
  NORMAL_MODE: mode === 'normal',
  API_BASE_URL: import.meta.env.VITE_API_URL || '/api',
};

export default APP_CONFIG;
