import http from "node:http";
import https from "node:https";
import url from "node:url";
import { getClientSecret, getToken, saveToken } from "./config.js";

const REDIRECT_PORT = 3333;
const REDIRECT_URI = `http://localhost:${REDIRECT_PORT}`;
const SCOPE = "https://www.googleapis.com/auth/blogger";

function makeRequest(reqUrl, options, body) {
  return new Promise((resolve, reject) => {
    const req = https.request(reqUrl, options, (res) => {
      let data = "";
      res.on("data", (c) => (data += c));
      res.on("end", () => {
        try {
          resolve(JSON.parse(data));
        } catch {
          reject(new Error(`Non-JSON response: ${data}`));
        }
      });
    });
    req.on("error", reject);
    if (body) req.write(body);
    req.end();
  });
}

/** Refresh an existing token. Returns true if successful. */
export async function refreshToken() {
  const token = getToken();
  if (!token?.refresh_token) return false;

  const secret = getClientSecret();
  const installed = secret.installed || secret.web;

  const params = new URLSearchParams({
    client_id: installed.client_id,
    client_secret: installed.client_secret,
    refresh_token: token.refresh_token,
    grant_type: "refresh_token",
  });

  try {
    const result = await makeRequest(
      "https://oauth2.googleapis.com/token",
      { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
      params.toString()
    );

    if (result.access_token) {
      saveToken({
        ...token,
        access_token: result.access_token,
        expiry_date: Date.now() + result.expires_in * 1000,
      });
      return true;
    }
  } catch {
    // Refresh failed
  }
  return false;
}

/** Get a valid access token, refreshing if needed. */
export async function getAccessToken() {
  const token = getToken();
  if (!token) {
    throw new Error("Not authenticated. Run: blogger-cli auth");
  }

  // Check if token is still valid (with 5-min buffer)
  if (token.expiry_date && token.expiry_date > Date.now() + 5 * 60 * 1000) {
    return token.access_token;
  }

  // Try refresh
  const refreshed = await refreshToken();
  if (refreshed) {
    return getToken().access_token;
  }

  throw new Error("Token expired and refresh failed. Run: blogger-cli auth");
}

/** Run the full OAuth authorization flow with a local callback server. */
export function authorize() {
  return new Promise((resolve, reject) => {
    const secret = getClientSecret();
    const installed = secret.installed || secret.web;

    const authUrl =
      "https://accounts.google.com/o/oauth2/auth?" +
      new URLSearchParams({
        client_id: installed.client_id,
        redirect_uri: REDIRECT_URI,
        response_type: "code",
        scope: SCOPE,
        access_type: "offline",
        prompt: "consent",
      }).toString();

    const server = http.createServer((req, res) => {
      const query = url.parse(req.url, true).query;
      if (!query.code) return;

      res.writeHead(200, { "Content-Type": "text/html" });
      res.end("<h1>Authorization successful! You can close this tab.</h1>");

      const params = new URLSearchParams({
        code: query.code,
        client_id: installed.client_id,
        client_secret: installed.client_secret,
        redirect_uri: REDIRECT_URI,
        grant_type: "authorization_code",
      });

      makeRequest(
        "https://oauth2.googleapis.com/token",
        { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" } },
        params.toString()
      )
        .then((result) => {
          if (result.access_token) {
            saveToken({
              access_token: result.access_token,
              refresh_token: result.refresh_token,
              scope: result.scope,
              token_type: result.token_type,
              expiry_date: Date.now() + result.expires_in * 1000,
            });
            server.close();
            resolve();
          } else {
            server.close();
            reject(new Error(`Token exchange failed: ${JSON.stringify(result)}`));
          }
        })
        .catch((err) => {
          server.close();
          reject(err);
        });
    });

    server.listen(REDIRECT_PORT, () => {
      console.log("Open this URL in your browser to authorize:\n");
      console.log(authUrl);
      console.log("\nWaiting for authorization...");
    });

    // Timeout after 3 minutes
    setTimeout(() => {
      server.close();
      reject(new Error("Authorization timed out after 3 minutes."));
    }, 180_000);
  });
}

// CLI entry point
if (process.argv[1]?.endsWith("auth.js")) {
  authorize()
    .then(() => console.log("\nAuthorization successful! Token saved."))
    .catch((err) => {
      console.error("Authorization failed:", err.message);
      process.exit(1);
    });
}
