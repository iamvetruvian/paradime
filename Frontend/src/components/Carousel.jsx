import React, { useRef } from 'react';

export default function Carousel({ title, items, showOverlay = false }) {
  const scrollRef = useRef(null);
  const controlsRef = useRef(null);

  const scroll = (dir) => {
    scrollRef.current?.scrollBy({ left: dir * 300, behavior: 'smooth' });
  };

  return (
    <section className="platter">
      <div className="platter-head">{title}</div>
      <div
        className="crousel"
        ref={scrollRef}
        onMouseEnter={() => controlsRef.current && (controlsRef.current.style.opacity = '1')}
        onMouseLeave={() => controlsRef.current && (controlsRef.current.style.opacity = '0')}
      >
        <div className="scroll-controls" ref={controlsRef}>
          <button className="scroll-left" onClick={() => scroll(-1)}>
            <i className="fa-solid fa-angle-left" />
          </button>
          <button className="scroll-right" onClick={() => scroll(1)}>
            <i className="fa-solid fa-angle-right" />
          </button>
        </div>
        {items.map((item, i) => (
          <CardInner key={i} item={item} showOverlay={showOverlay} />
        ))}
      </div>
    </section>
  );
}

function CardInner({ item, showOverlay }) {
  const IMG_BASE = 'https://image.tmdb.org/t/p/w342';

  const handleClick = () => {
    if (item.playUrl) {
      window.location.href = item.playUrl;
    } else {
      const type = item.type || item.mediaType;
      const id = item.id || item.tmdbId;
      window.location.href = `/${type}/${id}`;
    }
  };

  const src = item.imgUrl
    || (item.poster_path ? `${IMG_BASE}${item.poster_path}` : '/assets/bg.jpg');

  return (
    <div className="card" onClick={handleClick} style={{ cursor: 'pointer', position: 'relative' }}>
      <img
        className="card-img"
        src={src}
        alt=""
        loading="lazy"
        decoding="async"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px' }}
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
