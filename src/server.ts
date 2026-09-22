import 'dotenv/config';
import { PORT } from './config';
import { App } from './app';

const app = new App(PORT);

app.listen();