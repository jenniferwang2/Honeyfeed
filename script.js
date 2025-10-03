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

async function loadReddit(sub) {
  const box = document.getElementById("reddit");
  box.innerHTML = "<p class='muted'>Loading…</p>";
  try {
    const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/hot.json?limit=15`);
    if (!res.ok) throw new Error("Subreddit not found or rate-limited");
    const data = await res.json();
    const items = data.data.children.map((c) => {
      const p = c.data;
      const s = sentiment.analyze(p.title || "").comparative || 0;
      return card({
        title: p.title,
        url: `https://reddit.com${p.permalink}`,
        meta: `u/${p.author} • ${p.ups} upvotes`,
        score: s,
      });
    });
    box.innerHTML = items.join("") || "<p class='muted'>No posts found.</p>";
  } catch (e) {
    box.innerHTML = `<p class='muted'>${e.message}</p>`;
  }
}

// Placeholder for tweets (future step)
async function loadTweetsFor(q) {
  const box = document.getElementById("tweets");
  box.innerHTML = "<p class='muted'>Tweet caching not set up yet.</p>";
}

document.getElementById("go").addEventListener("click", () => {
  const sub = document.getElementById("subreddit").value.trim();
  if (!sub) return;
  loadReddit(sub);
  loadTweetsFor(sub);
});

document.getElementById("subreddit").addEventListener("keydown", (e) => {
  if (e.key === "Enter") document.getElementById("go").click();
});

// Default load
loadReddit("TaylorSwift");
loadTweetsFor("TaylorSwift");
