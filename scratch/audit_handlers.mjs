// Audita cada handler HTTP bajo src/app/api/**: ¿tiene try/catch? ¿valida entrada?
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

function walk(dir, out = []) {
  for (const e of readdirSync(dir)) {
    const p = join(dir, e);
    if (statSync(p).isDirectory()) walk(p, out);
    else if (e === 'route.ts') out.push(p);
  }
  return out;
}

const METHODS = ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'];
const files = walk('src/app/api').sort();
const rows = [];

for (const f of files) {
  const src = readFileSync(f, 'utf8');
  for (const m of METHODS) {
    const re = new RegExp('export\\s+async\\s+function\\s+' + m + '\\s*\\(');
    const hit = re.exec(src);
    if (!hit) continue;

    // localizar la llave que abre el cuerpo, tras cerrar la lista de parámetros
    let depth = 0, start = -1;
    for (let k = hit.index; k < src.length; k++) {
      if (src[k] === '(') depth++;
      else if (src[k] === ')') { depth--; if (depth === 0) { start = src.indexOf('{', k); break; } }
    }
    let d = 0, end = start;
    for (let k = start; k < src.length; k++) {
      if (src[k] === '{') d++;
      else if (src[k] === '}') { d--; if (d === 0) { end = k; break; } }
    }
    const body = src.slice(start, end + 1);
    const route = f.split(/[\\/]/).join('/').replace('src/app/api', '').replace('/route.ts', '') || '/';
    rows.push({
      route,
      method: m,
      tryCatch: /\btry\s*\{/.test(body),
      zod: /\bz\.|safeParse|\.parse\(/.test(body),
      lines: body.split('\n').length,
    });
  }
}

const admin = rows.filter((r) => r.route.startsWith('/admin'));
const pub = rows.filter((r) => !r.route.startsWith('/admin'));

function table(label, list) {
  console.log('\n═══ ' + label + ' (' + list.length + ' handlers) ═══');
  for (const r of list) {
    console.log(
      (r.tryCatch ? '  ok ' : ' >>  ') + r.method.padEnd(6) + ' ' + r.route.padEnd(36) +
      ' try/catch=' + (r.tryCatch ? 'si' : 'NO ') + '  valida=' + (r.zod ? 'si' : 'no') +
      '  (' + r.lines + ' lineas)'
    );
  }
  const bad = list.filter((r) => !r.tryCatch);
  console.log('-> SIN try/catch: ' + bad.length + ' de ' + list.length);
  return bad;
}

const badAdmin = table('RUTAS ADMIN', admin);
const badPub = table('RUTAS PUBLICAS', pub);

console.log('\n═══ RESUMEN ═══');
console.log('admin GET sin try/catch : ' + badAdmin.filter((r) => r.method === 'GET').length);
console.log('admin (todos) sin t/c   : ' + badAdmin.length);
console.log('publicas sin try/catch  : ' + badPub.length);
console.log('\nADMIN GET SIN TRY/CATCH:');
for (const r of badAdmin.filter((r) => r.method === 'GET')) console.log('  ' + r.route);
console.log('\nPUBLICAS SIN TRY/CATCH:');
for (const r of badPub) console.log('  ' + r.method + ' ' + r.route);
