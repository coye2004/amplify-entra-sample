// scripts/copy-outputs.js
import fs from "fs";
import path from "path";

const candidates = [
  "./amplify_outputs.json",          // common location
  "./amplify/amplify_outputs.json",  // some project layouts
];

const dest = path.resolve("./public/amplify_outputs.json");

const src = candidates.find(p => fs.existsSync(path.resolve(p)));
if (!src) {
  console.error(
    "❌ amplify_outputs.json not found. " +
    "Did the backend phase (npx ampx pipeline-deploy) run and succeed?"
  );
  process.exit(1); // fail early so you notice
}

fs.mkdirSync(path.dirname(dest), { recursive: true });
fs.copyFileSync(path.resolve(src), dest);
console.log(`✅ Copied ${src} -> ${dest}`);
