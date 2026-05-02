import { downloadSkill, extractSkillMd } from '../skills-api.js';

export const getSkillDetailsTool = {
  name: 'get_skill_details',
  description:
    'Fetch the full SKILL.md content of a skill and inject it into context. Call this after install_skill. Pass either the full "id" from recommend_skills, or both "source" and "slug".',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Full skill ID from recommend_skills e.g. "vercel-labs/agent-skills/vercel-react-best-practices". Preferred over source+slug.',
      },
      source: {
        type: 'string',
        description: 'GitHub source e.g. "vercel-labs/agent-skills". Only needed if not using id.',
      },
      slug: {
        type: 'string',
        description: 'Skill slug e.g. "vercel-react-best-practices". Only needed if not using id.',
      },
    },
  },
};

/**
 * @param {{ id?: string, source?: string, slug?: string }} args
 */
export async function getSkillDetails(args) {
  const { id, source: rawSource, slug: rawSlug } = args;

  let source, slug;

  if (id) {
    const parts = id.split('/');
    if (parts.length < 3) {
      return {
        content: [{ type: 'text', text: `✗ Invalid id format: "${id}". Expected "owner/repo/skill-slug".` }],
        isError: true,
      };
    }
    source = parts.slice(0, 2).join('/');
    slug = parts.slice(2).join('/');
  } else if (rawSource && rawSlug) {
    source = rawSource;
    slug = rawSlug;
  } else {
    return {
      content: [{ type: 'text', text: '✗ Provide either "id" or both "source" and "slug".' }],
      isError: true,
    };
  }

  try {
    const download = await downloadSkill(source, slug);
    const skillMd = extractSkillMd(download);

    if (!skillMd) {
      return {
        content: [{ type: 'text', text: `✗ No SKILL.md found for "${slug}" from "${source}". The skill may not have a snapshot yet.` }],
        isError: true,
      };
    }

    const fileList = download.files?.map((f) => f.path).join(', ') ?? '';

    return {
      content: [{
        type: 'text',
        text: [
          `✓ Skill loaded: ${slug} (${source})`,
          `  Files: ${fileList}`,
          '',
          '--- SKILL CONTENT START ---',
          skillMd,
          '--- SKILL CONTENT END ---',
        ].join('\n'),
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `✗ Failed to load skill "${slug}" from "${source}"\n  Reason: ${err.message}`,
      }],
      isError: true,
    };
  }
}
