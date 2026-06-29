import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';
import '../styles/history.css';

const TMDB_KEY = 'f29892040fcd94a66373b8170211ae55';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

function bucket(lastWatchedAt) {
  const now = new Date();
  const today = new Date(now); today.setHours(0,0,0,0);
  const t = today.getTime();
  const day = 86400000;
  const watchTime = new Date(lastWatchedAt).getTime();
  if (watchTime >= t) return 'Today';
  if (watchTime >= t - day) return 'Yesterday';
  if (watchTime >= t - day * 7) return 'This Week';
  if (watchTime >= t - day * 30) return 'This Month';
  return 'Older';
}

export default function HistoryPage() {
  const user = useAuth();
  const navigate = useNavigate();
  const [sections, setSections] = useState(null);
  const [status, setStatus] = useState('loading');

  useEffect(() => {
    if (user === undefined) return;
    if (!user || !user.id) { setStatus('unauth'); return; }

    fetch('/api/history')
      .then(r => r.json())
      .then(async (history) => {
        if (!history?.length) { setStatus('empty'); return; }
        history.sort((a, b) => new Date(b.lastWatchedAt) - new Date(a.lastWatchedAt));

        const buckets = { Today: [], Yesterday: [], 'This Week': [], 'This Month': [], Older: [] };
        for (const item of history) buckets[bucket(item.lastWatchedAt)].push(item);

        const resolved = {};
        for (const [name, items] of Object.entries(buckets)) {
          if (!items.length) continue;
          resolved[name] = [];
          for (const item of items) {
            try {
              let imgUrl = '', titleText = '', playUrl = '';
              if (item.mediaType === 'tv') {
                const [epData, showData] = await Promise.all([
                  fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}/season/${item.season}/episode/${item.episode}?api_key=${TMDB_KEY}`).then(r => r.json()),
                  fetch(`https://api.themoviedb.org/3/tv/${item.tmdbId}?api_key=${TMDB_KEY}`).then(r => r.json()),
                ]);
                imgUrl = epData.still_path ? `${IMG_BASE}${epData.still_path}` : (showData.backdrop_path ? `https://image.tmdb.org/t/p/w780${showData.backdrop_path}` : `${IMG_BASE}${showData.poster_path}`);
                titleText = `${showData.name || 'Unknown'}: S${item.season}-E${item.episode}`;
                playUrl = `/play?type=tv&id=${item.tmdbId}&s=${item.season}&e=${item.episode}`;
              } else {
                const movieData = await fetch(`https://api.themoviedb.org/3/movie/${item.tmdbId}?api_key=${TMDB_KEY}`).then(r => r.json());
                imgUrl = movieData.backdrop_path ? `https://image.tmdb.org/t/p/w780${movieData.backdrop_path}` : `${IMG_BASE}${movieData.poster_path}`;
                titleText = movieData.title || 'Unknown Movie';
                playUrl = `/play?type=movie&id=${item.tmdbId}`;
              }
              const progress = (item.currentTime && item.duration) ? Math.min((item.currentTime / item.duration) * 100, 100) : 100;
              resolved[name].push({ imgUrl, titleText, playUrl, progress });
            } catch (e) {}
          }
        }
        setSections(resolved);
        setStatus('done');
      })
      .catch(() => setStatus('error'));
  }, [user]);

  return (
    <div style={{ background: 'black', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="container-fluid py-4 history-page-container" style={{ flex: 1 }}>
        {status === 'loading' && (
          <div className="text-center w-100 text-white mt-5">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="mt-2">Loading your viewing history...</p>
          </div>
        )}
        {status === 'unauth' && <p className="mt-2 text-danger text-center">Please log in to view your watch history.</p>}
        {status === 'empty' && <p className="mt-2 text-muted text-center">Your watch history is empty.</p>}
        {status === 'error' && <p className="mt-2 text-danger text-center">Error loading history.</p>}
        {status === 'done' && sections && Object.entries(sections).map(([name, items]) =>
          items.length > 0 && (
            <div key={name} className="history-section">
              <h2 className="history-section-title">{name}</h2>
              <div className="history-grid">
                {items.map((item, i) => (
                  <div key={i} className="card history-card-item" onClick={() => window.location.href = item.playUrl} style={{ cursor: 'pointer', position: 'relative' }}>
                    <img
                      className="card-img"
                      src={item.imgUrl || '/assets/bg.jpg'}
                      alt={item.titleText}
                      loading="lazy"
                      decoding="async"
                    />
                    <div className="card-overlay">
                      <div className="card-overlay-text">{item.titleText}</div>
                      {item.progress > 0 && (
                        <div className="card-progress-container">
                          <div className="card-progress-bar" style={{ width: `${item.progress}%` }} />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )
        )}
      </div>
      <Footer />
    </div>
  );
}
