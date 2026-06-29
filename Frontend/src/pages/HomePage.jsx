import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Carousel from '../components/Carousel';
import Footer from '../components/Footer';
import useAuth from '../hooks/useAuth';

const TMDB_KEY = 'f29892040fcd94a66373b8170211ae55';
const BASE = 'https://api.themoviedb.org/3';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

export default function HomePage() {
  const navigate = useNavigate();
  const user = useAuth();

  const [heroItems, setHeroItems] = useState([]);
  const [heroIndex, setHeroIndex] = useState(0);
  const [heroBg, setHeroBg] = useState('');
  const [heroBgBlur, setHeroBgBlur] = useState(false);
  const [platters, setPlatters] = useState({ topMovies: [], topTv: [], trending: [], classics: [] });
  const [continueWatching, setContinueWatching] = useState([]);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetch(`${BASE}/trending/all/day?api_key=${TMDB_KEY}`)
      .then(r => r.json())
      .then(data => {
        const items = data.results.slice(0, 5);
        setHeroItems(items);
        if (items[0]?.backdrop_path) {
          setHeroBg(`https://image.tmdb.org/t/p/w1280${items[0].backdrop_path}`);
        }
      })
      .catch(console.error);

    Promise.all([
      fetch(`${BASE}/movie/top_rated?api_key=${TMDB_KEY}`).then(r => r.json()),
      fetch(`${BASE}/tv/top_rated?api_key=${TMDB_KEY}`).then(r => r.json()),
      fetch(`${BASE}/trending/all/day?api_key=${TMDB_KEY}`).then(r => r.json()),
      fetch(`${BASE}/discover/movie?api_key=${TMDB_KEY}&sort_by=vote_average.desc&vote_count.gte=5000&primary_release_date.lte=1995-01-01`).then(r => r.json()),
    ]).then(([tm, tt, tr, cl]) => {
      setPlatters({
        topMovies: tm.results.map(i => ({ ...i, type: 'movie' })),
        topTv: tt.results.map(i => ({ ...i, type: 'tv' })),
        trending: tr.results.map(i => ({ ...i, type: i.media_type || 'movie' })),
        classics: cl.results.map(i => ({ ...i, type: 'movie' })),
      });
    }).catch(console.error);
  }, []);

  useEffect(() => {
    if (!user || !user.id) return;
    Promise.all([
      fetch('/api/history').then(r => r.json()),
    ]).then(async ([history]) => {
      if (!history?.length) return;
      const uncompleted = history.filter(i => i.currentTime != null && i.duration != null && i.currentTime < i.duration);
      if (!uncompleted.length) return;

      const items = [];
      for (const item of uncompleted.slice(0, 10)) {
        try {
          let imgUrl = '', overlayTitle = '', playUrl = '';
          if (item.mediaType === 'tv') {
            const [epData, showData] = await Promise.all([
              fetch(`${BASE}/tv/${item.tmdbId}/season/${item.season}/episode/${item.episode}?api_key=${TMDB_KEY}`).then(r => r.json()),
              fetch(`${BASE}/tv/${item.tmdbId}?api_key=${TMDB_KEY}`).then(r => r.json()),
            ]);
            imgUrl = epData.still_path ? `${IMG_BASE}${epData.still_path}` : (showData.backdrop_path ? `https://image.tmdb.org/t/p/w780${showData.backdrop_path}` : `${IMG_BASE}${showData.poster_path}`);
            overlayTitle = `${showData.name || 'Unknown'}: S${item.season}-E${item.episode}`;
            playUrl = `/play?type=tv&id=${item.tmdbId}&s=${item.season}&e=${item.episode}`;
          } else {
            const movieData = await fetch(`${BASE}/movie/${item.tmdbId}?api_key=${TMDB_KEY}`).then(r => r.json());
            imgUrl = movieData.backdrop_path ? `https://image.tmdb.org/t/p/w780${movieData.backdrop_path}` : `${IMG_BASE}${movieData.poster_path}`;
            overlayTitle = movieData.title || 'Unknown Movie';
            playUrl = `/play?type=movie&id=${item.tmdbId}`;
          }
          items.push({ id: item.tmdbId, type: item.mediaType, imgUrl, overlayTitle, playUrl, progress: Math.min((item.currentTime / item.duration) * 100, 100) });
        } catch (e) {}
      }
      setContinueWatching(items);
    }).catch(console.error);
  }, [user]);

  useEffect(() => {
    if (!heroItems.length) return;
    intervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 5000);
    return () => clearInterval(intervalRef.current);
  }, [heroItems]);

  useEffect(() => {
    if (!heroItems.length) return;
    const item = heroItems[heroIndex];
    if (!item?.backdrop_path) return;
    setHeroBgBlur(true);
    const low = `https://image.tmdb.org/t/p/w300${item.backdrop_path}`;
    const high = `https://image.tmdb.org/t/p/w1280${item.backdrop_path}`;
    setTimeout(() => {
      setHeroBg(low);
      setHeroBgBlur(false);
      const img = new Image();
      img.src = high;
      img.onload = () => setHeroBg(high);
    }, 200);
  }, [heroIndex, heroItems]);

  const currentHero = heroItems[heroIndex];
  const mediaType = currentHero?.media_type || (currentHero?.title ? 'movie' : 'tv');

  const goToHero = (idx) => {
    setHeroIndex(idx);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroItems.length);
    }, 5000);
  };

  return (
    <div style={{ background: 'black', minHeight: '100vh' }}>
      <section className="hero">
        <img
          className="hero-bg"
          src={heroBg}
          alt=""
          fetchpriority="high"
          style={{ filter: heroBgBlur ? 'blur(10px) brightness(60%)' : 'brightness(60%)', transition: 'opacity 0.3s, filter 0.3s' }}
        />
        <Navbar />
        <div className="poster-info">
          <h1 className="poster-title" id="hero-title">
            {currentHero?.title || currentHero?.name || 'Loading...'}
          </h1>
          <p className="poster-description">
            {currentHero?.overview?.length > 250
              ? currentHero.overview.substring(0, 250) + '...'
              : currentHero?.overview || ''}
          </p>
          <div className="poster-buttons">
            <button
              className="btn btn-primary watch-now-btn"
              onClick={() => {
                if (mediaType === 'tv') navigate(`/play?type=tv&id=${currentHero.id}&s=1&e=1`);
                else navigate(`/play?type=movie&id=${currentHero?.id}`);
              }}
            >
              <i className="fa-solid fa-play" /> Watch Now
            </button>
            <button
              className="btn btn-secondary more-info-btn"
              onClick={() => navigate(`/${mediaType}/${currentHero?.id}`)}
            >
              More Info
            </button>
          </div>
        </div>
        <div className="hero-slider-dots">
          {heroItems.map((_, i) => (
            <div
              key={i}
              className={`dot${i === heroIndex ? ' active' : ''}`}
              onClick={() => goToHero(i)}
            />
          ))}
        </div>
      </section>

      {continueWatching.length > 0 && (
        <Carousel title="Continue Watching" items={continueWatching} showOverlay />
      )}
      <Carousel title="Top Movies" items={platters.topMovies} />
      <Carousel title="Top TV Shows" items={platters.topTv} />
      <Carousel title="Trending Now" items={platters.trending} />
      <Carousel title="Classics" items={platters.classics} />

      <hr style={{ color: 'white' }} />
      <Footer />
    </div>
  );
}
