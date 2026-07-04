const state = {
  currentView: "welcome"
};

const statusEl = document.getElementById("status");
const resultsEl = document.getElementById("results");

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.borderColor = isError ? "rgba(248, 113, 113, 0.35)" : "rgba(120, 171, 255, 0.24)";
}

function renderCard(title, body) {
  const card = document.createElement("article");
  card.className = "card";
  card.innerHTML = `<h3>${title}</h3>${body}`;
  resultsEl.appendChild(card);
}

function renderScanSummary(scanData) {
  resultsEl.innerHTML = "";
  renderCard("Latest Save", `
    <p><strong>Scan ID:</strong> ${scanData.scanId}</p>
    <p><strong>Games saved:</strong> ${scanData.savedGames}</p>
    <span class="badge">Saved to SQLite</span>
  `);
}

function renderHistory(historyData) {
  resultsEl.innerHTML = "";

  const scans = historyData.scans || [];
  const games = historyData.games || [];

  if (scans.length === 0) {
    renderCard("History", "<p>No scan history yet.</p>");
    return;
  }

  renderCard("Recent Scans", `
    <ul>
      ${scans.slice(0, 5).map((scan) => `<li>${new Date(scan.scannedAt).toLocaleString()} · ${scan.totalGames} games · ${scan.device}</li>`).join("")}
    </ul>
  `);

  renderCard("Recent Games", `
    <ul>
      ${games.slice(0, 8).map((game) => `<li>${game.name}</li>`).join("")}
    </ul>
  `);
}

function renderTrendReport(reportData) {
  resultsEl.innerHTML = "";
  const topGenres = reportData.topGenres || [];
  const topMechanics = reportData.topMechanics || [];
  const opportunities = reportData.recommendedOpportunities || [];

  renderCard("Trend Snapshot", `
    <div class="metric-row"><span>Total games</span><strong>${reportData.totalGames || 0}</strong></div>
    <div class="metric-row"><span>Top genres</span><strong>${topGenres.slice(0, 3).map((item) => item.name).join(", ")}</strong></div>
    <div class="metric-row"><span>Top mechanics</span><strong>${topMechanics.slice(0, 3).map((item) => item.name).join(", ")}</strong></div>
  `);

  renderCard("Recommended Opportunities", `
    <ul>
      ${opportunities.map((item) => `<li><strong>${item.title}</strong>: ${item.reason}</li>`).join("")}
    </ul>
  `);
}

function renderOpportunities(opportunityData) {
  resultsEl.innerHTML = "";
  const opportunities = opportunityData.opportunities || [];

  if (!opportunities.length) {
    renderCard("Opportunities", "<p>No opportunities available right now.</p>");
    return;
  }

  opportunities.slice(0, 6).forEach((item) => {
    renderCard(item.title, `
      <p><strong>Score:</strong> ${item.score}</p>
      <p><strong>Genre:</strong> ${item.genre}</p>
      <p>${item.whyItCouldWork}</p>
      <p><strong>Build difficulty:</strong> ${item.buildDifficulty}</p>
    `);
  });
}

async function requestJson(path, options = {}) {
  const response = await fetch(path, {
    headers: {
      "Content-Type": "application/json"
    },
    ...options
  });

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return response.json();
}

async function handleAction(action) {
  try {
    setStatus("Loading insights...");
    resultsEl.innerHTML = "";

    switch (action) {
      case "save-scan": {
        const data = await requestJson("/roblox/save-scan", { method: "POST", body: JSON.stringify({ device: "computer", country: "ca" }) });
        renderScanSummary(data);
        setStatus(`Saved ${data.savedGames} games successfully.`);
        break;
      }
      case "history": {
        const data = await requestJson("/roblox/history");
        renderHistory(data);
        setStatus("Loaded recent scan history.");
        break;
      }
      case "trend-report": {
        const data = await requestJson("/roblox/trend-report");
        renderTrendReport(data);
        setStatus("Loaded trend report insights.");
        break;
      }
      case "opportunities": {
        const data = await requestJson("/roblox/opportunities");
        renderOpportunities(data);
        setStatus("Loaded opportunity ideas.");
        break;
      }
      default:
        setStatus("Select an action to begin.");
    }
  } catch (error) {
    console.error(error);
    setStatus(error.message, true);
  }
}

document.querySelectorAll("button[data-action]").forEach((button) => {
  button.addEventListener("click", () => handleAction(button.dataset.action));
});
