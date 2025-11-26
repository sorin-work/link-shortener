import type { User } from './db/schema.js';

export type AppEnv = {
  Variables: {
    user: User;
  };
};
