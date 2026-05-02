#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { recommendSkills } from './tools/recommend.js';
import { installSkill } from './tools/install.js';
import { getSkillDetails } from './tools/get-details.js';
import { listInstalledSkills } from './tools/list-installed.js';

const server = new McpServer({
  name: 'skill-pull',
  version: '1.0.0',
});

// recommend_skills
server.tool(
  'recommend_skills',
  'Search skills.sh for the most relevant skills based on a plain English description of what you want to build. Returns a ranked list of popular skills to install before starting.',
  {
    description: z.string().describe('Plain English description of what you want to build e.g. "booking app with payments and user accounts"'),
    limit: z.number().optional().describe('Max number of skills to return (default: 5)'),
  },
  async (args) => recommendSkills(args)
);

// install_skill
server.tool(
  'install_skill',
  'Install a skill from skills.sh onto the local machine. Pass the "id" field directly from recommend_skills. Saves to ~/.cursor/skills/ for persistent use.',
  {
    id: z.string().optional().describe('Full skill ID from recommend_skills e.g. "vercel-labs/agent-skills/vercel-react-best-practices". Preferred.'),
    source: z.string().optional().describe('GitHub source e.g. "vercel-labs/agent-skills". Only if not using id.'),
    slug: z.string().optional().describe('Skill slug e.g. "vercel-react-best-practices". Only if not using id.'),
    projectPath: z.string().optional().describe('Absolute path to the project being built e.g. "/Users/name/projects/my-app". Skills will be saved to <projectPath>/.cursor/skills/'),
  },
  async (args) => installSkill(args)
);

// get_skill_details
server.tool(
  'get_skill_details',
  'Fetch the full SKILL.md content of a skill and inject it into context. Pass the "id" field directly from recommend_skills.',
  {
    id: z.string().optional().describe('Full skill ID from recommend_skills e.g. "vercel-labs/agent-skills/vercel-react-best-practices". Preferred.'),
    source: z.string().optional().describe('GitHub source e.g. "vercel-labs/agent-skills". Only if not using id.'),
    slug: z.string().optional().describe('Skill slug e.g. "vercel-react-best-practices". Only if not using id.'),
  },
  async (args) => getSkillDetails(args)
);

// list_installed_skills
server.tool(
  'list_installed_skills',
  'List all skills currently installed on the local machine. Checks both ~/.cursor/skills/ and .cursor/skills/.',
  {},
  async () => listInstalledSkills()
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error('skill-pull MCP server error:', err);
  process.exit(1);
});
