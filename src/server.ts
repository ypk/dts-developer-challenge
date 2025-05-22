import express from 'express';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import path, { dirname } from 'path';
import cors from 'cors';
import logSymbols from 'log-symbols';
import apiRoutes from './routes/api.routes.ts';
import frontendRoutes from './routes/frontend.routes.js';
import ejsLayouts from 'express-ejs-layouts';
import compression from 'compression';
import { setupSwagger } from './utils/swagger.ts';
import { APIErrorHandler, FrontEndErrorHandler } from './middleware/error.middleware.ts';
import { requestLogger } from './middleware/logger.middleware.ts';
import { securityHeaders, logSecurityConfig } from './middleware/security.middleware.ts';
import { apiLimiter, authLimiter } from './middleware/rate-limit.middleware.ts';
import { getSVG, formatStatus, safelyApplyMiddleware } from './utils/middleware.utils.ts';
import crypto from 'crypto';
import dartSass from 'express-dart-sass';
import session from 'express-session';
import flash from 'connect-flash';
import methodOverride from 'method-override';

const generateSessionSecret = () => {
  return crypto.randomBytes(64).toString('hex');
};

/**
 * @swagger
 * info:
 *   title: Case Management API
 *   description: API for managing case information
 *   version: 1.0.0
 *   contact:
 *     name: HMCTS
 */

const apiPath = '/api';
const authPath = '/api/auth';
const assetsPath = '/assets';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const staticAssetsPath = path.join(__dirname, '../public/assets');
const viewPath = path.join(__dirname, './views');
const sassSrcPath = path.join(__dirname, '../assets/sass');
const sassDestPath = path.join(__dirname, '../public/assets/stylesheets');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';

dotenv.config({ path: path.resolve(process.cwd(), envFile) });

console.log(
  `Loading environment from ${envFile} (NODE_ENV: ${process.env.NODE_ENV || 'development'})`,
);

logSecurityConfig();

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.SESSION_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('ERROR: SESSION_SECRET environment variable is required in production');
    process.exit(1);
  } else {
    console.warn(
      'WARNING: Using randomly generated session secret. Sessions will be invalidated on server restart.',
    );
  }
}

const sessionSecret = process.env.SESSION_SECRET || generateSessionSecret();

safelyApplyMiddleware(app, 'JSON parser', () => app.use(express.json()));

safelyApplyMiddleware(app, 'URL encoded parser', () =>
  app.use(express.urlencoded({ extended: true })),
);

safelyApplyMiddleware(app, 'CORS', () => app.use(cors()));

safelyApplyMiddleware(app, 'Security headers', () => app.use(securityHeaders));

safelyApplyMiddleware(app, 'Compression', () => app.use(compression()));

safelyApplyMiddleware(app, 'Request logger', () => app.use(requestLogger));

safelyApplyMiddleware(app, 'API rate limiter', () => app.use(apiPath, apiLimiter));

safelyApplyMiddleware(app, 'Auth rate limiter', () => app.use(authPath, authLimiter));

safelyApplyMiddleware(app, 'View Engine Setup', () => {
  app.set('views', viewPath);
  app.set('view engine', 'ejs');
});

safelyApplyMiddleware(app, 'Static Files', () =>
  app.use('/assets', express.static(staticAssetsPath)),
);

safelyApplyMiddleware(app, 'SVG Helper', () =>
  app.use((req, res, next) => {
    res.locals.getSVG = (filename: string) => getSVG(filename);
    next();
  }),
);

safelyApplyMiddleware(app, 'Method Override', () =>
  app.use(
    methodOverride((req, _res) => {
      if (req.body && typeof req.body === 'object' && '_method' in req.body) {
        const method = req.body._method;
        delete req.body._method;
        return method;
      }
    }),
  ),
);

safelyApplyMiddleware(app, 'Session', () =>
  app.use(
    session({
      secret: sessionSecret,
      resave: false,
      saveUninitialized: false,
    }),
  ),
);

safelyApplyMiddleware(app, 'Flash Messages', () => app.use(flash()));

safelyApplyMiddleware(app, 'SASS Middleware', () =>
  app.use(
    dartSass({
      src: sassSrcPath,
      dest: sassDestPath,
      outputStyle: 'compressed',
      prefix: `${assetsPath}/stylesheets`,
    }),
  ),
);

safelyApplyMiddleware(app, 'EJS Layouts', () => {
  app.use(ejsLayouts);
  app.set('layout', 'layouts/main');
  app.set('layout extractScripts', true);
  app.set('layout extractStyles', true);
});

safelyApplyMiddleware(app, 'Template Locals', () =>
  app.use((req, res, next) => {
    res.locals.messages = {
      success: req.flash('success'),
      error: req.flash('error'),
    };
    res.locals.paths = {
      assets: assetsPath,
    };
    res.locals.currentPath = req.path;
    res.locals.formatStatus = formatStatus;
    next();
  }),
);

safelyApplyMiddleware(app, 'Frontend Routes', () => app.use('/', frontendRoutes));

safelyApplyMiddleware(app, 'API routes', () => app.use('/api', apiRoutes));

safelyApplyMiddleware(app, 'FrontEnd Error handler', () => app.use(FrontEndErrorHandler));

safelyApplyMiddleware(app, 'API Error handler', () => app.use(APIErrorHandler));

app.get('/health', (req, res) => {
  const healthStatus: {
    status: string;
    environment: string | undefined;
    securityEnabled?: boolean;
  } = {
    status: 'ok',
    environment: process.env.NODE_ENV,
  };

  if (process.env.NODE_ENV === 'production') {
    healthStatus.securityEnabled = true;
  }

  res.status(200).json(healthStatus);
});

if (typeof setupSwagger === 'function') {
  safelyApplyMiddleware(app, 'Swagger documentation', () => setupSwagger(app));
}

if (process.env.NODE_ENV !== 'test') {
  try {
    app.listen(port, () => {
      console.log(logSymbols.success, ` Server is running on port ${port}`);
      console.log(
        logSymbols.info,
        ` API Documentation available at http://localhost:${port}/api-docs`,
      );
    });
  } catch (error) {
    console.error(
      logSymbols.error,
      ` Failed to start server:`,
      error instanceof Error ? error.message : 'Unknown error',
    );
    process.exit(1);
  }
}

export default app;
