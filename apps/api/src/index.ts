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
