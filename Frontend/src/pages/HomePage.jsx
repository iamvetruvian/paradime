import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Carousel from '../components/Carousel';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';

const KEY = 'f29892040fcd94a66373b8170211ae55';
const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

// Re-use whatever was pre-fired in index.html, or start fresh if missing
// (e.g. during dev without the inline script)
const trendingP    = window.__tmdb_trending   || fetch(`${BASE}/trending/all/day?api_key=${KEY}`).then(r => r.json());
const topMoviesP   = window.__tmdb_top_movies  || fetch(`${BASE}/movie/top_rated?api_key=${KEY}`).then(r => r.json());
const topTvP       = window.__tmdb_top_tv      || fetch(`${BASE}/tv/top_rated?api_key=${KEY}`).then(r => r.json());
const classicsP    = window.__tmdb_classics    || fetch(`${BASE}/discover/movie?api_key=${KEY}&sort_by=vote_average.desc&vote_count.gte=5000&primary_release_date.lte=1995-01-01`).then(r => r.json());

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuth();

  const [heroItems, setHeroItems] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroBg, setHeroBg] = useState('');
  const [heroBgBlurred, setHeroBgBlurred] = useState(false);
  const [platters, setPlatters] = useState({ topMovies: [], topTv: [], trending: [], classics: [] });
  const [continueWatching, setContinueWatching] = useState([]);
  const intervalRef = useRef(null);

  // Resolve hero data — the promise is already in-flight, so this fires
  // almost immediately when the component mounts.
  useEffect(() => {
    trendingP.then(data => {
      const items = data.results?.slice(0, 5) || [];
      setHeroItems(items);
      if (items[0]?.backdrop_path) {
        // Show low-res first, upgrade to high-res progressively
        const low = `https://image.tmdb.org/t/p/w300${items[0].backdrop_path}`;
        const high = `https://image.tmdb.org/t/p/w1280${items[0].backdrop_path}`;
        setHeroBg(low);
        const img = new Image();
        img.src = high;
        img.onload = () => setHeroBg(high);
      }
    }).catch(console.error);
  }, []);

  // Resolve all carousel platters simultaneously
  useEffect(() => {
    Promise.all([topMoviesP, topTvP, trendingP, classicsP]).then(([tm, tt, tr, cl]) => {
      setPlatters({
        topMovies: tm.results?.map(i => ({ ...i, type: 'movie' })) || [],
        topTv:     tt.results?.map(i => ({ ...i, type: 'tv' })) || [],
        trending:  tr.results?.map(i => ({ ...i, type: i.media_type || 'movie' })) || [],
        classics:  cl.results?.map(i => ({ ...i, type: 'movie' })) || [],
      });
    }).catch(console.error);
  }, []);

  // Continue Watching (needs auth — runs only after user is known)
  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/history').then(r => r.json()).then(async history => {
      if (!history?.length) return;
      const uncompleted = history.filter(i => i.currentTime != null && i.duration != null && i.currentTime < i.duration);
      if (!uncompleted.length) return;

      const items = [];
      for (const item of uncompleted.slice(0, 10)) {
        try {
          let imgUrl = '', overlayTitle = '', playUrl = '';
          if (item.mediaType === 'tv') {
            const [ep, show] = await Promise.all([
              fetch(`${BASE}/tv/${item.tmdbId}/season/${item.season}/episode/${item.episode}?api_key=${KEY}`).then(r => r.json()),
              fetch(`${BASE}/tv/${item.tmdbId}?api_key=${KEY}`).then(r => r.json()),
            ]);
            imgUrl = ep.still_path ? `${IMG_BASE}${ep.still_path}` : (show.backdrop_path ? `https://image.tmdb.org/t/p/w780${show.backdrop_path}` : `${IMG_BASE}${show.poster_path}`);
            overlayTitle = `${show.name || 'Unknown'}: S${item.season}-E${item.episode}`;
            playUrl = `/play?type=tv&id=${item.tmdbId}&s=${item.season}&e=${item.episode}`;
          } else {
            const movie = await fetch(`${BASE}/movie/${item.tmdbId}?api_key=${KEY}`).then(r => r.json());
            imgUrl = movie.backdrop_path ? `https://image.tmdb.org/t/p/w780${movie.backdrop_path}` : `${IMG_BASE}${movie.poster_path}`;
            overlayTitle = movie.title || 'Unknown Movie';
            playUrl = `/play?type=movie&id=${item.tmdbId}`;
          }
          items.push({ id: item.tmdbId, type: item.mediaType, imgUrl, overlayTitle, playUrl, progress: Math.min((item.currentTime / item.duration) * 100, 100) });
        } catch (e) {}
      }
      setContinueWatching(items);
    }).catch(console.error);
  }, [user]);

  // Auto-advance hero slider
  useEffect(() => {
    if (!heroItems.length) return;
    intervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [heroItems]);

  // Update hero bg with progressive loading on slide change
  useEffect(() => {
    if (!heroItems.length || heroIndex === 0) return; // index 0 handled on first load above
    const item = heroItems[heroIndex];
    if (!item?.backdrop_path) return;

    setHeroBgBlurred(true);
    setTimeout(() => {
      const low = `https://image.tmdb.org/t/p/w300${item.backdrop_path}`;
      const high = `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`;
      setHeroBg(low);
      setHeroBgBlurred(false);
      const img = new Image();
      img.src = high;
      img.onload = () => setHeroBg(high);
    }, 200);
  }, [heroIndex]);

  const goToSlide = (idx) => {
    setHeroIndex(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 5000);
  };

  const currentHero = heroItems[heroIndex];
  const mediaType = currentHero?.media_type || (currentHero?.title ? 'movie' : 'tv');

  return (
    <div style={{ background: 'black', minHeight: '100vh' }}>
      <section className="hero">
        {heroBg && (
          <img
            className="hero-bg"
            src={heroBg}
            alt=""
            fetchPriority="high"
            style={{
              filter: heroBgBlurred ? 'blur(10px) brightness(60%)' : 'brightness(60%)',
              transition: 'filter 0.3s ease',
            }}
          />
        )}
        <Navbar />
        <div className="poster-info">
          <h1 className="poster-title">
            {currentHero ? (currentHero.title || currentHero.name) : 'Loading...'}
          </h1>
          <p className="poster-description">
            {(() => {
              const ov = currentHero?.overview || '';
              return ov.length > 250 ? ov.substring(0, 250) + '...' : ov;
            })()}
          </p>
          <div className="poster-buttons">
            <button
              className="btn btn-primary watch-now-btn"
              onClick={() => {
                if (!currentHero) return;
                if (mediaType === 'tv') navigate(`/play?type=tv&id=${currentHero.id}&s=1&e=1`);
                else navigate(`/play?type=movie&id=${currentHero.id}`);
              }}
            >
              <i className="fa-solid fa-play" /> Watch Now
            </button>
            <button
              className="btn btn-secondary more-info-btn"
              onClick={() => currentHero && navigate(`/${mediaType}/${currentHero.id}`)}
            >
              More Info
            </button>
          </div>
        </div>
        <div className="hero-slider-dots">
          {heroItems.map((_, i) => (
            <div key={i} className={`dot${i === heroIndex ? ' active' : ''}`} onClick={() => goToSlide(i)} />
          ))}
        </div>
      </section>

      {continueWatching.length > 0 && (
        <Carousel title="Continue Watching" items={continueWatching} showOverlay />
      )}
      <Carousel title="Top Movies"   items={platters.topMovies} />
      <Carousel title="Top TV Shows" items={platters.topTv} />
      <Carousel title="Trending Now" items={platters.trending} />
      <Carousel title="Classics"     items={platters.classics} />

      <hr style={{ color: 'white' }} />
      <Footer />
    </div>
  );
}
