---
name: blogger-cli
description: Publish Markdown files to Google Blogger. Use when the user asks to publish, post, or draft a blog post. Handles OAuth authentication, Markdown-to-HTML conversion, and Blogger API interaction.
triggers:
  - blog
  - blogger
  - publish blog
  - post to blog
  - draft blog
  - blog post
---

# Blogger CLI Skill

Publish Markdown files to Google Blogger from the command line.

## Commands

### Authenticate
```bash
blogger-cli auth
```
Opens a browser for Google OAuth. Run once, or when the token expires.

### Publish a post (as draft)
```bash
blogger-cli post my-post.md
```

### Publish with options
```bash
blogger-cli post my-post.md --title "My Post Title" --labels "ai,coding" --draft false
```

### List recent posts
```bash
blogger-cli list
```

### Set default blog ID
```bash
blogger-cli config --blog-id YOUR_BLOG_ID
```

## Notes
- Posts are published as **drafts** by default. Use `--draft false` to publish live.
- The post title defaults to the first `# Heading` in the markdown file.
- Markdown is converted to HTML automatically (headings, bold, code blocks, tables, lists).
- Config and tokens are stored in `~/.blogger-cli/`.
- Also reads legacy credentials from `~/.blogger/` if present.
