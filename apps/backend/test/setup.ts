// Fixtures de entorno para que config/env.ts pase su validación al importarse en los tests.
// dotenv no sobreescribe variables ya definidas, así que esto debe ejecutarse antes de
// cualquier import que toque config/env.ts (vitest garantiza setupFiles antes que los tests).
process.env.NODE_ENV = "test";
process.env.PORT = "3001";
process.env.APP_BASE_URL = "http://localhost:3001";
process.env.FRONTEND_URL = "http://localhost:5173";
process.env.DATABASE_URL = "postgresql://test:test@localhost:5432/test";
process.env.JWT_SECRET = "test-jwt-secret-not-for-production";
process.env.TN_CLIENT_ID = "test-client-id";
process.env.TN_CLIENT_SECRET = "test-client-secret";
process.env.TN_REDIRECT_URI = "http://localhost:3001/auth/tiendanube/callback";
process.env.TN_API_BASE_URL = "https://api.tiendanube.com/v1";
process.env.S3_ENDPOINT = "http://localhost:9000";
process.env.S3_ACCESS_KEY = "test";
process.env.S3_SECRET_KEY = "test";
process.env.S3_BUCKET = "test-bucket";
process.env.S3_PUBLIC_URL = "http://localhost:9000/test-bucket";
process.env.TOKEN_ENCRYPTION_KEY = "0".repeat(64);
