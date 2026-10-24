// Builds dist/index.html: the whole site (CSS, JS and images inlined) encrypted
// with AES-GCM behind a password gate. Usage: SITE_PASSWORD="..." node tools/build.mjs
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const root = new URL("..", import.meta.url).pathname;
const read = f => readFileSync(root + f, "utf8");
const password = process.env.SITE_PASSWORD;
if (!password) throw new Error("Set SITE_PASSWORD");

// Must match normalise() in the gate page.
const normalise = s => s.toLowerCase().replace(/\s+/g, "");

let html = read("index.html")
  .replace('<link rel="stylesheet" href="styles.css">', () => `<style>${read("styles.css")}</style>`)
  .replace('<script src="app.js"></script>', () => `<script>${read("app.js")}</script>`);
for (const img of ["guru.jpg", "guru-face.jpg", "calf.jpg", "calf-crop.jpg"]) {
  const uri = "data:image/jpeg;base64," + readFileSync(root + "assets/" + img).toString("base64");
  html = html.split("assets/" + img).join(uri);
}
if (/assets\//.test(html)) throw new Error("Unhandled asset reference left in page");

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", enc.encode(normalise(password)), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 250000, hash: "SHA-256" },
  base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]
);
const cipher = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(html)));
const b64 = u => Buffer.from(u).toString("base64");

const gate = read("tools/gate.html")
  .replace("__PAYLOAD__", () => JSON.stringify({ salt: b64(salt), iv: b64(iv), data: b64(cipher) }));
mkdirSync(root + "dist", { recursive: true });
writeFileSync(root + "dist/index.html", gate);
writeFileSync(root + "dist/.nojekyll", "");
console.log(`dist/index.html written (${(gate.length / 1024).toFixed(0)} KB)`);
