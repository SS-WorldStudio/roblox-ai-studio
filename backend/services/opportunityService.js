const { buildTopItems } = require("./trendAnalysisService");

function buildRecommendedOpportunities(genreCounts, mechanicCounts) {
  const sortedGenres = buildTopItems(genreCounts, 8);
  const sortedMechanics = buildTopItems(mechanicCounts, 8);
  const opportunities = [];

  sortedGenres.forEach((genre, index) => {
    if (genre.count <= 2) {
      const mechanic = sortedMechanics[index % sortedMechanics.length] || sortedMechanics[0];
      opportunities.push({
        type: "genre-mechanic-combo",
        title: `${genre.name} + ${mechanic.name}`,
        reason: `${genre.name} is relatively underrepresented, while ${mechanic.name} is already showing traction in the current charts.`
      });
    }
  });

  if (opportunities.length === 0) {
    opportunities.push({
      type: "general",
      title: "Hybrid trend concept",
      reason: "The current chart mix suggests a crossover concept could stand out with a fresh twist."
    });
  }

  return opportunities.slice(0, 6);
}

function createOpportunityIdeas(games) {
  const topGenres = buildTopItems(
    games.reduce((acc, game) => {
      acc[game.genre] = (acc[game.genre] || 0) + 1;
      return acc;
    }, {}),
    6
  );

  const topMechanics = buildTopItems(
    games.reduce((acc, game) => {
      game.mechanics.forEach((mechanic) => {
        acc[mechanic] = (acc[mechanic] || 0) + 1;
      });
      return acc;
    }, {}),
    6
  );

  const templates = [
    {
      title: "Seasonal Battle Royale Tycoon",
      genre: "Tycoon",
      coreLoop: "Players build a business empire, defend it from rival crews, and unlock themed seasonal events.",
      whyItCouldWork: "Tycoon mechanics pair well with live events and strong monetization hooks.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Season passes", "premium skins", "game passes"],
      estimatedBuildTime: "4-6 weeks",
      risks: ["Can feel derivative if the progression is too familiar"]
    },
    {
      title: "Anime Quest Simulator",
      genre: "Simulator",
      coreLoop: "Players collect anime-inspired pets, complete quests, and evolve their character through raids.",
      whyItCouldWork: "Anime and simulator themes are highly shareable and support strong collecting loops.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Pet bundles", "limited event passes", "cosmetic upgrades"],
      estimatedBuildTime: "5-7 weeks",
      risks: ["Requires strong art direction to stand out"]
    },
    {
      title: "Escape Room Obby Royale",
      genre: "Obby",
      coreLoop: "Players race through escape-room style stages while competing for speed and survival bonuses.",
      whyItCouldWork: "Obby gameplay remains accessible and can be refreshed with seasonal maps.",
      buildDifficulty: "Easy",
      monetizationIdeas: ["Map packs", "VIP access", "cosmetic trails"],
      estimatedBuildTime: "2-4 weeks",
      risks: ["High competition in the category"]
    },
    {
      title: "Social Racing Club",
      genre: "Racing",
      coreLoop: "Players race with friends, join clubs, and unlock customization through team events.",
      whyItCouldWork: "Racing works well when social features and customization are tied into progression.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Vehicle packs", "club subscriptions", "event cosmetics"],
      estimatedBuildTime: "4-6 weeks",
      risks: ["Needs a strong social hook to avoid being just another racer"]
    },
    {
      title: "Survival Craft PvP",
      genre: "Survival",
      coreLoop: "Players gather resources, build shelters, and fight for territory in short live matches.",
      whyItCouldWork: "Survival plus PvP can drive strong replayability and retention.",
      buildDifficulty: "Hard",
      monetizationIdeas: ["Battle passes", "premium gear", "seasonal cosmetics"],
      estimatedBuildTime: "6-8 weeks",
      risks: ["More complex to balance and maintain"]
    },
    {
      title: "Roleplay Town Builder",
      genre: "Roleplay",
      coreLoop: "Players run businesses, decorate neighborhoods, and host events in a shared town.",
      whyItCouldWork: "Roleplay games benefit from a strong community loop and creator-driven content.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Town passes", "premium decor", "group perks"],
      estimatedBuildTime: "5-7 weeks",
      risks: ["Retention depends on active community moderation"]
    },
    {
      title: "Tower Defense Soccer Clash",
      genre: "Sports",
      coreLoop: "Players defend towers, score goals, and unlock team upgrades in short matches.",
      whyItCouldWork: "A hybrid sports idea can feel fresh if the mechanics are simple and readable.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Team skins", "boost passes", "special stadium packs"],
      estimatedBuildTime: "3-5 weeks",
      risks: ["The concept may feel too niche without strong polish"]
    },
    {
      title: "Collectathon Adventure Hub",
      genre: "Adventure",
      coreLoop: "Players collect themed items, complete mini-missions, and unlock new worlds.",
      whyItCouldWork: "A collectible loop makes daily play rewarding and supports progression systems.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Collector packs", "VIP boosts", "limited cosmetics"],
      estimatedBuildTime: "4-6 weeks",
      risks: ["Needs strong content variety to avoid repetition"]
    },
    {
      title: "Fighting Simulator Arena",
      genre: "Fighting",
      coreLoop: "Players train combat skills, battle in ranked arenas, and earn gear for bigger fights.",
      whyItCouldWork: "Fighting and simulator mechanics can create a strong progression fantasy for competitive players.",
      buildDifficulty: "Medium",
      monetizationIdeas: ["Combat passes", "power-up packs", "cosmetic gear"],
      estimatedBuildTime: "4-6 weeks",
      risks: ["Combat balance can become a major time sink"]
    },
    {
      title: "World Cup Live Event Hub",
      genre: "Sports",
      coreLoop: "Players join limited-time events, compete in themed matches, and unlock event rewards.",
      whyItCouldWork: "Live events create urgency and can boost short-term engagement quickly.",
      buildDifficulty: "Easy",
      monetizationIdeas: ["Event passes", "premium tickets", "special cosmetics"],
      estimatedBuildTime: "2-3 weeks",
      risks: ["Retention can dip once the event cycle ends"]
    }
  ];

  return templates.slice(0, 10).map((template, index) => {
    const genreBoost = topGenres[index % topGenres.length] || { name: template.genre, count: 1 };
    const mechanicBoost = topMechanics[index % topMechanics.length] || { name: "Simulator", count: 1 };
    const trendScore = Math.min(95, 60 + (genreBoost.count * 4) + (mechanicBoost.count * 3));
    const competitionScore = Math.max(20, 85 - (genreBoost.count * 2));
    const difficultyScore = template.buildDifficulty === "Easy" ? 74 : template.buildDifficulty === "Medium" ? 64 : 52;
    const monetizationScore = template.monetizationIdeas.length * 10 + 35;
    const replayabilityScore = 60 + (template.coreLoop.includes("events") ? 12 : 0) + (template.coreLoop.includes("unlock") ? 10 : 0);
    const originalityScore = 55 + (index * 3);

    const score = Math.min(100, Math.round((trendScore * 0.25) + (competitionScore * 0.15) + (difficultyScore * 0.15) + (monetizationScore * 0.2) + (replayabilityScore * 0.15) + (originalityScore * 0.1)));

    return {
      title: template.title,
      score,
      genre: template.genre,
      coreLoop: template.coreLoop,
      whyItCouldWork: template.whyItCouldWork,
      buildDifficulty: template.buildDifficulty,
      monetizationIdeas: template.monetizationIdeas,
      estimatedBuildTime: template.estimatedBuildTime,
      risks: template.risks
    };
  }).sort((a, b) => b.score - a.score);
}

module.exports = {
  buildRecommendedOpportunities,
  createOpportunityIdeas
};
