const express = require("express");

const { scrapeRobloxChartsGames, analyzeRobloxGame } = require("../services/robloxScrapingService");
const { classifyGenre, detectMechanics, buildTopItems } = require("../services/trendAnalysisService");
const { buildRecommendedOpportunities, createOpportunityIdeas } = require("../services/opportunityService");
const { run, all } = require("../database/db");

const router = express.Router();

router.get("/charts", async (req, res) => {
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

router.get("/trend-report", async (req, res) => {
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

router.get("/analyze-game", async (req, res) => {
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

router.get("/opportunities", async (req, res) => {
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

router.post("/save-scan", async (req, res) => {
  try {
    const device = req.body?.device || "computer";
    const country = req.body?.country || "ca";
    const games = await scrapeRobloxChartsGames();

    const scanResult = await run(
      "INSERT INTO scans (scannedAt, device, country, totalGames) VALUES (?, ?, ?, ?)",
      [new Date().toISOString(), device, country, games.length]
    );

    const scanId = scanResult.id;

    for (const game of games) {
      await run(
        "INSERT INTO games (scanId, name, url, likes, players, rawText) VALUES (?, ?, ?, ?, ?, ?)",
        [scanId, game.name, game.url, game.likes, game.players, game.rawText]
      );
    }

    res.json({
      success: true,
      scanId,
      savedGames: games.length,
      message: "Scan saved successfully"
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

router.get("/history", async (req, res) => {
  try {
    const scans = await all("SELECT * FROM scans ORDER BY id DESC LIMIT 10");
    const games = await all("SELECT * FROM games ORDER BY id DESC LIMIT 100");

    res.json({
      success: true,
      scans,
      games
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

module.exports = router;
