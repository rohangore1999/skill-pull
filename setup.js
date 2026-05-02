#!/usr/bin/env node

/**
 * skill-pull setup script
 * Copies the auto-skills rule to the correct location for each detected agent.
 * Run: node setup.js  (from any project directory)
 */

import { existsSync, mkdirSync, copyFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const RULES_DIR = join(__dirname, 'agent-rules');
const CWD = process.cwd();

const RULE_CONTENT = readFileSync(join(RULES_DIR, 'CLAUDE.md'), 'utf8');

function write(dest, content) {
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  copyFileSync(join(RULES_DIR, content), dest);
  console.log(`  ✓ ${dest}`);
}

function writeContent(dest, content) {
  const dir = dirname(dest);
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  import('fs').then(({ writeFileSync }) => writeFileSync(dest, content, 'utf8'));
  console.log(`  ✓ ${dest}`);
}

console.log('\n skill-pull — installing agent rules\n');

let installed = 0;

// Cursor — global rule (applies to all projects)
const cursorGlobalRule = join(homedir(), '.cursor', 'rules', 'auto-skills.mdc');
write(cursorGlobalRule, 'CLAUDE.md');
// Rewrite with proper frontmatter for Cursor
import('fs').then(({ writeFileSync }) => {
  writeFileSync(cursorGlobalRule, `---
description: Before starting any build task, automatically find and load relevant skills from skills.sh using the skill-pull MCP server.
globs:
alwaysApply: true
---

${RULE_CONTENT}`, 'utf8');
});
installed++;

// Claude Code — CLAUDE.md in project root
const claudeMd = join(CWD, 'CLAUDE.md');
if (!existsSync(claudeMd)) {
  write(claudeMd, 'CLAUDE.md');
  installed++;
} else {
  // Append to existing CLAUDE.md
  import('fs').then(({ appendFileSync }) => {
    appendFileSync(claudeMd, `\n\n${RULE_CONTENT}`, 'utf8');
  });
  console.log(`  ✓ Appended to existing CLAUDE.md`);
  installed++;
}

// Windsurf — .windsurfrules in project root
const windsurfRules = join(CWD, '.windsurfrules');
if (!existsSync(windsurfRules)) {
  write(windsurfRules, '.windsurfrules');
  installed++;
}

// GitHub Copilot — .github/copilot-instructions.md
const copilotInstructions = join(CWD, '.github', 'copilot-instructions.md');
if (!existsSync(copilotInstructions)) {
  write(copilotInstructions, 'copilot-instructions.md');
  installed++;
}

// OpenAI Codex / generic agents — AGENTS.md
const agentsMd = join(CWD, 'AGENTS.md');
if (!existsSync(agentsMd)) {
  write(agentsMd, 'AGENTS.md');
  installed++;
}

// Kiro — .kiro/steering
const kiroSteering = join(CWD, '.kiro', 'steering', 'auto-skills.md');
if (!existsSync(kiroSteering)) {
  write(kiroSteering, 'CLAUDE.md');
  installed++;
}

console.log(`\n Done! Installed rules for ${installed} agents.\n`);
console.log(' Next: Add skill-pull to your MCP config and restart your agent.\n');
console.log(' Cursor (~/.cursor/mcp.json):');
console.log(` {
   "mcpServers": {
     "skill-pull": {
       "command": "node",
       "args": ["${join(__dirname, 'src', 'index.js')}"]
     }
   }
 }\n`);
