import { Octokit } from "@octokit/rest";

// Common CORS headers
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default async function handler(req, res) {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    res.status(200).setHeaders(new Headers(corsHeaders)).send("OK");
    return;
  }

  // Set CORS headers for all responses
  for (const [key, value] of Object.entries(corsHeaders)) {
    res.setHeader(key, value);
  }

  // Handle MCP Server Discovery via SSE
  if (req.method === "GET") {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // We send an endpoint event to inform the client where to post
    res.write(`event: endpoint\ndata: /api/mcp\n\n`);
    return;
  }

  // Handle MCP JSON-RPC
  if (req.method === "POST") {
    try {
      const { jsonrpc, id, method, params } = req.body;

      if (jsonrpc !== "2.0") {
        return res.status(400).json({ error: "Invalid JSON-RPC version" });
      }

      // Initialize
      if (method === "initialize") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            protocolVersion: "2024-11-05",
            capabilities: {
              tools: {
                listChanged: false
              }
            },
            serverInfo: {
              name: "spark-github-mcp",
              version: "1.0.0"
            }
          }
        });
      }

      // Notifications (like initialized, etc)
      if (method.startsWith("notifications/")) {
        return res.status(200).send("OK");
      }

      // Tools List
      if (method === "tools/list") {
        return res.status(200).json({
          jsonrpc: "2.0",
          id,
          result: {
            tools: [
              {
                name: "list_repositories",
                description: "List repositories for the authenticated user",
                inputSchema: {
                  type: "object",
                  properties: {},
                  required: []
                }
              },
              {
                name: "get_file_contents",
                description: "Get contents of a file in a repository",
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

      // Tools Call
      if (method === "tools/call") {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith("Bearer ")) {
          return res.status(401).json({
            jsonrpc: "2.0",
            id,
            error: {
              code: -32000,
              message: "Unauthorized: Missing or invalid Authorization header"
            }
          });
        }

        const token = authHeader.split(" ")[1];
        const octokit = new Octokit({ auth: token });
        const { name, arguments: args } = params;

        if (name === "list_repositories") {
          const response = await octokit.repos.listForAuthenticatedUser({
            sort: "updated",
            per_page: 10
          });

          return res.status(200).json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: JSON.stringify(response.data, null, 2)
                }
              ]
            }
          });
        }

        if (name === "get_file_contents") {
          const { owner, repo, path } = args;
          const response = await octokit.repos.getContent({
            owner,
            repo,
            path
          });

          let contentText = "";
          if (response.data.type === "file" && response.data.content) {
            contentText = Buffer.from(response.data.content, 'base64').toString('utf8');
          } else {
            contentText = JSON.stringify(response.data, null, 2);
          }

          return res.status(200).json({
            jsonrpc: "2.0",
            id,
            result: {
              content: [
                {
                  type: "text",
                  text: contentText
                }
              ]
            }
          });
        }

        return res.status(404).json({
          jsonrpc: "2.0",
          id,
          error: {
            code: -32601,
            message: `Tool not found: ${name}`
          }
        });
      }

      return res.status(404).json({ error: "Method not found" });

    } catch (error) {
      console.error("Error processing POST request:", error);
      const id = req.body?.id || null;
      return res.status(500).json({
        jsonrpc: "2.0",
        id,
        error: {
          code: -32000,
          message: error.message || "Internal Server Error"
        }
      });
    }
  }

  // Method Not Allowed
  res.status(405).json({ error: "Method Not Allowed" });
}
