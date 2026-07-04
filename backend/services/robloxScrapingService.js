const { chromium } = require("playwright");

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

module.exports = {
  scrapeRobloxChartsGames,
  analyzeRobloxGame
};
