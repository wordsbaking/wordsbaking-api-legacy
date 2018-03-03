import * as dotEnv from 'dotenv';

dotEnv.config();

for (let key of Object.keys(process.env)) {
  let value = process.env[key];

  if (value === 'true') {
    (process.env as any)[key] = true;
  } else if (value === 'false') {
    (process.env as any)[key] = false;
  }
}
