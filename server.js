const express = require("express");
const cors = require("cors");
const { chromium } = require("playwright");

const app = express();
const PORT = 3000;

app.use(cors());

const GENRE_RULES = [
  { name: "Sports", keywords: ["sports", "soccer", "football", "basketball", "volleyball", "tennis", "golf", "baseball"] },
  { name: "Simulator", keywords: ["simulator", "sim", "idle", "tycoon"] },
  { name: "Anime", keywords: ["anime", "naruto", "dragon", "one piece", "manga"] },
  { name: "Roleplay", keywords: ["roleplay", "rp", "role play", "town", "family"] },
  { name: "Obby", keywords: ["obby", "obby", "parkour", "stages"] },
  { name: "PvP", keywords: ["pvp", "battle", "duel", "versus", "arena"] },
  { name: "Horror", keywords: ["horror", "scary", "nightmare", "zombie", "ghost"] },
  { name: "Tycoon", keywords: ["tycoon", "business", "manager"] },
  { name: "Fighting", keywords: ["fighting", "combat", "martial", "brawl"] },
  { name: "Social", keywords: ["social", "chat", "hangout", "friend", "party"] },
  { name: "Racing", keywords: ["racing", "race", "car", "drift", "driving"] },
  { name: "Survival", keywords: ["survival", "survive", "survivor", "zombie", "craft"] }
];

const MECHANIC_RULES = [
  { name: "Pets", keywords: ["pet", "pets"] },
  { name: "Soccer", keywords: ["soccer", "football"] },
  { name: "Fighting", keywords: ["fighting", "combat", "brawl"] },
  { name: "Tower", keywords: ["tower", "tower defense"] },
  { name: "Escape", keywords: ["escape", "escaping"] },
  { name: "Roleplay", keywords: ["roleplay", "rp"] },
  { name: "Driving", keywords: ["driving", "car", "race", "racing", "drift"] },
  { name: "Building", keywords: ["build", "building", "builder"] },
  { name: "Survival", keywords: ["survival", "survive", "zombie"] },
  { name: "Collecting", keywords: ["collect", "collecting", "collectibles"] },
  { name: "Trading", keywords: ["trade", "trading"] },
  { name: "Update Event", keywords: ["update event", "event", "update"] },
  { name: "World Cup", keywords: ["world cup", "worldcup"] },
  { name: "UGC", keywords: ["ugc"] },
  { name: "Simulator", keywords: ["simulator", "sim", "idle"] }
];

function normalizeText(value = "") {
  return value.toLowerCase();
}

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

async function scrapeRobloxChartsGames() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto("https://www.roblox.com/charts?device=computer&country=ca", {
      waitUntil: "networkidle",
      timeout: 60000
    });

    await page.waitForTimeout(3000);

    const games = await page.evaluate(() => {
      const cards = Array.from(document.querySelectorAll("a[href*='/games/']"));
      const seen = new Set();

      return cards
        .map((card) => {
          const rawText = card.innerText.trim();
          const url = card.href;

          if (!rawText || seen.has(url)) return null;
          seen.add(url);

          const lines = rawText
            .split("\n")
            .map((x) => x.trim())
            .filter(Boolean);

          const likeMatch = rawText.match(/(\d+)%/);
          const playerMatch = rawText.match(/(\d+(\.\d+)?K|\d+(\.\d+)?M|\d+)\s*$/);

          return {
            name: lines[0] || rawText,
            likes: likeMatch ? likeMatch[1] + "%" : null,
            players: playerMatch ? playerMatch[1] : null,
            rawText,
            url
          };
        })
        .filter(Boolean)
        .slice(0, 80);
    });

    return games;
  } finally {
    await browser.close();
  }
}

async function analyzeRobloxGame(url) {
  if (!url) {
    throw new Error("A valid url query parameter is required.");
  }

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: 60000
    });

    await page.waitForTimeout(4000);

    return await page.evaluate(() => {
      const cleanText = (value) => {
        if (!value) return null;
        const normalized = String(value).replace(/\s+/g, " ").trim();
        return normalized || null;
      };

      const getFirstText = (selectors) => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          const text = cleanText(element?.innerText);
          if (text) return text;
        }
        return null;
      };

      const getVisibleTextFromCandidates = (selectors) => {
        for (const selector of selectors) {
          const elements = Array.from(document.querySelectorAll(selector));
          for (const element of elements) {
            const text = cleanText(element.innerText);
            if (text && text.length > 40 && text.length < 2000) {
              return text;
            }
          }
        }
        return null;
      };

      const title = getFirstText([
        "h1",
        "[data-testid='game-title']",
        "[data-testid='title']",
        "[class*='title']",
        "meta[property='og:title']"
      ]);

      const description = getVisibleTextFromCandidates([
        "[data-testid='game-description']",
        "[data-testid='description']",
        "[aria-label*='description' i]",
        "[class*='description' i]",
        "p"
      ]);

      const creator = (() => {
        const link = Array.from(document.querySelectorAll('a[href*="/users/"]')).find((element) => {
          const href = element.getAttribute("href") || "";
          return href.includes("/users/") && !href.includes("/games/") && !href.includes("/users/search") && element.innerText.trim();
        });
        return cleanText(link?.innerText);
      })();

      const group = (() => {
        const link = Array.from(document.querySelectorAll('a[href*="/groups/"]')).find((element) => {
          const href = element.getAttribute("href") || "";
          return href.includes("/groups/") && element.innerText.trim();
        });
        return cleanText(link?.innerText);
      })();

      const bodyText = cleanText(document.body?.innerText) || "";
      const findStat = (patterns) => {
        for (const pattern of patterns) {
          const match = bodyText.match(pattern);
          if (match) return cleanText(match[1] || match[0]);
        }
        return null;
      };

      const stats = {
        likes: findStat([/likes?\s*[:#]?\s*([0-9,\.]+(?:K|M|B)?)/i, /([0-9,\.]+(?:K|M|B)?)\s*likes?/i]),
        activePlayers: findStat([/active\s*players?\s*[:#]?\s*([0-9,\.]+(?:K|M|B)?)/i, /online\s*[:#]?\s*([0-9,\.]+(?:K|M|B)?)/i]),
        visits: findStat([/visits?\s*[:#]?\s*([0-9,\.]+(?:K|M|B)?)/i]),
        favorites: findStat([/favorites?\s*[:#]?\s*([0-9,\.]+(?:K|M|B)?)/i]),
        ageGuideline: findStat([/age\s*guideline[s]?\s*[:#]?\s*([^\n]+)/i]),
        createdDate: findStat([/created\s*[:#]?\s*([^\n]+)/i]),
        updatedDate: findStat([/updated\s*[:#]?\s*([^\n]+)/i])
      };

      return {
        title: cleanText(title),
        description,
        creator,
        group,
        stats
      };
    });
  } finally {
    await browser.close();
  }
}

app.get("/", (req, res) => {
  res.send("🚀 Roblox Trend API is running!");
});

app.get("/roblox/charts", async (req, res) => {
  try {
    const games = await scrapeRobloxChartsGames();

    res.json({
      success: true,
      source: "Roblox Charts",
      device: "computer",
      country: "ca",
      scannedAt: new Date().toISOString(),
      count: games.length,
      games
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/roblox/trend-report", async (req, res) => {
  try {
    const games = await scrapeRobloxChartsGames();
    const enrichedGames = games.map((game) => ({
      ...game,
      genre: classifyGenre(game),
      mechanics: detectMechanics(game)
    }));

    const genreCounts = enrichedGames.reduce((acc, game) => {
      acc[game.genre] = (acc[game.genre] || 0) + 1;
      return acc;
    }, {});

    const mechanicCounts = enrichedGames.reduce((acc, game) => {
      game.mechanics.forEach((mechanic) => {
        acc[mechanic] = (acc[mechanic] || 0) + 1;
      });
      return acc;
    }, {});

    res.json({
      success: true,
      scannedAt: new Date().toISOString(),
      totalGames: enrichedGames.length,
      topGenres: buildTopItems(genreCounts, 8),
      topMechanics: buildTopItems(mechanicCounts, 8),
      games: enrichedGames,
      recommendedOpportunities: buildRecommendedOpportunities(genreCounts, mechanicCounts)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/roblox/analyze-game", async (req, res) => {
  try {
    const { url } = req.query;
    const result = await analyzeRobloxGame(url);

    res.json({
      success: true,
      scannedAt: new Date().toISOString(),
      url,
      ...result
    });
  } catch (err) {
    res.status(400).json({
      success: false,
      error: err.message
    });
  }
});

app.get("/roblox/opportunities", async (req, res) => {
  try {
    const games = await scrapeRobloxChartsGames();
    const enrichedGames = games.map((game) => ({
      ...game,
      genre: classifyGenre(game),
      mechanics: detectMechanics(game)
    }));

    res.json({
      success: true,
      scannedAt: new Date().toISOString(),
      totalGames: enrichedGames.length,
      opportunities: createOpportunityIdeas(enrichedGames)
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});