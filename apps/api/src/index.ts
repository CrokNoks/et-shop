import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { onRequest } from 'firebase-functions/v2/https';

const server = express();
let isReady = false;

const createNestServer = async (expressInstance: express.Express) => {
  const app = await NestFactory.create(
    AppModule,
    new ExpressAdapter(expressInstance),
  );
  app.enableCors();
  await app.init();
};

export const api = onRequest({ region: 'europe-west1' }, async (request, response) => {
  if (!isReady) {
    await createNestServer(server);
    isReady = true;
  }
  return server(request, response);
});

// For local development
async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  const port = process.env.PORT || 3000;
  await app.listen(port);
  console.log(`API is running on http://localhost:${port}`);
}

// Start local server only if NOT running in any Firebase environment (Cloud, Emulator, or CLI Discovery)
if (
  !process.env.FUNCTION_NAME &&
  !process.env.K_SERVICE &&
  !process.env.FUNCTIONS_EMULATOR &&
  !process.env.FIREBASE_CONFIG
) {
  bootstrap();
}
