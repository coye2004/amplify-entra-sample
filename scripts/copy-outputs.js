import fs from "fs";
import path from "path";
const src = path.resolve("./amplify_outputs.json");
const dest = path.resolve("./public/amplify_outputs.json");

if (!fs.existsSync(src)) {
  console.error("❌ amplify_outputs.json not found (backend didn't run?)");
  process.exit(1);
}
fs.copyFileSync(src, dest);
console.log("✅ Copied amplify_outputs.json to public/");
