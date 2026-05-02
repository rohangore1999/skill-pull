import { execSync } from 'child_process';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { downloadSkill } from '../skills-api.js';

/**
 * Resolve install directory:
 * - If projectPath provided → <projectPath>/.cursor/skills/
 * - Otherwise → <cwd>/.cursor/skills/
 */
function getSkillsDir(projectPath) {
  const base = projectPath || process.cwd();
  return join(base, '.cursor', 'skills');
}

/**
 * Parse source and slug from either:
 *   - full id: "vercel-labs/agent-skills/vercel-react-best-practices"
 *   - source + slug separately
 */
function parseSourceSlug(args) {
  const { id, source, slug } = args;

  if (id) {
    // id format: "owner/repo/skill-slug"
    const parts = id.split('/');
    if (parts.length >= 3) {
      return {
        source: parts.slice(0, 2).join('/'),
        slug: parts.slice(2).join('/'),
      };
    }
  }

  if (source && slug) return { source, slug };

  // source alone might be "owner/repo" — slug required
  throw new Error('Provide either "id" (from recommend_skills) or both "source" and "slug".');
}

/**
 * Write skill files directly to .cursor/skills/ using download API
 */
async function installViaApi(source, slug, projectPath) {
  const download = await downloadSkill(source, slug);

  if (!download?.files?.length) {
    throw new Error(`No files found for skill "${slug}" from "${source}". The skill may not exist or have no snapshot.`);
  }

  const skillDir = join(getSkillsDir(projectPath), slug);
  mkdirSync(skillDir, { recursive: true });

  let written = 0;
  for (const file of download.files) {
    if (!file?.path || file?.contents == null) continue;
    const filePath = join(skillDir, file.path);
    mkdirSync(join(filePath, '..'), { recursive: true });
    writeFileSync(filePath, file.contents, 'utf8');
    written++;
  }

  if (written === 0) throw new Error(`Skill "${slug}" downloaded but contained no writable files.`);

  return { skillDir, written };
}

export const installSkillTool = {
  name: 'install_skill',
  description:
    'Install a skill from skills.sh into the current project at .cursor/skills/. Pass the "id" field directly from recommend_skills. Skills stored here are picked up automatically by Cursor, Claude Code, Windsurf, and any MCP-compatible agent.',
  inputSchema: {
    type: 'object',
    properties: {
      id: {
        type: 'string',
        description: 'Full skill ID from recommend_skills e.g. "vercel-labs/agent-skills/vercel-react-best-practices". Use this instead of source+slug.',
      },
      source: {
        type: 'string',
        description: 'GitHub source e.g. "vercel-labs/agent-skills". Only needed if not using id.',
      },
      slug: {
        type: 'string',
        description: 'Skill slug e.g. "vercel-react-best-practices". Only needed if not using id.',
      },
      projectPath: {
        type: 'string',
        description: 'Absolute path to the project directory where .cursor/skills/ will be created e.g. "/Users/name/projects/my-app". Use the directory of the project being built.',
      },
    },
  },
};

/**
 * @param {{ id?: string, source?: string, slug?: string, projectPath?: string }} args
 */
export async function installSkill(args) {
  let parsed;

  try {
    parsed = parseSourceSlug(args);
  } catch (err) {
    return {
      content: [{ type: 'text', text: `Invalid input: ${err.message}\nTip: Pass the "id" field directly from recommend_skills.` }],
      isError: true,
    };
  }

  const { source, slug } = parsed;
  const SKILLS_DIR = getSkillsDir(args.projectPath);
  const skillDir = join(SKILLS_DIR, slug);

  // Already installed — skip
  if (existsSync(skillDir)) {
    return {
      content: [{ type: 'text', text: `✓ Already installed: ${slug}\n  Path: ${skillDir}` }],
    };
  }

  // Try npx skills add first (works when user has skills CLI installed)
  try {
    execSync(`npx --yes skills add ${source} --skill ${slug}`, {
      stdio: 'pipe',
      timeout: 60_000,
      cwd: process.cwd(),
    });

    if (existsSync(skillDir)) {
      return {
        content: [{ type: 'text', text: `✓ Installed: ${slug}\n  Source: ${source}\n  Path: ${skillDir}` }],
      };
    }
  } catch {
    // npx failed or skill dir not created — fall through to API
  }

  // Fallback: write directly via download API
  try {
    const { skillDir: installedDir, written } = await installViaApi(source, slug, args.projectPath);
    return {
      content: [{
        type: 'text',
        text: `✓ Installed: ${slug}\n  Source: ${source}\n  Files: ${written}\n  Path: ${installedDir}`,
      }],
    };
  } catch (err) {
    return {
      content: [{
        type: 'text',
        text: `✗ Failed to install "${slug}" from "${source}"\n  Reason: ${err.message}\n  Tip: Check the skill ID is correct from recommend_skills output.`,
      }],
      isError: true,
    };
  }
}
