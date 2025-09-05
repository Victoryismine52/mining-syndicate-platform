import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';
import { generateOpenApi } from '../packages/card-builder/src/exportApi';
import type { CardConfig } from '../packages/card-builder/src/Editor';

const config: CardConfig = {
  name: 'Preview Card',
  elements: [],
  theme: 'light',
  shadow: 'none',
  lighting: 'none',
  animation: 'none',
};

const yaml = generateOpenApi(config);
const dist = join(process.cwd(), 'dist');
mkdirSync(dist, { recursive: true });
writeFileSync(join(dist, 'card.yaml'), yaml);
writeFileSync(join(dist, 'card.json'), JSON.stringify(config, null, 2));
console.log('Wrote OpenAPI spec and card JSON to dist/');
