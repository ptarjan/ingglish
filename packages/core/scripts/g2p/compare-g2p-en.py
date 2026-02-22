#!/usr/bin/env python3
"""
Fair G2P comparison: ingglish rules vs g2p-en neural seq2seq.

Uses Wiktionary pronunciations (wiki-pronunciation-dict) as independent
ground truth. Tests only words absent from BOTH systems' CMU dictionaries,
so neither can cheat with a dictionary lookup.

Setup:
  pip install g2p-en
  python -c "import ssl; ssl._create_default_https_context = ssl._create_unverified_context; import nltk; nltk.download('cmudict'); nltk.download('averaged_perceptron_tagger'); nltk.download('averaged_perceptron_tagger_eng')"

Usage:
  # From repo root — generates ingglish predictions, then compares
  npx tsx --conditions=source packages/core/scripts/g2p/compare-g2p-en.py

  # Actually this is a Python script, run it directly:
  python3 packages/core/scripts/g2p/compare-g2p-en.py

Results (Feb 2025, 34K words):
  Your G2P (rules):  10.99%  exact match
  g2p-en (neural):   11.19%  exact match
  → Effectively identical. Neural offers no advantage.
"""
import json
import os
import subprocess
import sys
import tempfile
import urllib.request
import ssl

# --- Config ---
WIKI_DICT_URL = "https://github.com/DanielSWolf/wiki-pronunciation-dict/raw/main/dictionaries/en.json"
REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../.."))

# --- IPA to ARPAbet mapping (matches ingglish's @ingglish/ipa from-ipa.ts) ---
IPA_MAP = {
    # Two-char (must check first)
    'aʊ': 'AW', 'aɪ': 'AY', 'eɪ': 'EY', 'oʊ': 'OW', 'ɔɪ': 'OY',
    'dʒ': 'JH', 'tʃ': 'CH', 'ts': 'T S',
    # Vowels
    'ɑ': 'AA', 'æ': 'AE', 'ʌ': 'AH', 'ɔ': 'AO',
    'ɛ': 'EH', 'ɝ': 'ER', 'ɚ': 'ER', 'ɪ': 'IH', 'i': 'IY',
    'ʊ': 'UH', 'u': 'UW', 'ə': 'AH',
    'a': 'AA', 'e': 'EH', 'o': 'AO',
    # Consonants
    'b': 'B', 'd': 'D', 'f': 'F', 'ɡ': 'G', 'g': 'G',
    'h': 'HH', 'k': 'K', 'l': 'L', 'm': 'M',
    'n': 'N', 'ŋ': 'NG', 'p': 'P', 'ɹ': 'R', 'r': 'R',
    's': 'S', 'ʃ': 'SH', 't': 'T', 'θ': 'TH', 'ð': 'DH',
    'v': 'V', 'w': 'W', 'j': 'Y', 'z': 'Z', 'ʒ': 'ZH',
}


def ipa_to_arpabet(ipa_phones: str) -> list[str]:
    """Convert space-separated IPA phones to stressless ARPAbet."""
    result = []
    for ph in ipa_phones.split():
        if len(ph) >= 2 and ph[:2] in IPA_MAP:
            result.extend(IPA_MAP[ph[:2]].split())
            rest = ph[2:]
            if rest and rest in IPA_MAP:
                result.extend(IPA_MAP[rest].split())
        elif ph in IPA_MAP:
            result.append(IPA_MAP[ph])
    return result


def strip_stress(p: str) -> str:
    return p.rstrip('0123456789')


def download_wiki_dict(path: str):
    """Download Wiktionary pronunciation dict if not cached."""
    if os.path.exists(path):
        return
    print("Downloading Wiktionary pronunciation dict...", file=sys.stderr)
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE
    req = urllib.request.Request(WIKI_DICT_URL, headers={"User-Agent": "IngglishG2PBench/1.0"})
    resp = urllib.request.urlopen(req, timeout=30, context=ctx)
    with open(path, 'wb') as f:
        f.write(resp.read())
    print(f"  Saved to {path}", file=sys.stderr)


def export_our_cmu_words(path: str):
    """Export our CMU dictionary word list via tsx."""
    if os.path.exists(path):
        return
    print("Exporting ingglish CMU dictionary words...", file=sys.stderr)
    script = """
async function main() {
  const { loadDictionary } = await import('@ingglish/dictionary');
  const dict = await loadDictionary();
  process.stdout.write(Object.keys(dict).join('\\n'));
}
main();
"""
    result = subprocess.run(
        ["npx", "tsx", "--conditions=source", "-e", script],
        capture_output=True, text=True, cwd=REPO_ROOT,
    )
    if result.returncode != 0:
        print(f"Error exporting CMU words: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    with open(path, 'w') as f:
        f.write(result.stdout)


def run_ingglish_g2p(words: list[str], expected: list[str]) -> tuple[int, int]:
    """Run ingglish G2P on a list of words, return (match, total)."""
    print("Running ingglish G2P...", file=sys.stderr)
    # Write words + expected to temp file, run tsx to score
    tmp = tempfile.NamedTemporaryFile(mode='w', suffix='.tsv', delete=False)
    for w, e in zip(words, expected):
        tmp.write(f"{w}\t{e}\n")
    tmp.close()

    script = f"""
async function main() {{
  const {{ wordToArpabet }} = await import('@ingglish/g2p');
  const {{ stripStress }} = await import('@ingglish/phonemes');
  const fs = await import('fs');
  const lines = fs.readFileSync('{tmp.name}', 'utf8').trim().split('\\n');
  let total = 0, match = 0;
  for (const line of lines) {{
    const [word, exp] = line.split('\\t');
    const predicted = wordToArpabet(word).map(stripStress).join(' ');
    total++;
    if (predicted === exp) match++;
  }}
  console.log(match + '/' + total);
}}
main();
"""
    result = subprocess.run(
        ["npx", "tsx", "--conditions=source", "-e", script],
        capture_output=True, text=True, cwd=REPO_ROOT,
    )
    os.unlink(tmp.name)
    if result.returncode != 0:
        print(f"Error running ingglish G2P: {result.stderr}", file=sys.stderr)
        sys.exit(1)
    match_str, total_str = result.stdout.strip().split('/')
    return int(match_str), int(total_str)


def main():
    cache_dir = os.path.join(REPO_ROOT, "node_modules", ".cache", "g2p-bench")
    os.makedirs(cache_dir, exist_ok=True)

    wiki_path = os.path.join(cache_dir, "wiki-pron-en.json")
    cmu_path = os.path.join(cache_dir, "our-cmu-words.txt")

    download_wiki_dict(wiki_path)
    export_our_cmu_words(cmu_path)

    # Load data
    wiki = json.load(open(wiki_path))
    our_cmu = set(open(cmu_path).read().strip().split('\n'))

    # Load g2p-en
    print("Loading g2p-en...", file=sys.stderr)
    from g2p_en import G2p
    g2p = G2p()
    g2p_cmu = set(g2p.cmu.keys())

    # Find words in Wiktionary but NOT in either CMU dict
    holdout = []
    for word, prons in wiki.items():
        if not word.isalpha() or len(word) < 3:
            continue
        lower = word.lower()
        if lower in our_cmu or lower in g2p_cmu:
            continue
        arpabet = ipa_to_arpabet(prons[0])
        if len(arpabet) < 2:
            continue
        holdout.append((lower, ' '.join(arpabet)))

    print(f"\nTest set: {len(holdout)} Wiktionary words not in either CMU dict\n",
          file=sys.stderr)

    # Run g2p-en
    print("Running g2p-en neural model...", file=sys.stderr)
    g2p_match = 0
    for i, (word, expected) in enumerate(holdout):
        predicted = g2p(word)
        predicted = [p for p in predicted if p.strip() and any(c.isalpha() for c in p)]
        predicted_str = ' '.join(strip_stress(p) for p in predicted)
        if predicted_str == expected:
            g2p_match += 1
        if (i + 1) % 2000 == 0:
            print(f"  ...{i+1}/{len(holdout)}", file=sys.stderr)

    # Run ingglish G2P
    words = [w for w, _ in holdout]
    expected = [e for _, e in holdout]
    ours_match, total = run_ingglish_g2p(words, expected)

    # Results
    print(f"\n{'='*60}")
    print(f"Fair G2P comparison on {len(holdout)} unseen Wiktionary words")
    print(f"(words absent from both CMU dictionaries)")
    print(f"{'='*60}")
    print(f"  ingglish (rules):  {ours_match:>5}/{total} = {(ours_match/total)*100:.2f}%")
    print(f"  g2p-en (neural):   {g2p_match:>5}/{total} = {(g2p_match/total)*100:.2f}%")
    print(f"{'='*60}")


if __name__ == "__main__":
    main()
