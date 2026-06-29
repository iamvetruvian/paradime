import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import '../styles/search.css';

const TMDB_KEY = 'f29892040fcd94a66373b8170211ae55';
const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

function SkeletonCard() {
  return <div className="card skeleton-card" />;
}

function ResultCard({ item }) {
  const navigate = useNavigate();
  return (
    <div
      className="card"
      style={{ cursor: 'pointer' }}
      onClick={() => navigate(`/${item.media_type}/${item.id}`)}
    >
      <img
        className="card-img"
        src={`${IMG_BASE}${item.poster_path}`}
        alt={item.title || item.name}
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 12 }}
        onError={(e) => { e.target.src = '/assets/bg.jpg'; }}
      />
    </div>
  );
}

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const query = searchParams.get('query') || '';

  const [movies, setMovies] = useState(null);
  const [tvShows, setTvShows] = useState(null);
  const [loading, setLoading] = useState(true);
  const [noResults, setNoResults] = useState(false);

  useEffect(() => {
    if (!query) { navigate('/'); return; }
    setLoading(true);
    setNoResults(false);
    fetch(`https://api.themoviedb.org/3/search/multi?api_key=${TMDB_KEY}&query=${encodeURIComponent(query)}`)
      .then(r => r.json())
      .then(data => {
        const results = data.results || [];
        if (!results.length) { setNoResults(true); setLoading(false); return; }
        setMovies(results.filter(i => i.media_type === 'movie' && i.poster_path));
        setTvShows(results.filter(i => i.media_type === 'tv' && i.poster_path));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  return (
    <div style={{ background: 'black', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div className="search-container" style={{ flex: 1 }}>
        {noResults && (
          <h1 style={{ color: 'white' }}>Could not find anything like that</h1>
        )}
        {(loading || (movies && movies.length > 0)) && (
          <div className="movie-container">
            <div className="platter-head">Movies</div>
            <div className="movie-results">
              {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : movies.map(m => <ResultCard key={m.id} item={m} />)}
            </div>
          </div>
        )}
        {(loading || (tvShows && tvShows.length > 0)) && (
          <div className="tv-container">
            <div className="platter-head">TV Shows</div>
            <div className="tv-results">
              {loading ? Array(6).fill(0).map((_, i) => <SkeletonCard key={i} />) : tvShows.map(t => <ResultCard key={t.id} item={t} />)}
            </div>
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
