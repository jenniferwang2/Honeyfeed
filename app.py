from flask import Flask, request, jsonify
import requests
from vaderSentiment.vaderSentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
analyzer = SentimentIntensityAnalyzer()

@app.route("/")
def home():
    return {"status": "ok", "message": "Honeyfeed API is running"}

@app.route("/popular")
def popular():
    url = "https://api.reddit.com/subreddits/popular?limit=20&raw_json=1"
    r = requests.get(url, headers={"User-Agent": "HoneyfeedBot/1.0"})
    data = r.json()
    subs = [{"name": c["data"]["display_name"]} for c in data["data"]["children"]]
    return jsonify(subs)

@app.route("/feed")
def feed():
    sub = request.args.get("sub", "anime")
    type_ = request.args.get("type", "hot")
    url = f"https://api.reddit.com/r/{sub}/{type_}?limit=10&raw_json=1"
    r = requests.get(url, headers={"User-Agent": "HoneyfeedBot/1.0"})
    data = r.json()
    posts = []
    for child in data.get("data", {}).get("children", []):
        p = child["data"]
        score = analyzer.polarity_scores(p["title"])["compound"]
        posts.append({
            "title": p["title"],
            "url": "https://reddit.com" + p["permalink"],
            "author": p["author"],
            "ups": p["ups"],
            "sentiment": score
        })
    return jsonify(posts)

if __name__ == "__main__":
    app.run(debug=True)
