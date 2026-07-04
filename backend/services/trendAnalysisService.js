const { GENRE_RULES, MECHANIC_RULES } = require("../config/roblox");
const { normalizeText } = require("../utils/text");

function classifyGenre(game) {
  const combinedText = `${game.name || ""} ${game.rawText || ""}`;
  const normalized = normalizeText(combinedText);

  for (const rule of GENRE_RULES) {
    if (rule.keywords.some((keyword) => normalized.includes(keyword))) {
      return rule.name;
    }
  }

  return "Other";
}

function detectMechanics(game) {
  const combinedText = `${game.name || ""} ${game.rawText || ""}`;
  const normalized = normalizeText(combinedText);

  return MECHANIC_RULES.filter((rule) => rule.keywords.some((keyword) => normalized.includes(keyword))).map((rule) => rule.name);
}

function buildTopItems(counts, limit = 8) {
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
    .slice(0, limit);
}

module.exports = {
  classifyGenre,
  detectMechanics,
  buildTopItems
};
