import type { IncomingMessage, ServerResponse } from 'http';
import { createHttpApp } from '../src/transports/http.js';

let app: ReturnType<typeof createHttpApp> | undefined;

function getApp(): ReturnType<typeof createHttpApp> {
  app ??= createHttpApp();
  return app;
}

export default function handler(req: IncomingMessage, res: ServerResponse): void {
  const httpApp = getApp();
  httpApp(req as never, res as never);
}
