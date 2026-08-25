"use client";

import { useCallback, useEffect, useState } from "react";

type Verse = {
  text: string;
  surahName: string;
  surahNumber: number;
  ayahNumber: number;
  source: string;
  translator: string;
};

const fallbackVerse: Verse = {
  text: "Nëse falënderoni, Unë do t’jua shtoj të mirat.",
  surahName: "Ibrahim",
  surahNumber: 14,
  ayahNumber: 7,
  source: "Fallback lokal",
  translator: "Përkthim shqip",
};

export function QuranVerseCard() {
  const [verse, setVerse] = useState<Verse>(fallbackVerse);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  const loadVerse = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/v1/quran/random", {
        cache: "no-store",
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const payload = await response.json();
      if (!payload?.data?.text) throw new Error("Invalid response");
      setVerse(payload.data);
    } catch {
      setError("Ajeti online nuk u ngarkua. Po shfaqet ajeti rezervë.");
      setVerse(fallbackVerse);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadVerse();
  }, [loadVerse]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  const isLong = verse.text.length > 135;

  return (
    <>
      <aside
        className={`quranGratitudeCard quranGratitudeCardCompact ${isLong ? "quranWide" : ""}`}
        aria-label="Ajet Kuranor"
      >
        <div className="quranCardTopline">
          <small>AJET KURANOR</small>
          <button type="button" onClick={() => void loadVerse()} disabled={loading}>
            {loading ? "Duke ngarkuar…" : "Ajeti tjetër"}
          </button>
        </div>

        <button
          type="button"
          className={`quranVersePreview ${loading ? "quranVerseLoading" : ""}`}
          onClick={() => setOpen(true)}
          aria-label="Hap ajetin e plotë"
        >
          “{verse.text}”
        </button>

        <span>{verse.surahName}, {verse.surahNumber}:{verse.ayahNumber}</span>
        <div className="quranSourceLine">
          <span>{verse.translator}</span>
          <a href="https://alquran.cloud" target="_blank" rel="noreferrer">Burimi</a>
        </div>
        {error ? <em role="status">{error}</em> : null}
      </aside>

      {open ? (
        <div className="quranModalBackdrop" role="presentation" onMouseDown={() => setOpen(false)}>
          <section
            className="quranModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="quran-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="quranModalHeader">
              <div>
                <small>AJET KURANOR</small>
                <h2 id="quran-modal-title">{verse.surahName}, {verse.surahNumber}:{verse.ayahNumber}</h2>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label="Mbyll">×</button>
            </div>
            <blockquote>“{verse.text}”</blockquote>
            <footer>
              <span>{verse.translator}</span>
              <a href="https://alquran.cloud" target="_blank" rel="noreferrer">Burimi</a>
            </footer>
          </section>
        </div>
      ) : null}
    </>
  );
}
