import { translations } from './src/translations';

function getKeys(obj: any, prefix = ''): string[] {
  if (typeof obj !== 'object' || obj === null) return [];
  if (Array.isArray(obj)) {
    return [prefix]; // count object arrays as one unit? Wait, arrays are tricky.
  }
  let keys: string[] = [];
  for (const [key, value] of Object.entries(obj)) {
    const fullPath = prefix ? `${prefix}.${key}` : key;
    keys.push(fullPath);
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      keys = keys.concat(getKeys(value, fullPath));
    }
  }
  return keys;
}

const enKeys = new Set(getKeys(translations.en));
const ruKeys = new Set(getKeys(translations.ru));
const uzKeys = new Set(getKeys(translations.uz));

let missing = false;

for (const key of enKeys) {
  if (!ruKeys.has(key)) { console.log(`RU missing key: ${key}`); missing = true; }
  if (!uzKeys.has(key)) { console.log(`UZ missing key: ${key}`); missing = true; }
}

for (const key of ruKeys) {
  if (!enKeys.has(key)) { console.log(`EN missing key (exists in RU): ${key}`); missing = true; }
}

for (const key of uzKeys) {
  if (!enKeys.has(key)) { console.log(`EN missing key (exists in UZ): ${key}`); missing = true; }
}

if (!missing) {
  console.log("All languages have perfectly matching translation keys!");
}
