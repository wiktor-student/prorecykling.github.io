// Kopiuje biblioteki z node_modules do vendor/ (self-hosting – brak zależności od CDN).
import { cpSync, mkdirSync } from 'node:fs';

mkdirSync('vendor/countup', { recursive: true });
cpSync('node_modules/countup.js/dist/countUp.umd.js', 'vendor/countup/countUp.umd.js');
cpSync('node_modules/countup.js/LICENSE.md', 'vendor/countup/LICENSE.md');
console.log('vendor/ zaktualizowany');
