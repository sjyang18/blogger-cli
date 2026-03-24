#!/usr/bin/env node

import { authorize, getAccessToken } from "../src/auth.js";
import { publishPost, listPosts } from "../src/post.js";
import { getSettings, saveSettings, CONFIG_DIR } from "../src/config.js";

const [command, ...args] = process.argv.slice(2);

function parseFlags(args) {
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      flags[key] = args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : true;
    } else if (!flags._positional) {
      flags._positional = args[i];
    }
  }
  return flags;
}

function printHelp() {
  console.log(`blogger-cli — Publish Markdown to Google Blogger

COMMANDS:
  auth                    Authorize with Google (opens browser)
  post <file.md>          Publish a markdown file
  list                    List recent posts
  config                  View or set configuration

POST OPTIONS:
  --title "Title"         Post title (default: first H1 in file)
  --blog-id ID            Blog ID (or set via config)
  --draft true|false      Publish as draft (default: true)
  --labels "tag1,tag2"    Comma-separated labels

CONFIG OPTIONS:
  --blog-id ID            Save default blog ID

SETUP:
  1. Create OAuth credentials at Google Cloud Console
     → APIs & Services → Credentials → OAuth client ID (Desktop app)
  2. Save the JSON as: ${CONFIG_DIR}/client_secret.json
  3. Run: blogger-cli auth
  4. Run: blogger-cli config --blog-id YOUR_BLOG_ID
  5. Run: blogger-cli post my-post.md
`);
}

async function main() {
  switch (command) {
    case "auth":
      await authorize();
      console.log("\nAuthorization successful!");
      break;

    case "post": {
      const flags = parseFlags(args);
      const file = flags._positional;
      if (!file) {
        console.error("Usage: blogger-cli post <file.md> [--title 'Title'] [--draft true|false]");
        process.exit(1);
      }
      const result = await publishPost({
        file,
        title: flags.title,
        blogId: flags["blog-id"],
        draft: flags.draft !== "false",
        labels: flags.labels,
      });
      console.log(`${result.status}: ${result.title}`);
      console.log(`URL: ${result.url}`);
      console.log(`ID: ${result.id}`);
      break;
    }

    case "list": {
      const flags = parseFlags(args);
      const posts = await listPosts(flags["blog-id"]);
      if (posts.length === 0) {
        console.log("No posts found.");
      } else {
        for (const p of posts) {
          const status = p.status === "DRAFT" ? "[DRAFT]" : "[LIVE]";
          console.log(`${status} ${p.title}`);
          console.log(`  ${p.url || "(no URL yet)"}`);
        }
      }
      break;
    }

    case "config": {
      const flags = parseFlags(args);
      const settings = getSettings();
      if (flags["blog-id"]) {
        settings.blogId = flags["blog-id"];
        saveSettings(settings);
        console.log(`Blog ID saved: ${settings.blogId}`);
      } else {
        console.log("Current settings:", JSON.stringify(settings, null, 2));
        console.log(`Config dir: ${CONFIG_DIR}`);
      }
      break;
    }

    case "help":
    case "--help":
    case "-h":
    case undefined:
      printHelp();
      break;

    default:
      console.error(`Unknown command: ${command}`);
      printHelp();
      process.exit(1);
  }
}

main().catch((err) => {
  console.error("Error:", err.message);
  process.exit(1);
});
