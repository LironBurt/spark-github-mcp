# spark-github-mcp

A complete Node.js GitHub MCP (Model Context Protocol) server repository configured for Vercel deployment with OAuth 2.0 authentication support.

This server provides tools to list user repositories and get file contents from GitHub using standard MCP protocols.

## Deployment

Deploy this project easily using Vercel.

## Setup GitHub OAuth Application

1. Go to your GitHub account settings.
2. Navigate to **Developer settings** > **OAuth Apps**.
3. Click **New OAuth App**.
4. Fill in the following details:
   - **Application name**: Choose a name (e.g., "My GitHub MCP").
   - **Homepage URL**: Your Vercel deployment URL (e.g., `https://your-app.vercel.app`).
   - **Authorization callback URL**: `https://your-app.vercel.app/api/auth/callback`.
5. Click **Register application**.
6. On the next page, you will see your **Client ID**. Save this for the next step.
7. Click **Generate a new client secret** and save the resulting secret (you will only see it once).

## Configure Vercel Environment Variables

Once you have deployed the application to Vercel and registered your GitHub OAuth app:

1. Go to your Vercel project dashboard.
2. Navigate to **Settings** > **Environment Variables**.
3. Add the following variables:
   - Key: `GITHUB_CLIENT_ID`
   - Value: (The Client ID from GitHub)
   - Key: `GITHUB_CLIENT_SECRET`
   - Value: (The Client Secret from GitHub)
4. Save the variables and trigger a redeployment if necessary so they are active.

## Usage

This server conforms to the Model Context Protocol (MCP).

Clients will discover the endpoint via:
`GET https://your-app.vercel.app/mcp` (which redirects/rewrites to `/api/mcp`).

OAuth flow should be initiated by the client to GitHub, specifying your Client ID, and then returning to the `/api/auth/callback` endpoint which will exchange the code for an access token.
