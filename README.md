# skill-pull

[![npm version](https://img.shields.io/npm/v/@rohangore1999/skill-pull.svg)](https://www.npmjs.com/package/@rohangore1999/skill-pull)
[![npm downloads](https://img.shields.io/npm/dm/@rohangore1999/skill-pull.svg)](https://www.npmjs.com/package/@rohangore1999/skill-pull)
[![license](https://img.shields.io/npm/l/@rohangore1999/skill-pull.svg)](https://github.com/rohangore1999/skill-pull/blob/main/LICENSE)

> Auto-discover and install the right skills from [skills.sh](https://skills.sh) before your AI agent builds anything.

An MCP server for Cursor, Claude Code, Windsurf, and any MCP-compatible agent. Tell it what you want to build — it finds the best skills, installs them to disk, and loads their knowledge into context automatically.

## How It Works

```
1. You type: "Build me a booking app with payments"
2. skill-pull searches skills.sh semantically
3. Installs matching skills to <project>/.cursor/skills/
4. Loads skill content into the agent's context
5. Agent builds with expert knowledge from skill authors
```

## Architecture

### High-level

```
┌─────────────────────────────────────────────────────┐
│                   AI Agent (Cursor etc.)             │
│                                                      │
│  User prompt ──► auto-skills rule triggers           │
│                       │                             │
│              ┌────────▼────────┐                    │
│              │   skill-pull    │  ◄── MCP (stdio)   │
│              │   MCP Server    │                    │
│              └────────┬────────┘                    │
└───────────────────────┼─────────────────────────────┘
                        │
          ┌─────────────┼─────────────┐
          ▼             ▼             ▼
   recommend_skills  install_skill  get_skill_details
          │             │             │
          ▼             ▼             ▼
     skills.sh      disk write    skills.sh
    /api/search   .cursor/skills  /api/download
```

### Request flow (step by step)

```
Agent receives user prompt
        │
        ▼
[auto-skills.mdc rule fires]
        │
        ▼
recommend_skills(query)
  └─► GET skills.sh/api/search?q=<query>&limit=5
  └─► Returns: [{id, name, description, installs}]
        │
        ▼
install_skill(id, projectPath)
  └─► Parse id → owner/repo + slug
  └─► Try: npx skills add <source> --skill <slug>
  └─► Fallback: GET skills.sh/api/download/<owner>/<repo>/<slug>
  └─► Write files → <projectPath>/.cursor/skills/<slug>/
        │
        ▼
get_skill_details(id)
  └─► GET skills.sh/api/download/<owner>/<repo>/<slug>
  └─► Extract SKILL.md content
  └─► Return full text to agent context
        │
        ▼
Agent builds using loaded skill knowledge
```

### File layout after install

```
my-project/
└── .cursor/
    └── skills/              ← travels with the repo
        ├── nextjs-best-practices/
        │   └── SKILL.md
        ├── stripe-payments/
        │   ├── SKILL.md
        │   └── rules/
        │       └── checkout.md
        └── supabase-auth/
            └── SKILL.md
```

### Component map

```
skill-pull/
├── src/
│   ├── index.js              # MCP server entry — wires tools + zod schemas
│   ├── skills-api.js         # skills.sh API client (search + download)
│   └── tools/
│       ├── recommend.js      # recommend_skills tool
│       ├── install.js        # install_skill tool (npx + API fallback)
│       ├── get-details.js    # get_skill_details tool
│       └── list-installed.js # list_installed_skills tool
├── agent-rules/              # Rule files for each agent type
│   ├── CLAUDE.md             # Claude Code
│   ├── .windsurfrules        # Windsurf
│   ├── AGENTS.md             # OpenAI Codex / generic
│   └── copilot-instructions.md
├── setup.js                  # One-command rule installer for all agents
└── SKILL.md                  # skill-pull listed as a skill on skills.sh
```

### Key design decisions

| Decision | Reason |
|---|---|
| **stdio transport** | No hosting needed — Cursor spawns the process directly |
| **Project-level skills** (`<project>/.cursor/skills/`) | Skills travel with the repo; teammates & other agents pick them up automatically |
| **npx fallback → direct API** | Works even without the `skills` CLI installed |
| **`id` as primary input** | Agent passes the `id` from `recommend_skills` directly — no manual parsing |
| **JavaScript, no build step** | Runs anywhere Node 18+ is present; zero compile overhead |

---

## Install

Add to `~/.cursor/mcp.json`:

```json
{
  "mcpServers": {
    "skill-pull": {
      "command": "npx",
      "args": ["-y", "@rohangore1999/skill-pull"]
    }
  }
}
```

Then run the setup script to install the auto-trigger rule for your agent:

```bash
npx @rohangore1999/skill-pull setup
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

## Tools

| Tool | Description |
|---|---|
| `recommend_skills` | Semantic search skills.sh for your build description |
| `install_skill` | Install skill into `<projectPath>/.cursor/skills/` |
| `get_skill_details` | Load full SKILL.md content into agent context |
| `list_installed_skills` | Show all locally installed skills |

## Usage

Once configured, just describe what you want to build. The agent handles the rest automatically:

```
"Build a SaaS app with auth and Stripe payments"
→ Finds: shadcn/ui, supabase, stripe-skill, next-best-practices
→ Installs each to <project>/.cursor/skills/
→ Loads expert knowledge into context
→ Builds with best practices from skill authors
```

## Supported Agents

Works with any MCP-compatible agent: **Cursor**, **Claude Code**, **Claude Desktop**, **Windsurf**, **VS Code Copilot**, **Cline**, **Kiro**, and more.

## License

MIT
