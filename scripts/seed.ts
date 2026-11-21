import { ensureSeed } from '../src/db/seed';
import { db } from '../src/db/connection';
ensureSeed();console.log({countries:db().prepare('SELECT COUNT(*) n FROM countries').get(),places:db().prepare('SELECT COUNT(*) n FROM places').get()});
