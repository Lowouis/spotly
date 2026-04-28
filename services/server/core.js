import Cors from 'cors';

const trustedOrigin = process.env.NEXTAUTH_URL
    ? new URL(process.env.NEXTAUTH_URL).origin
    : 'http://localhost:3000';

export function isAllowedOrigin(origin) {
  if (!origin) return true;

  try {
    const originUrl = new URL(origin);
    const trustedUrl = new URL(trustedOrigin);
    const isLocalDevOrigin = process.env.NODE_ENV !== 'production'
        && ['localhost', '127.0.0.1'].includes(originUrl.hostname)
        && ['localhost', '127.0.0.1'].includes(trustedUrl.hostname)
        && originUrl.port === trustedUrl.port;

    return origin === trustedOrigin || isLocalDevOrigin;
  } catch {
    return false;
  }
}

// Initializing the cors middleware
const cors = Cors({
  methods: ['GET', 'HEAD', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  origin: (origin, callback) => {
    callback(null, isAllowedOrigin(origin));
  },
  credentials: true,
});

// Helper method to wait for a middleware to execute before continuing
// And to add CORS headers to the response
export function runMiddleware(req, res) {
  return new Promise((resolve, reject) => {
    cors(req, res, (result) => {
      if (result instanceof Error) {
        return reject(result);
      }
      return resolve(result);
    });
  });
}
