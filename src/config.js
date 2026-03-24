import fs from "node:fs";
import path from "node:path";
import os from "node:os";

const CONFIG_DIR = path.join(os.homedir(), ".blogger");
const CLIENT_SECRET_PATH = path.join(CONFIG_DIR, "client_secret.json");
const TOKEN_PATH = path.join(CONFIG_DIR, "googleapis.json");
const SETTINGS_PATH = path.join(CONFIG_DIR, "settings.json");

export function ensureConfigDir() {
  if (!fs.existsSync(CONFIG_DIR)) {
    fs.mkdirSync(CONFIG_DIR, { recursive: true });
  }
}

export function getClientSecret() {
  if (!fs.existsSync(CLIENT_SECRET_PATH)) {
    throw new Error(
      `Client secret not found at ${CLIENT_SECRET_PATH}\n` +
        "Download it from Google Cloud Console → APIs & Services → Credentials → OAuth client ID → Download JSON\n" +
        `Then save it as: ${CLIENT_SECRET_PATH}`
    );
  }
  return JSON.parse(fs.readFileSync(CLIENT_SECRET_PATH, "utf8"));
}

export function getToken() {
  if (!fs.existsSync(TOKEN_PATH)) {
    return null;
  }
  return JSON.parse(fs.readFileSync(TOKEN_PATH, "utf8"));
}

export function saveToken(token) {
  ensureConfigDir();
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

export function getSettings() {
  if (!fs.existsSync(SETTINGS_PATH)) {
    return {};
  }
  return JSON.parse(fs.readFileSync(SETTINGS_PATH, "utf8"));
}

export function saveSettings(settings) {
  ensureConfigDir();
  fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
}

export { CONFIG_DIR, CLIENT_SECRET_PATH, TOKEN_PATH, SETTINGS_PATH };
