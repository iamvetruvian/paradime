import React, { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

export default function MediaPage() {
  const [searchParams] = useSearchParams();
  const iframeRef = useRef(null);

  const type = searchParams.get('type');
  const id = searchParams.get('id');
  const season = searchParams.get('s');
  const episode = searchParams.get('e');
  const url = searchParams.get('url');

  let iframeSrc = '';
  if (type === 'movie' && id) {
    iframeSrc = `https://www.vidking.net/embed/movie/${id}?color=#fc5b6e&nextEpisode=true&episodeSelector=true`;
  } else if (type === 'tv' && id && season && episode) {
    iframeSrc = `https://www.vidking.net/embed/tv/${id}/${season}/${episode}?nextEpisode=true&episodeSelector=true`;
  } else if (url) {
    iframeSrc = decodeURIComponent(url);
  }

  useEffect(() => {
    const handler = (event) => {
      try {
        const parsed = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (parsed?.type === 'PLAYER_EVENT') {
          const { event: playerEvent, id: tmdbId, mediaType, season, episode, progress, currentTime, duration } = parsed.data;
          if (['timeupdate', 'pause', 'ended'].includes(playerEvent)) {
            fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ tmdbId, mediaType, season, episode, progress, currentTime, duration }),
            }).catch(console.error);
          }
        }
      } catch (e) {}
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, []);

  const styles = {
    body: { margin: 0, padding: 0, width: '100%', height: '100vh', background: 'black', overflow: 'hidden', display: 'flex', flexDirection: 'column' },
    topBar: { position: 'absolute', top: 0, left: 0, width: '100%', padding: 20, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8), transparent)', zIndex: 10, display: 'flex', pointerEvents: 'none' },
    backBtn: { color: 'white', fontSize: '1.5rem', textDecoration: 'none', cursor: 'pointer', pointerEvents: 'auto', transition: 'color 0.2s' },
  };

  if (!iframeSrc) {
    return (
      <div style={styles.body}>
        <div style={styles.topBar}>
          <a href="javascript:history.back()" style={styles.backBtn}>
            <i className="fa-solid fa-arrow-left" /> Back
          </a>
        </div>
        <h2 style={{ color: 'white', textAlign: 'center', marginTop: '20%', fontFamily: 'sans-serif' }}>
          Invalid Media Parameters. Return to the previous page.
        </h2>
      </div>
    );
  }

  return (
    <div style={styles.body}>
      <div style={styles.topBar}>
        <a href="javascript:history.back()" style={styles.backBtn}>
          <i className="fa-solid fa-arrow-left" /> Back
        </a>
      </div>
      <iframe
        ref={iframeRef}
        src={iframeSrc}
        style={{ width: '100%', height: '100%', border: 'none' }}
        allowFullScreen
        allow="autoplay; fullscreen"
        title="Media Player"
      />
    </div>
  );
}
