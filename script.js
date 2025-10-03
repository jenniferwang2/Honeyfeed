const sentiment = new Sentiment();

function vibe(score) {
  if (score > 0.2) return "💖 pos";
  if (score < -0.2) return "💔 neg";
  return "💗 neutral";
}

function badge(score) {
  return `<span class="badge">${vibe(score)} (${score.toFixed(2)})</span>`;
}

function card({ title, url, text, meta, score }) {
  return `
    <div class="card">
      ${title ? `<div><a href="${url || "#"}" target="_blank" rel="noopener">${title}</a> ${badge(score)}</div>` : ""}
      ${text ? `<div>${text}</div>` : ""}
      ${meta ? `<div class="meta">${meta}</div>` : ""}
    </div>
  `;
}

async function getRedditFeed(sub, type="hot", limit=10) {
  const res = await fetch(`https://www.reddit.com/r/${sub}/${type}.json?limit=${limit}`);
  if (!res.ok) throw new Error(`Failed to load ${type} posts`);
  const data = await res.json();
  return data.data.children.map(c => c.data);
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

    let html = `<h3>🔥 Hot</h3>`;
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

    // AI-ish: extract trending keywords
    const keywords = extractKeywords([...hot, ...top, ...cont]);
    html += `<h3>📊 Trending Keywords</h3><ul>` +
      keywords.map(k => `<li>${k[0]} (${k[1]})</li>`).join("") +
      `</ul>`;

    box.innerHTML = html;

  } catch (e) {
    box.innerHTML = `<p class='muted'>Error: ${e.message}</p>`;
  }
}

// Keyword extraction (basic ML/NLP flavor)
function extractKeywords(posts) {
  const counts = {};
  posts.forEach(p => {
    const words = (p.title || "").toLowerCase().split(/\W+/);
    words.forEach(w => {
      if (w.length > 3) counts[w] = (counts[w] || 0) + 1;
    });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);
}

function slugify(s) {
    return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  }
  
  async function loadTweetsFor(query) {
    const box = document.getElementById("tweets");
    box.innerHTML = "<p class='muted'>Loading tweets…</p>";
  
    try {
      const file = `data/tweets-${slugify(query)}.json`;
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) throw new Error("No cached tweets yet.");
      const rows = await res.json();
  
      const items = rows.slice(0, 15).map(t => {
        const s = sentiment.analyze(t.content).comparative || 0;
        return card({
          title: `@${t.username}`,
          url: t.url,
          text: t.content,
          meta: new Date(t.date).toLocaleString(),
          score: s,
        });
      });
  
      box.innerHTML = items.join("") || "<p class='muted'>No tweets found.</p>";
    } catch (e) {
      box.innerHTML = `<p class='muted'>${e.message}</p>`;
    }
  }
  

// Load trending fandoms into dropdown
async function loadTrendingFandoms() {
  const res = await fetch("https://www.reddit.com/subreddits/popular.json?limit=20");
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
}

// Event listeners
document.getElementById("go").addEventListener("click", () => {
  const fandom = document.getElementById("fandom").value;
  if (!fandom) return;
  loadReddit(fandom);
  loadTweetsFor(fandom);
});

// On load, populate dropdown + show default
window.addEventListener("load", async () => {
  await loadTrendingFandoms();
  const defaultFandom = document.getElementById("fandom").value;
  if (defaultFandom) {
    loadReddit(defaultFandom);
    loadTweetsFor(defaultFandom);
  }
});

// Auto-refresh every 60s
setInterval(() => {
  const fandom = document.getElementById("fandom").value;
  if (fandom) {
    loadReddit(fandom);
    loadTweetsFor(fandom);
  }
}, 60000);
