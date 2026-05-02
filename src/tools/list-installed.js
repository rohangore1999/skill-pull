import { readdirSync, existsSync } from 'fs';
import { join } from 'path';
import { homedir } from 'os';

export const listInstalledSkillsTool = {
  name: 'list_installed_skills',
  description:
    'List all skills currently installed on the local machine. Checks both ~/.cursor/skills/ (personal) and .cursor/skills/ (project-level).',
  inputSchema: {
    type: 'object',
    properties: {},
  },
};

export async function listInstalledSkills() {
  const locations = [
    { label: 'Project (.cursor/skills/)', path: join(process.cwd(), '.cursor', 'skills') },
    { label: 'Global (~/.cursor/skills/)', path: join(homedir(), '.cursor', 'skills') },
  ];

  const results = [];

  for (const loc of locations) {
    if (!existsSync(loc.path)) {
      results.push(`${loc.label}: not found`);
      continue;
    }

    try {
      const entries = readdirSync(loc.path, { withFileTypes: true });
      const skills = entries
        .filter((e) => e.isDirectory())
        .map((e) => e.name);

      if (skills.length === 0) {
        results.push(`${loc.label}: no skills installed`);
      } else {
        results.push(`${loc.label}:\n${skills.map((s) => `  - ${s}`).join('\n')}`);
      }
    } catch {
      results.push(`${loc.label}: could not read directory`);
    }
  }

  return {
    content: [
      {
        type: 'text',
        text: ['Installed Skills', '================', ...results].join('\n'),
      },
    ],
  };
}
