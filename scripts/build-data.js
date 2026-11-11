#!/usr/bin/env node
// Regenerates src/data.js from assessment.json so the page works from file:// and GitHub Pages with no fetch.
const fs = require("fs");
const path = require("path");
const root = path.join(__dirname, "..");
const data = JSON.parse(fs.readFileSync(path.join(root, "assessment.json"), "utf8"));
for (const t of data.types) {
  if (t.questions.length < 11 || t.questions.length > 13) throw new Error(t.key + " needs 11 to 13 questions");
  for (const q of t.questions) if (!data.pillars.some((p) => p.key === q.pillar)) throw new Error("Unknown pillar " + q.pillar);
}
fs.writeFileSync(path.join(root, "src", "data.js"), "/* Generated from assessment.json. Edit that file, then run: node scripts/build-data.js */\nwindow.AIFA_DATA = " + JSON.stringify(data, null, 1) + ";\n");
console.log("src/data.js written: " + data.types.length + " business types");
