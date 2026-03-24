import fs from "node:fs";
import https from "node:https";
import { getAccessToken } from "./auth.js";
import { getSettings } from "./config.js";
import { markdownToHtml } from "./markdown.js";

function bloggerRequest(method, path, body, accessToken) {
  return new Promise((resolve, reject) => {
    const postData = body ? JSON.stringify(body) : null;
    const req = https.request(
      `https://www.googleapis.com/blogger/v3${path}`,
      {
        method,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          ...(postData ? { "Content-Length": Buffer.byteLength(postData) } : {}),
        },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => {
          try {
            resolve(JSON.parse(data));
          } catch {
            reject(new Error(`Non-JSON response (${res.statusCode}): ${data}`));
          }
        });
      }
    );
    req.on("error", reject);
    if (postData) req.write(postData);
    req.end();
  });
}

/**
 * Publish a markdown file to Blogger.
 *
 * @param {object} options
 * @param {string} options.file - Path to the markdown file
 * @param {string} options.title - Post title
 * @param {string} [options.blogId] - Blog ID (or from settings)
 * @param {boolean} [options.draft=true] - Publish as draft
 * @param {string} [options.labels] - Comma-separated labels/tags
 */
export async function publishPost(options) {
  const { file, title, draft = true, labels } = options;
  const settings = getSettings();
  const blogId = options.blogId || settings.blogId;

  if (!blogId) {
    throw new Error(
      "Blog ID not specified. Use --blog-id or save it: blogger-cli config --blog-id YOUR_BLOG_ID"
    );
  }

  if (!fs.existsSync(file)) {
    throw new Error(`File not found: ${file}`);
  }

  const md = fs.readFileSync(file, "utf8");
  const html = markdownToHtml(md);

  // Derive title from first H1 if not provided
  const postTitle = title || md.match(/^# (.+)$/m)?.[1] || "Untitled Post";

  const accessToken = await getAccessToken();

  const body = {
    kind: "blogger#post",
    blog: { id: blogId },
    title: postTitle,
    content: html,
  };

  if (labels) {
    body.labels = labels.split(",").map((l) => l.trim());
  }

  const path = `/blogs/${blogId}/posts?isDraft=${draft}`;
  const result = await bloggerRequest("POST", path, body, accessToken);

  if (result.id) {
    return {
      success: true,
      id: result.id,
      url: result.url,
      title: result.title,
      status: draft ? "DRAFT" : "LIVE",
    };
  }

  throw new Error(`Blogger API error: ${JSON.stringify(result)}`);
}

/**
 * List recent posts from a blog.
 */
export async function listPosts(blogId, maxResults = 10) {
  const settings = getSettings();
  const id = blogId || settings.blogId;
  if (!id) throw new Error("Blog ID not specified.");

  const accessToken = await getAccessToken();
  const result = await bloggerRequest(
    "GET",
    `/blogs/${id}/posts?maxResults=${maxResults}&status=draft&status=live`,
    null,
    accessToken
  );
  return result.items || [];
}

// CLI entry point
if (process.argv[1]?.endsWith("post.js")) {
  const args = process.argv.slice(2);
  const flags = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith("--")) {
      const key = args[i].replace(/^--/, "");
      flags[key] = args[i + 1] || true;
      i++;
    } else if (!flags.file) {
      flags.file = args[i];
    }
  }

  if (!flags.file) {
    console.error("Usage: node src/post.js <file.md> [--title 'Title'] [--blog-id ID] [--draft true|false] [--labels 'tag1,tag2']");
    process.exit(1);
  }

  publishPost({
    file: flags.file,
    title: flags.title,
    blogId: flags["blog-id"],
    draft: flags.draft !== "false",
    labels: flags.labels,
  })
    .then((result) => {
      console.log(`${result.status}: ${result.title}`);
      console.log(`URL: ${result.url}`);
      console.log(`ID: ${result.id}`);
    })
    .catch((err) => {
      console.error("Error:", err.message);
      process.exit(1);
    });
}
