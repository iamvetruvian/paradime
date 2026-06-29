import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import WatchlistModal from '../components/WatchlistModal';
import useAuth from '../hooks/useAuth';
import '../styles/movie.css';
import '../styles/actions.css';

const BEARER = 'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw';
const IMG = 'https://image.tmdb.org/t/p/original/';

function tmdbFetch(url) {
  return fetch(url, { headers: { Authorization: `Bearer ${BEARER}` } }).then(r => r.json());
}

export default function MoviePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const user = useAuth();

  const [movie, setMovie] = useState(null);
  const [credits, setCredits] = useState(null);
  const [backdropSrc, setBackdropSrc] = useState('');
  const [posterSrc, setPosterSrc] = useState('');
  const [trailerKey, setTrailerKey] = useState(null);
  const [isMuted, setIsMuted] = useState(true);
  const [bookmarked, setBookmarked] = useState(false);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const iframeRef = useRef(null);

  useEffect(() => {
    if (!id) { navigate('/'); return; }
    Promise.all([
      tmdbFetch(`https://api.themoviedb.org/3/movie/${id}`),
      tmdbFetch(`https://api.themoviedb.org/3/movie/${id}/credits`),
      tmdbFetch(`https://api.themoviedb.org/3/movie/${id}/videos`),
    ]).then(([m, c, v]) => {
      setMovie(m);
      setCredits(c);
      if (m.backdrop_path) {
        setBackdropSrc(`https://image.tmdb.org/t/p/w300${m.backdrop_path}`);
        const hd = new Image();
        hd.src = `https://image.tmdb.org/t/p/original${m.backdrop_path}`;
        hd.onload = () => setBackdropSrc(hd.src);
      }
      if (m.poster_path) {
        setPosterSrc(`https://image.tmdb.org/t/p/w300${m.poster_path}`);
        const hdp = new Image();
        hdp.src = `https://image.tmdb.org/t/p/original${m.poster_path}`;
        hdp.onload = () => setPosterSrc(hdp.src);
      }
      const trailer = v.results?.find(v => v.type === 'Trailer' && v.site === 'YouTube');
      if (trailer) setTrailerKey(trailer.key);
    }).catch(console.error);
  }, [id]);

  useEffect(() => {
    if (!user?.id) return;
    fetch('/api/bookmarks')
      .then(r => r.json())
      .then(bm => setBookmarked(bm.some(b => b.tmdbId == id && b.mediaType === 'movie')))
      .catch(() => {});
  }, [user, id]);

  const toggleBookmark = async () => {
    if (!user) { window.location.href = '/auth/google'; return; }
    const next = !bookmarked;
    setBookmarked(next);
    try {
      await fetch('/api/bookmarks', {
        method: next ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tmdbId: id, mediaType: 'movie' }),
      });
    } catch (e) { setBookmarked(!next); }
  };

  const toggleMute = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    if (isMuted) {
      iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
      iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
    } else {
      iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
    }
    setIsMuted(m => !m);
  };

  if (!movie) return <div style={{ background: 'black', minHeight: '100vh', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Loading...</div>;

  return (
    <div style={{ background: 'black', display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <div className="movie-info-container">
        <div className="top-banner-section" style={{ overflow: 'hidden' }}>
          <div className="title" style={{ zIndex: 10 }}>{movie.original_title}</div>
          <img className="backdrop-image" src={backdropSrc} alt="" fetchpriority="high" />
          <div className="action-buttons-container" style={{ position: 'absolute', bottom: 20, right: 20, display: 'flex', gap: 10, zIndex: 10 }}>
            <button className={`btn btn-outline icon-btn${bookmarked ? ' active' : ''}`} title="Bookmark" onClick={toggleBookmark}>
              <i className={`fa-${bookmarked ? 'solid' : 'regular'} fa-bookmark`} />
            </button>
            <button className="btn btn-outline icon-btn" title="Add to Watchlist" onClick={() => { if (!user) { window.location.href = '/auth/google'; return; } setWatchlistOpen(true); }}>
              <i className="fa-solid fa-plus" />
            </button>
            {trailerKey && (
              <button className="btn btn-outline icon-btn" title="Mute/Unmute Trailer" onClick={toggleMute}>
                <i className={`fa-solid fa-volume-${isMuted ? 'xmark' : 'high'}`} />
              </button>
            )}
          </div>
          {trailerKey && (
            <iframe
              ref={iframeRef}
              src={`https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1&playlist=${trailerKey}`}
              style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', width: '100vw', height: '56.25vw', minHeight: '100%', minWidth: '177.77vh', zIndex: 1, pointerEvents: 'none', border: 'none' }}
              allow="autoplay; encrypted-media"
              title="Trailer"
              onLoad={(e) => setTimeout(() => { e.target.style.opacity = '1'; }, 1500)}
            />
          )}
        </div>

        <div className="bottom-part">
          <div className="aside-poster-section">
            <div className="large-poster-container loading" id="poster">
              <img className="poster-image fade-in" src={posterSrc} alt="" fetchpriority="high" />
            </div>
            <button className="btn btn-primary watch-now-btn" onClick={() => navigate(`/play?type=movie&id=${id}`)}>
              <i className="fa-solid fa-play" /> Watch Now
            </button>
          </div>

          <div className="movie-information-container">
            <div className="lang-origin">
              {movie.origin_country?.map(code => (
                <img key={code} src={`https://cdn.jsdelivr.net/npm/country-flag-icons@1.5.5/3x2/${code}.svg`} height={20} alt={code} />
              ))}
            </div>
            <div className="genre-tags">
              {movie.genres?.map(g => <div key={g.id} className="tag">{g.name}</div>)}
            </div>
            <div className="movie-stats" style={{ color: '#ccc', display: 'flex', gap: 15, margin: '10px 5px', fontSize: '1.1em' }}>
              {movie.release_date && <span><i className="fa-regular fa-calendar" /> {movie.release_date}</span>}
              {movie.runtime && <span><i className="fa-regular fa-clock" /> {movie.runtime} min</span>}
              {movie.vote_average && <span><i className="fa-solid fa-star" style={{ color: 'gold' }} /> {movie.vote_average.toFixed(1)}/10</span>}
            </div>
            {movie.tagline && <div className="tagline" style={{ color: '#aaa', fontStyle: 'italic', margin: 5, fontSize: '1.2em' }}>"{movie.tagline}"</div>}

            <div className="over-view">
              <div className="section-title"><div className="bar-style" />Synopsis</div>
              <p>{movie.overview}</p>
            </div>

            <div className="Actors">
              <div className="section-title"><div className="bar-style" />Cast</div>
              <div className="cast-card-container" style={{ border: '1px solid rgba(255,255,255,0.2)', padding: 15, borderRadius: 15 }}>
                {credits?.cast?.filter(a => a.profile_path).map(actor => (
                  <div
                    key={actor.id}
                    className="cast-card"
                    onClick={() => window.open(`https://www.google.com/search?q=${encodeURIComponent(actor.name)}`, '_blank')}
                  >
                    <img src={IMG + actor.profile_path} loading="lazy" decoding="async" alt={actor.name} />
                    <div className="names">
                      <div className="cast-name">{actor.name}</div>
                      <div className="character-name">{actor.character}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
        <Footer />
      </div>

      <WatchlistModal
        isOpen={watchlistOpen}
        onClose={() => setWatchlistOpen(false)}
        tmdbId={id}
        mediaType="movie"
        mediaTitle={movie.original_title}
      />
    </div>
  );
}
