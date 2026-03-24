# blogger-cli

A zero-dependency Node.js CLI tool to publish Markdown files to Google Blogger. Designed to work as a Claude Code / GitHub Copilot skill.

## Features

- Publish Markdown files as Blogger posts (draft or live)
- Automatic Markdown-to-HTML conversion (headings, bold, code blocks, tables, lists)
- OAuth2 authentication with automatic token refresh
- Works from any terminal, CI/CD pipeline, or AI coding assistant

## Prerequisites

- **Node.js 18+**
- A **Google Cloud project** with the Blogger API enabled
- A **Blogger blog**

## Setup

### Step 1: Enable Blogger API

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project (or select an existing one)
3. Go to **APIs & Services** → **Library**
4. Search for **"Blogger API v3"** → **Enable**

### Step 2: Set Up OAuth Consent Screen

1. Go to **APIs & Services** → **OAuth consent screen**
2. User type: **External** → **Create**
3. Fill in:
   - **App name**: anything (e.g., "Blog Publisher")
   - **User support email**: your Gmail
   - **Developer contact email**: your Gmail
4. Click **Save and Continue** through remaining screens
5. Under **Test users** → **+ Add Users** → add your Gmail address → Save

> While the app is in "Testing" status, only listed test users can use it.

### Step 3: Create OAuth Credentials

1. Go to **APIs & Services** → **Credentials**
2. Click **+ Create Credentials** → **OAuth client ID**
3. Application type: **Desktop app**
4. Click **Create** → **Download JSON**

### Step 4: Install and Configure

```bash
# Clone and install globally
git clone https://github.com/YOUR_USERNAME/blogger-cli.git
cd blogger-cli
npm install -g .

# Save the OAuth credentials
mkdir -p ~/.blogger
cp ~/Downloads/client_secret_*.json ~/.blogger/client_secret.json

# Authorize (opens browser)
blogger-cli auth

# Set your blog ID (find it in your Blogger dashboard URL)
blogger-cli config --blog-id YOUR_BLOG_ID
```

### Finding Your Blog ID

1. Go to [Blogger Dashboard](https://www.blogger.com/)
2. Click on your blog
3. Check the URL: `https://www.blogger.com/blog/posts/1234567890123456789`
4. The long number is your Blog ID

## Usage

### Publish a draft
```bash
blogger-cli post my-post.md
```

### Publish live with title and labels
```bash
blogger-cli post my-post.md --title "My Post" --labels "ai,coding" --draft false
```

### List recent posts
```bash
blogger-cli list
```

### Re-authorize (if token expires)
```bash
blogger-cli auth
```

## As a Claude Code Skill

Copy `SKILL.md` to your Claude Code skills directory:

```bash
cp SKILL.md ~/.claude/skills/blogger-cli.md
```

Then Claude Code can publish blog posts when you ask it to.

## How It Works

1. Reads a Markdown file
2. Converts it to HTML (headings, code blocks, tables, lists, bold)
3. Authenticates with Google via OAuth2 (with automatic token refresh)
4. Posts to the Blogger API v3 as a draft or live post

## File Structure

```
~/.blogger/
├── client_secret.json    # OAuth credentials (from Google Cloud Console)
├── token.json            # OAuth token (auto-generated after auth)
└── settings.json         # Blog ID and other settings
```

## Troubleshooting

| Problem | Fix |
|---------|-----|
| "Client secret not found" | Download OAuth JSON from Google Cloud Console → save as `~/.blogger/client_secret.json` |
| "Not authenticated" | Run `blogger-cli auth` |
| "Token expired and refresh failed" | Run `blogger-cli auth` again (refresh tokens expire after ~7 days if app is in testing mode) |
| "Blog ID not specified" | Run `blogger-cli config --blog-id YOUR_ID` |
| Browser doesn't open during auth | Copy the URL from the terminal and open it manually |

## License

MIT
