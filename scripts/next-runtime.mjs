import {registerRuntime} from './patch-runtime.mjs';
await registerRuntime(process.cwd(), 'web server');
