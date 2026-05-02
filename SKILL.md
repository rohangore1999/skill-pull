# skill-pull

> Auto-discover and install the right skills from skills.sh before you start building.

## What this skill does

Before starting any build, feature, or project task, this skill instructs your AI agent to:

1. **Search** skills.sh for relevant skills based on your task description
2. **Install** them into your project at `.cursor/skills/` (travels with your repo)
3. **Load** the skill content into agent context before coding begins

This means your agent always has the right domain knowledge — for Next.js, Supabase, Stripe, React, or whatever you're building — without you having to manually find and install skills.

## Setup

Add the `skill-pull` MCP server to your agent config:

### Cursor (`~/.cursor/mcp.json`)

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

### Claude Code (`~/.claude.json`)

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

## Agent rule (auto-installed by setup)

Once set up, your agent will automatically run this flow before every build:

```
1. recommend_skills  — find relevant skills for the task
2. install_skill     — install each one into <projectPath>/.cursor/skills/
3. get_skill_details — load skill content into context
4. Build using the loaded knowledge
```

## MCP Tools

| Tool | Description |
|------|-------------|
| `recommend_skills` | Semantic search of skills.sh — returns top N skills for your task |
| `install_skill` | Installs a skill into `<projectPath>/.cursor/skills/` |
| `get_skill_details` | Loads full skill content into agent context |
| `list_installed_skills` | Shows skills installed in the current project |

## Why project-level skills?

Skills are stored in `.cursor/skills/` inside your project, not globally. This means:
- Skills travel with your repo — teammates and other agents pick them up automatically
- Each project has its own relevant skills, not a global soup
- Works with Cursor, Claude Code, Windsurf, Copilot, and any MCP-compatible agent
