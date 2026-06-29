import React, { useState, useEffect } from 'react';

export default function WatchlistModal({ isOpen, onClose, tmdbId, mediaType, mediaTitle }) {
  const [watchlists, setWatchlists] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (isOpen) loadWatchlists();
  }, [isOpen]);

  const loadWatchlists = async () => {
    try {
      const res = await fetch('/api/watchlists?t=' + Date.now(), { cache: 'no-store' });
      const data = await res.json();
      setWatchlists(data);
    } catch (e) {}
  };

  const createWatchlist = async () => {
    const name = prompt('Enter new watchlist name:');
    if (name?.trim()) {
      await fetch('/api/watchlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      await loadWatchlists();
    }
  };

  const handleDone = async () => {
    const checked = watchlists.filter(l => l._checked);
    const listIds = checked.map(l => l._id);
    const listNames = checked.map(l => l.name);
    onClose();
    if (listIds.length > 0) {
      await fetch('/api/watchlists/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listIds, tmdbId, mediaType }),
      });
      showToast(mediaTitle, listNames);
    }
  };

  const showToast = (title, lists) => {
    const listText = lists.length <= 4 ? lists.join(', ') : lists.slice(0, 4).join(', ') + ' ...';
    setToast(`${title} added to ${listText}`);
    setTimeout(() => setToast(null), 3500);
  };

  const toggle = (id) => {
    setWatchlists(wls => wls.map(w => w._id === id ? { ...w, _checked: !w._checked } : w));
  };

  const filtered = watchlists.filter(w => w.name.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <>
      {isOpen && (
        <div
          className="modal-overlay show"
          onClick={(e) => e.target.classList.contains('modal-overlay') && onClose()}
        >
          <div className="modal-content glass">
            <div className="modal-header">
              <h3>Add to Watchlist</h3>
              <button className="close-modal-btn" onClick={onClose}>
                <i className="fa-solid fa-xmark" />
              </button>
            </div>
            <div className="modal-body">
              <input
                type="text"
                className="search-input"
                placeholder="Search watchlists..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', marginBottom: 15, padding: 8, borderRadius: 5, border: '1px solid #555', background: '#222', color: 'white' }}
              />
              <div className="watchlists-container">
                {filtered.map(list => {
                  const isAdded = list.items?.some(i => i.tmdbId == tmdbId && i.mediaType == mediaType);
                  return (
                    <label key={list._id} className="watchlist-item">
                      <input
                        type="checkbox"
                        defaultChecked={isAdded}
                        onChange={() => toggle(list._id)}
                      />
                      {' '}{list.name}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-outline create-watchlist-btn" onClick={createWatchlist}>
                <i className="fa-solid fa-plus" /> New Watchlist
              </button>
              <button className="btn btn-primary done-watchlist-btn" onClick={handleDone}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}
      {toast && (
        <div className="toast-notification show" dangerouslySetInnerHTML={{ __html: toast }} />
      )}
    </>
  );
}
