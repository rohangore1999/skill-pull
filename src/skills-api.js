const BASE_URL = 'https://skills.sh';
const FETCH_TIMEOUT = 10_000;

/**
 * Search skills.sh using semantic search
 * @param {string} query - plain English description
 * @param {number} limit - max results to return
 * @returns {Promise<Array>} - list of skill objects
 */
export async function searchSkills(query, limit = 10) {
  const url = `${BASE_URL}/api/search?q=${encodeURIComponent(query)}&limit=${limit}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`Search failed: ${res.status}`);

  const data = await res.json();
  return data.skills ?? [];
}

/**
 * Download full skill content (SKILL.md + all files)
 * @param {string} source - e.g. "vercel-labs/agent-skills"
 * @param {string} slug - e.g. "vercel-react-best-practices"
 * @returns {Promise<{hash: string, files: Array}>}
 */
export async function downloadSkill(source, slug) {
  const [owner, repo] = source.split('/');
  const url = `${BASE_URL}/api/download/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/${encodeURIComponent(slug)}`;

  const res = await fetch(url, { signal: AbortSignal.timeout(FETCH_TIMEOUT) });
  if (!res.ok) throw new Error(`Download failed: ${res.status} for ${source}/${slug}`);

  return res.json();
}

/**
 * Extract SKILL.md content from a download response
 * @param {{files: Array}} downloadResponse
 * @returns {string}
 */
export function extractSkillMd(downloadResponse) {
  const skillMd = downloadResponse.files?.find((f) => f.path === 'SKILL.md');
  return skillMd?.contents ?? '';
}
