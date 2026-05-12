#!/usr/bin/env node
// Hook that runs after each API response (Claude's reply)
// Saves token stats to ~/.claude/stats/claude-stats.jsonl

const fs = require('fs');
const path = require('path');
const os = require('os');

// Configuration – you can also read from an external config file
const STATS_DIR = path.join(os.homedir(), '.claude', 'stats');
const STATS_FILE = path.join(STATS_DIR, 'claude-stats.jsonl');
const SESSION_STATS_FILE = path.join(STATS_DIR, 'session-summary.json');

// Ensure directory exists
if (!fs.existsSync(STATS_DIR)) {
  fs.mkdirSync(STATS_DIR, { recursive: true });
}

// Helper: get current session ID from environment or context
function getSessionId() {
  // Claude Code sets env var or passes in context
  return process.env.CLAUDE_SESSION_ID || `session-${Date.now()}`;
}

// Main hook function – receives data from Claude Code
async function main() {
  // The hook receives data via stdin (JSON) or as arguments
  let inputData = '';
  if (!process.stdin.isTTY) {
    inputData = fs.readFileSync(0, 'utf8');
  }

  let hookEvent = {};
  try {
    hookEvent = JSON.parse(inputData);
  } catch (e) {
    console.error('Failed to parse hook input:', e.message);
    process.exit(0); // Don't block Claude Code
  }

  // Extract token usage and metadata
  // The exact field names depend on Claude Code's hook payload
  // Common structure: { response: { usage: { input_tokens, output_tokens, total_tokens }, model, ... }, session_id, timestamp }
  const usage = hookEvent.response?.usage || 
                hookEvent.usage || 
                hookEvent.token_usage || 
                {};

  const model = hookEvent.model || 
                hookEvent.response?.model || 
                process.env.CLAUDE_MODEL || 
                'unknown';

  const timestamp = hookEvent.timestamp || new Date().toISOString();
  const sessionId = hookEvent.session_id || getSessionId();

  // Calculate approximate cost (prices per 1M tokens – adjust as needed)
  // Sonnet: $3 input / $15 output; Haiku: $0.25 / $1.25; Opus: $15 / $75
  const inputTokens = usage.input_tokens || usage.prompt_tokens || 0;
  const outputTokens = usage.output_tokens || usage.completion_tokens || 0;
  let cost = 0;
  if (model.includes('haiku')) {
    cost = (inputTokens * 0.25 + outputTokens * 1.25) / 1_000_000;
  } else if (model.includes('opus')) {
    cost = (inputTokens * 15 + outputTokens * 75) / 1_000_000;
  } else { // sonnet or default
    cost = (inputTokens * 3 + outputTokens * 15) / 1_000_000;
  }

  const record = {
    timestamp,
    session_id: sessionId,
    model,
    input_tokens: inputTokens,
    output_tokens: outputTokens,
    total_tokens: inputTokens + outputTokens,
    cost_usd: cost,
    // You can also add tool names, file paths, etc. if available
    tool_calls: hookEvent.tool_calls || [],
    message_preview: hookEvent.user_message?.substring(0, 100) || ''
  };

  // Append to JSON Lines file
  fs.appendFileSync(STATS_FILE, JSON.stringify(record) + '\n');

  // Also update cumulative session stats (optional)
  updateSessionStats(sessionId, record);
}

// Update running totals per session
function updateSessionStats(sessionId, record) {
  let sessionStats = {};
  if (fs.existsSync(SESSION_STATS_FILE)) {
    try {
      sessionStats = JSON.parse(fs.readFileSync(SESSION_STATS_FILE, 'utf8'));
    } catch (e) {}
  }

  if (!sessionStats[sessionId]) {
    sessionStats[sessionId] = {
      session_id: sessionId,
      start_time: record.timestamp,
      total_input_tokens: 0,
      total_output_tokens: 0,
      total_cost_usd: 0,
      call_count: 0,
      last_updated: record.timestamp
    };
  }

  const stat = sessionStats[sessionId];
  stat.total_input_tokens += record.input_tokens;
  stat.total_output_tokens += record.output_tokens;
  stat.total_cost_usd += record.cost_usd;
  stat.call_count += 1;
  stat.last_updated = record.timestamp;

  fs.writeFileSync(SESSION_STATS_FILE, JSON.stringify(sessionStats, null, 2));
}

main().catch(err => {
  console.error('Stats hook error:', err);
  process.exit(0); // Always exit cleanly
});