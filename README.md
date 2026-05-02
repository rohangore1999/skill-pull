# skill-pull

> Auto-discover and install the right skills from [skills.sh](https://skills.sh) before your AI agent builds anything.

An MCP server for Cursor, Claude Code, Windsurf, and any MCP-compatible agent. Tell it what you want to build — it finds the best skills, installs them to disk, and loads their knowledge into context automatically.

## How It Works

```
1. You type: "Build me a booking app with payments"
2. skill-pull searches skills.sh semantically
3. Installs matching skills to ~/.cursor/skills/
4. Loads skill content into the agent's context
5. Agent builds with expert knowledge from skill authors
```

## Install

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skill-pull": {
      "command": "npx",
      "args": ["skill-pull"]
    }
  }
}
```

Or point to a local clone:

```json
{
  "mcpServers": {
    "skill-pull": {
      "command": "node",
      "args": ["/path/to/skill-pull/src/index.js"]
    }
  }
}
```

Then copy the auto-skills rule for your agent:

| Agent | Command |
|---|---|
| All agents | `node /path/to/skill-pull/setup.js` |
| Cursor (manual) | Copy `.cursor/rules/auto-skills.mdc` → `~/.cursor/rules/` |
| Claude Code | Copy `agent-rules/CLAUDE.md` → project root |
| Windsurf | Copy `agent-rules/.windsurfrules` → project root |
| GitHub Copilot | Copy `agent-rules/copilot-instructions.md` → `.github/` |

## Tools

| Tool | Description |
|---|---|
| `recommend_skills` | Semantic search skills.sh for your build description |
| `install_skill` | Install skill to `~/.cursor/skills/` via API |
| `get_skill_details` | Load full SKILL.md content into agent context |
| `list_installed_skills` | Show all locally installed skills |

## Usage

Once configured, just describe what you want to build. The agent handles the rest automatically:

```
"Build a SaaS app with auth and Stripe payments"
→ Finds: shadcn/ui, supabase, stripe-skill, next-best-practices
→ Installs each to ~/.cursor/skills/
→ Loads expert knowledge into context
→ Builds with best practices from skill authors
```

## Supported Agents

Works with any MCP-compatible agent: **Cursor**, **Claude Code**, **Claude Desktop**, **Windsurf**, **VS Code Copilot**, **Cline**, **Kiro**, and more.

## License

MIT
