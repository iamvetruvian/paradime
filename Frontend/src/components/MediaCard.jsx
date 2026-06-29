import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

function MediaCard({ item, showOverlay = false }) {
  const navigate = useNavigate();
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  const handleClick = () => {
    if (item.playUrl) {
      window.location.href = item.playUrl;
    } else if (item.type === 'movie' || item.mediaType === 'movie') {
      navigate(`/movie/${item.id || item.tmdbId}`);
    } else {
      navigate(`/tv/${item.id || item.tmdbId}`);
    }
  };

  const src = item.imgUrl || (item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/assets/bg.jpg');

  return (
    <div className="card" onClick={handleClick} style={{ cursor: 'pointer', position: 'relative' }}>
      <img
        className="card-img"
        src={src}
        alt={item.title || item.name || ''}
        loading="lazy"
        decoding="async"
        onError={(e) => { e.target.src = '/assets/bg.jpg'; }}
      />
      {showOverlay && (
        <div className="card-overlay">
          <div className="card-overlay-text">{item.overlayTitle}</div>
          {item.progress != null && (
            <div className="card-progress-container">
              <div className="card-progress-bar" style={{ width: `${item.progress}%` }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default MediaCard;
