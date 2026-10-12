import { createApiClient, ApiError } from '@stepwise/api-client';
// Web uses HttpOnly cookies (same origin via the Vite proxy in dev, or the API serving the built app).
export const api = createApiClient({ baseUrl: import.meta.env.VITE_API_URL || '' });
export { ApiError };
