// Change this when deployed to your Render URL!
const API_BASE = "http://127.0.0.1:5000";

function vibe(score) {
  if (score > 0.2) return "💖 pos";
  if (score < -0.2) return "💔 neg";
  return "💗 neutral";
}

function badge(score) {
  return `<span class="badge">${vibe(score)} (${score.toFixed(2)})</span>`;
}

function card({ title, url, meta, score }) {
  return `
    <div class="card">
      <div><a href="${url}" target="_blank" rel="noopener">${title}</a> ${badge(score)}</div>
      ${meta ? `<div class="meta">${meta}</div>` : ""}
    </div>
  `;
}

// Fetch subreddit posts through Flask
async function getRedditFeed(sub, type="hot") {
    const res = await fetch(`${API_BASE}/feed?sub=${encodeURIComponent(sub)}&type=${encodeURIComponent(type)}`);
    if (!res.ok) throw new Error("Feed error");
    return await res.json();
  }
  
  // Fetch popular subs through Flask
  async function loadTrendingFandoms() {
    const res = await fetch(`${API_BASE}/popular`);
    if (!res.ok) throw new Error("Popular error");
    const data = await res.json();
    const select = document.getElementById("fandom");
    select.innerHTML = "";
    data.forEach(c => {
      const opt = document.createElement("option");
      opt.value = c.name;
      opt.textContent = c.name;
      select.appendChild(opt);
    });
  }  

async function loadReddit(sub) {
  const box = document.getElementById("reddit");
  box.innerHTML = "<p class='muted'>Loading…</p>";

  try {
    const [hot, top, cont] = await Promise.all([
      getRedditFeed(sub, "hot"),
      getRedditFeed(sub, "top"),
      getRedditFeed(sub, "controversial")
    ]);

    let html = `<h2>Results for r/${sub}</h2>`;

    html += `<h3>🔥 Hot</h3>`;
    hot.forEach(p => {
      const s = sentiment.analyze(p.title).comparative || 0;
      html += card({
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        meta: `u/${p.author} • ${p.ups} upvotes`,
        score: s
      });
    });

    html += `<h3>🏆 Top</h3>`;
    top.forEach(p => {
      const s = sentiment.analyze(p.title).comparative || 0;
      html += card({
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        meta: `u/${p.author} • ${p.ups} upvotes`,
        score: s
      });
    });

    html += `<h3>⚡ Controversial</h3>`;
    cont.forEach(p => {
      const s = sentiment.analyze(p.title).comparative || 0;
      html += card({
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        meta: `u/${p.author} • ${p.ups} upvotes`,
        score: s
      });
    });

    const keywords = extractKeywords([...hot, ...top, ...cont]);
    html += `<h3>📊 Trending Keywords</h3><ul>` +
      keywords.map(k => `<li>${k[0]} (${k[1]})</li>`).join("") +
      `</ul>`;

    box.innerHTML = html;

  } catch (e) {
    box.innerHTML = `<p class='muted'>Error: ${e.message}</p>`;
  }
}

function extractKeywords(posts) {
  const counts = {};
  posts.forEach(p => {
    const words = (p.title || "").toLowerCase().split(/\W+/);
    words.forEach(w => {
      if (w.length > 3) counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5);
}

// --- Dropdown and custom input ---
async function loadTrendingFandoms() {
  try {
    const res = await fetch("https://www.reddit.com/subreddits/popular.json?limit=20");
    if (!res.ok) throw new Error("Failed to load trending subreddits");
    const data = await res.json();
    const select = document.getElementById("fandom");

    select.innerHTML = "";
    data.data.children.forEach(c => {
      const name = c.data.display_name;
      const opt = document.createElement("option");
      opt.value = name;
      opt.textContent = name;
      select.appendChild(opt);
    });
  } catch (e) {
    console.error(e);
  }
}

// --- Event listeners ---
document.getElementById("go").addEventListener("click", () => {
  let fandom = document.getElementById("customFandom").value.trim();
  if (!fandom) {
    fandom = document.getElementById("fandom").value;
  }
  if (!fandom) return;
  loadReddit(fandom);
});

// On load: fill dropdown and fetch default
window.addEventListener("load", async () => {
  await loadTrendingFandoms();
  const defaultFandom = document.getElementById("fandom").value;
  if (defaultFandom) {
    loadReddit(defaultFandom);
  }
});

// Auto-refresh every 60s
setInterval(() => {
  let fandom = document.getElementById("customFandom").value.trim();
  if (!fandom) {
    fandom = document.getElementById("fandom").value;
  }
  if (fandom) {
    loadReddit(fandom);
  }
}, 60000);
