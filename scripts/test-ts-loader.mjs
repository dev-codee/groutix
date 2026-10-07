import { readFileSync, existsSync } from "node:fs";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const require = createRequire(import.meta.url);
const root = fileURLToPath(new URL("../", import.meta.url));

// Exercise the real TypeScript modules with injected database/network boundaries.
export function loadTs(relativePath, overrides = {}) {
  const cache = new Map();
  const load = (path) => {
    if (cache.has(path)) return cache.get(path).exports;
    const moduleRecord = { exports: {} };
    cache.set(path, moduleRecord);
    const compiled = ts.transpileModule(readFileSync(path, "utf8"), {
      compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, target: ts.ScriptTarget.ES2020 },
    }).outputText;
    vm.runInNewContext(compiled, {
      module: moduleRecord, exports: moduleRecord.exports, process, console, Buffer, URL,
      setTimeout, clearTimeout,
      require: (name) => {
        if (Object.hasOwn(overrides, name)) return overrides[name];
        if (name.startsWith("@/") || name.startsWith(".")) {
          const base = name.startsWith("@/") ? resolve(root, name.slice(2)) : resolve(dirname(path), name);
          const target = [base, `${base}.ts`, `${base}.tsx`].find((candidate) => existsSync(candidate));
          if (target) return load(target);
        }
        return require(name);
      },
    }, { filename: path });
    return moduleRecord.exports;
  };
  return load(resolve(root, relativePath));
}
