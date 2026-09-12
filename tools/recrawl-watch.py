#!/Users/pt/.venvs/gsc/bin/python
"""Wake the ingglish room when Google recrawls what September changed.

Two questions are waiting on Googlebot and neither can be answered by a date:
the title rewrite is only measurable once the new <title> is in the index, and
the 6,361 /rhymes/ pages are only measurable once they have been crawled at
all. So each arm gates on a crawl date rather than on the calendar, wakes the
room once, and disarms itself.

Runs on the Mac. The service-account key and this interpreter are host-only.
"""
import datetime as dt
import json
import os
import pathlib
import subprocess
import sys
import urllib.request
import xml.etree.ElementTree as ET

from google.oauth2 import service_account
from googleapiclient.discovery import build

KEY = "/Users/pt/.config/ga4/cryptic-teacher.json"
SITE = "sc-domain:ingglish.com"
WAKE = "/Users/pt/github/household/tools/wake.sh"
STATE = pathlib.Path("/Users/pt/.local/state/ingglish-recrawl-watch.json")
RHYME_SITEMAP = "https://ingglish.com/sitemap-rhymes.xml"
SITEMAP_NS = "{http://www.sitemaps.org/schemas/sitemap/0.9}"

# Commit 8a2c228a, to the second. A crawl at or before this saw the old titles,
# and rounding down to midnight counts two same-day crawls that did not.
TITLES = dt.datetime(2026, 9, 2, 0, 20, 28, tzinfo=dt.timezone.utc)
RHYMES_SHIPPED = "2026-09-09"

# Both pages rank only on junk queries nobody clicks and are deliberately left
# indexed, so their crawl dates say nothing about whether the rewrite worked.
JUNK = {"https://ingglish.com/word/ki/", "https://ingglish.com/word/patriarchs/"}

WORD_SAMPLE = 12
RHYME_SAMPLE = 8
# A quorum, not a single page: one page's crawl date is noise, and Googlebot
# works through a 48,804-URL site in waves.
WORD_QUORUM = 6
RHYME_QUORUM = 3


def service():
    creds = service_account.Credentials.from_service_account_file(
        KEY, scopes=["https://www.googleapis.com/auth/webmasters.readonly"])
    return build("searchconsole", "v1", credentials=creds, cache_discovery=False)


def clicked_word_pages(svc):
    """The /word/ pages that actually earn clicks, so CTR is readable at all.

    Rows come back sorted by clicks descending, which is what this wants: a
    page with no clicks cannot answer a CTR question however fresh its crawl.
    """
    end = dt.date.today() - dt.timedelta(days=3)
    rows = svc.searchanalytics().query(siteUrl=SITE, body={
        "startDate": (end - dt.timedelta(days=27)).isoformat(),
        "endDate": end.isoformat(),
        "dimensions": ["page"],
        "rowLimit": 200,
    }).execute().get("rows", [])
    pages = [r["keys"][0] for r in rows
             if "/word/" in r["keys"][0] and r["keys"][0] not in JUNK]
    return pages[:WORD_SAMPLE]


def rhyme_pages():
    """A deterministic spread across the sitemap, not the first N.

    The generator emits groups in a stable order, so the first N pages are all
    from one corner of the corpus and would report on one crawl wave.
    """
    req = urllib.request.Request(RHYME_SITEMAP,
                                 headers={"User-Agent": "ingglish-recrawl-watch"})
    with urllib.request.urlopen(req, timeout=60) as f:
        locs = [e.text for e in ET.fromstring(f.read()).iter(SITEMAP_NS + "loc")]
    locs = [u for u in locs if not u.rstrip("/").endswith("/rhymes")]
    if not locs:
        raise SystemExit(f"{RHYME_SITEMAP} parsed to zero <loc> entries")
    stride = max(1, len(locs) // RHYME_SAMPLE)
    return locs[::stride][:RHYME_SAMPLE]


def last_crawls(svc, urls):
    """{url: datetime} for every url Google admits to having fetched."""
    out = {}
    for url in urls:
        r = svc.urlInspection().index().inspect(body={
            "inspectionUrl": url, "siteUrl": SITE}).execute()
        when = r["inspectionResult"]["indexStatusResult"].get("lastCrawlTime")
        if when:
            out[url] = dt.datetime.fromisoformat(when.replace("Z", "+00:00"))
    return out


def short(url):
    return url.replace("https://ingglish.com", "")


def wake(room, text):
    """True if the bridge took it. Never raises: a tick that found news and
    then lost it to a transport error is worse than one that reports both."""
    return subprocess.run([WAKE, "-c", room, text], check=False).returncode == 0


def main() -> int:
    # The id in preference to the name, both handed over by plugin-run at run
    # time, so nothing here spells a Discord id. The Mac's household checkout
    # lags the container's and its wake.sh predates name resolution, so a name
    # reaches the API verbatim and comes back HTTP 400 not-a-snowflake.
    room = os.environ.get("HOUSEHOLD_ROOM_ID") or os.environ.get("HOUSEHOLD_ROOM")
    if not room:
        raise SystemExit("neither HOUSEHOLD_ROOM_ID nor HOUSEHOLD_ROOM is set — "
                         "this must run as a household plugin so the room is "
                         "resolved at run time")

    state = json.loads(STATE.read_text()) if STATE.exists() else {}
    if state.get("titles_fired") and state.get("rhymes_fired"):
        return 0

    svc = service()
    report = {"checked": dt.date.today().isoformat()}
    undelivered = []

    if not state.get("titles_fired"):
        pages = clicked_word_pages(svc)
        crawls = last_crawls(svc, pages)
        fresh = {u: t for u, t in crawls.items() if t > TITLES}
        report["word_sampled"] = len(pages)
        report["word_fresh"] = sorted(short(u) for u in fresh)
        if len(fresh) >= WORD_QUORUM:
            listing = ", ".join(f"{short(u)} ({t.date().isoformat()})"
                                for u, t in sorted(fresh.items()))
            text = (
                f"Googlebot has recrawled {len(fresh)} of {len(pages)} sampled "
                f"clicked /word/ pages since the 2026-09-02 title rewrite: "
                f"{listing}. The new titles and descriptions are in the index, "
                f"so the CTR question is answerable for the first time. Pull GSC "
                f"per gsc-api-access.md and compare the post-recrawl window "
                f"against the baseline in ingglish-recrawl-watch.md. Read it off "
                f"pages.csv, not queries.csv — query rows are capped by clicks "
                f"and over-sample winners — and exclude the junk queries named in "
                f"that memory or the number reads ~10% low. Say plainly whether "
                f"CTR moved, stayed flat, or fell. This arm has disarmed itself.")
            if wake(room, text):
                state["titles_fired"] = dt.date.today().isoformat()
            else:
                undelivered.append("titles")

    if not state.get("rhymes_fired"):
        pages = rhyme_pages()
        crawls = last_crawls(svc, pages)
        report["rhyme_sampled"] = len(pages)
        report["rhyme_crawled"] = sorted(short(u) for u in crawls)
        if len(crawls) >= RHYME_QUORUM:
            listing = ", ".join(f"{short(u)} ({t.date().isoformat()})"
                                for u, t in sorted(crawls.items()))
            text = (
                f"Googlebot has crawled {len(crawls)} of {len(pages)} sampled "
                f"/rhymes/ pages: {listing}. The family shipped {RHYMES_SHIPPED} "
                f"with zero crawl history, so this is the first evidence it is "
                f"being indexed. Check how many of the 6,361 are in the index and "
                f"what they earn. Judge them against the rhyme and IPA intent "
                f"CTRs recorded in ingglish-recrawl-watch.md (1.3% and 1.9%), not "
                f"the sitewide 0.12% — that average is dominated by spelling "
                f"queries Google answers in its own widget. This arm has "
                f"disarmed itself.")
            if wake(room, text):
                state["rhymes_fired"] = dt.date.today().isoformat()
            else:
                undelivered.append("rhymes")

    STATE.parent.mkdir(parents=True, exist_ok=True)
    STATE.write_text(json.dumps({**state, **report}, indent=1))
    if undelivered:
        raise SystemExit(f"found news for {', '.join(undelivered)} and wake.sh "
                         f"refused it (room={room!r}); findings are in {STATE}, "
                         f"so those arms stay armed and will report next tick")
    return 0


if __name__ == "__main__":
    sys.exit(main())
