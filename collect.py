
import json
import urllib.request
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent
SOURCES = ROOT / "sources.json"
OUTPUT = ROOT / "videos.json"

NS = {
    "atom": "http://www.w3.org/2005/Atom",
    "yt": "http://www.youtube.com/xml/schemas/2015",
    "media": "http://search.yahoo.com/mrss/"
}

def collect_source(source):
    request = urllib.request.Request(
        source["feed_url"],
        headers={"User-Agent": "SpectrumFeedReader/1.0"}
    )

    with urllib.request.urlopen(request, timeout=25) as response:
        document = response.read(3_000_000)

    root = ET.fromstring(document)
    results = []

    for entry in root.findall("atom:entry", NS):
        video_id = entry.findtext("yt:videoId", namespaces=NS)
        if not video_id:
            continue

        thumbnail = entry.find(
            "media:group/media:thumbnail", NS
        )

        thumbnail_url = (
            thumbnail.get("url")
            if thumbnail is not None
            else f"https://i.ytimg.com/vi/{video_id}/hqdefault.jpg"
        )

        results.append({
            "id": video_id,
            "platform": "youtube",
            "creator": source["name"],
            "category": source.get("category", "Unclassified"),
            "title": entry.findtext(
                "atom:title", default="Untitled", namespaces=NS
            ),
            "published_at": entry.findtext(
                "atom:published", default="", namespaces=NS
            ),
            "url": f"https://www.youtube.com/watch?v={video_id}",
            "thumbnail_url": thumbnail_url
        })

    return results


def main():
    sources = json.loads(SOURCES.read_text(encoding="utf-8"))

    existing = []
    if OUTPUT.exists():
        try:
            existing = json.loads(OUTPUT.read_text(encoding="utf-8"))
            if not isinstance(existing, list):
                existing = []
        except (ValueError, OSError):
            print("Warning: existing video cache could not be read.")

    videos = {
        item["url"]: item
        for item in existing
        if isinstance(item, dict) and item.get("url")
    }

    successful_feeds = 0

    for source in sources:
        if not source.get("enabled", True):
            continue

        if source.get("platform") != "youtube":
            print(f"Skipping unsupported platform: {source.get('platform')}")
            continue

        try:
            items = collect_source(source)
            successful_feeds += 1

            for item in items:
                videos[item["url"]] = item

            print(f"{source['name']}: {len(items)} entries received")

        except Exception as error:
            print(f"Feed failed: {source['name']}: {error}")

    if successful_feeds == 0:
        raise SystemExit("No feeds succeeded. Existing data preserved.")

    ordered = sorted(
        videos.values(),
        key=lambda item: item.get("published_at", ""),
        reverse=True
    )[:200]

    OUTPUT.write_text(
        json.dumps(ordered, indent=2, ensure_ascii=False) + "\n",
        encoding="utf-8"
    )

    print(f"Saved {len(ordered)} videos to videos.json")


if __name__ == "__main__":
    main()
