import { app } from './app';
import { env } from './config/env';

app.listen(env.port, () => {
  console.log(`Backend server is running on http://localhost:${env.port}`);
});

