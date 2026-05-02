import { searchSkills } from '../skills-api.js';

export const recommendSkillsTool = {
  name: 'recommend_skills',
  description:
    'Search skills.sh for the most relevant skills based on a plain English description of what you want to build. Returns a ranked list of safe, popular skills to install before starting.',
  inputSchema: {
    type: 'object',
    properties: {
      description: {
        type: 'string',
        description: 'Plain English description of what you want to build e.g. "booking app with payments and user accounts"',
      },
      limit: {
        type: 'number',
        description: 'Max number of skills to return (default: 5)',
      },
    },
    required: ['description'],
  },
};

/**
 * @param {{ description: string, limit?: number }} args
 */
export async function recommendSkills(args) {
  const { description, limit = 5 } = args;

  const skills = await searchSkills(description, limit * 2);

  if (!skills.length) {
    return {
      content: [
        {
          type: 'text',
          text: `No skills found for: "${description}". Try a more specific description.`,
        },
      ],
    };
  }

  // Sort by installs descending and take top N
  const top = skills
    .filter((s) => s.id && s.source)
    .sort((a, b) => (b.installs ?? 0) - (a.installs ?? 0))
    .slice(0, limit);

  const lines = top.map((s, i) => {
    const installs = s.installs ? `${(s.installs / 1000).toFixed(1)}K installs` : '';
    return `${i + 1}. **${s.name}** (${s.source}) ${installs}\n   ID: ${s.id}`;
  });

  const text = [
    `Found ${top.length} recommended skills for: "${description}"`,
    '',
    lines.join('\n'),
    '',
    'Next steps (use the ID field directly):',
    ...top.map((s) => `- install_skill(id="${s.id}") then get_skill_details(source="${s.source}", slug="${s.skillId}")`),
  ].join('\n');

  return {
    content: [{ type: 'text', text }],
    skills: top,
  };
}
