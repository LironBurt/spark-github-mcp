import { Octokit } from "@octokit/rest";

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, x-mcp-version");

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Extract auth token from Authorization header or environment variable
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.substring(7) : process.env.GITHUB_TOKEN;

  const octokit = new Octokit({ auth: token });

  // Handle GET / discovery (res.end prevents Vercel serverless function timeout)
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.write("event: endpoint\ndata: /api/mcp\n\n");
    return res.end();
  }

  if (req.method === "POST") {
    try {
      const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
      const { method, params, id } = body;

      if (method === "initialize") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: { tools: {} },
            serverInfo: { name: "spark-github-mcp", version: "1.0.0" }
          }
        });
      }

      if (method && method.startsWith("notifications/")) {
        return res.status(200).end();
      }

      if (method === "tools/list") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              {
                name: "list_repositories",
                description: "List public and private repositories for the authenticated user",
                inputSchema: { type: "object", properties: {} }
              },
              {
                name: "get_file_contents",
                description: "Get the contents of a file in a GitHub repository",
                inputSchema: {
                  type: "object",
                  properties: {
                    owner: { type: "string" },
                    repo: { type: "string" },
                    path: { type: "string" }
                  },
                  required: ["owner", "repo", "path"]
                }
              }
            ]
          }
        });
      }

      if (method === "tools/call") {
        const { name, arguments: args } = params || {};

        if (name === "list_repositories") {
          const { data } = await octokit.rest.repos.listForAuthenticatedUser({ per_page: 30 });
          const repos = data.map(r => ({
            name: r.name,
            full_name: r.full_name,
            private: r.private,
            html_url: r.html_url,
            description: r.description
          }));
          return res.status(200).json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: JSON.stringify(repos, null, 2) }]
            }
          });
        }

        if (name === "get_file_contents") {
          const { data } = await octokit.rest.repos.getContent({
            owner: args.owner,
            repo: args.repo,
            path: args.path
          });
          const content = Buffer.from(data.content, "base64").toString("utf-8");
          return res.status(200).json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [{ type: "text", text: content }]
            }
          });
        }
      }

      return res.status(200).json({ jsonrpc: "2.0", id, result: {} });
    } catch (error) {
      return res.status(500).json({
        jsonrpc: "2.0",
        id: req.body?.id || null,
        error: { code: -32603, message: error.message }
      });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}
