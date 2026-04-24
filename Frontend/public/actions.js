document.addEventListener('DOMContentLoaded', () => {
  window.initializeActionButtons = async function () {
    const bookmarkBtn = document.getElementById('bookmark-btn');
    const watchlistBtn = document.getElementById('watchlist-btn');
    const modal = document.getElementById('watchlist-modal');
    const closeBtn = document.getElementById('close-modal-btn');
    const doneBtn = document.getElementById('done-watchlist-btn');
    const createWatchlistBtn = document.querySelector('.create-watchlist-btn');
    const searchInput = document.getElementById('watchlist-search');
    const watchlistsContainer = document.getElementById('watchlists-container');

    const urlParams = new URLSearchParams(window.location.search);
    let tmdbId = urlParams.get('id');
    let mediaType = urlParams.get('type') || 'movie';
    if (window.location.pathname.includes('tv.html') || window.location.pathname.startsWith('/tv/')) {
        mediaType = 'tv';
    }
    if (!tmdbId) {
        const pathParts = window.location.pathname.split('/').filter(Boolean);
        if (pathParts.length >= 2) {
            mediaType = pathParts[0];
            tmdbId = pathParts[1];
        }
    }
    if (!tmdbId) {
        console.error('Could not find tmdbId');
        return;
    }

    let currentUser = null;
    try {
        const userRes = await fetch('/api/current_user');
        currentUser = await userRes.json();
    } catch (e) {}

    // 1. Toggle Bookmark
    if (bookmarkBtn) {
      const newBookmarkBtn = bookmarkBtn.cloneNode(true);
      bookmarkBtn.parentNode.replaceChild(newBookmarkBtn, bookmarkBtn);
      
      if (currentUser) {
        try {
            const res = await fetch('/api/bookmarks');
            const bookmarks = await res.json();
            if (bookmarks.some(b => b.tmdbId == tmdbId && b.mediaType == mediaType)) {
                newBookmarkBtn.querySelector('i').classList.replace('fa-regular', 'fa-solid');
                newBookmarkBtn.classList.add('active');
            }
        } catch (e) {}
      }

      newBookmarkBtn.addEventListener('click', async () => {
        if (!currentUser) return window.location.href = '/auth/google';
        const icon = newBookmarkBtn.querySelector('i');
        const isBookmarked = icon.classList.contains('fa-solid');
        
        // OPTIMISTIC UI UPDATE
        if (isBookmarked) {
            icon.classList.replace('fa-solid', 'fa-regular');
            newBookmarkBtn.classList.remove('active');
        } else {
            icon.classList.replace('fa-regular', 'fa-solid');
            newBookmarkBtn.classList.add('active');
        }
        
        // BACKGROUND SYNC
        try {
            if (isBookmarked) {
                await fetch('/api/bookmarks', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId, mediaType }) });
            } else {
                await fetch('/api/bookmarks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ tmdbId, mediaType }) });
            }
        } catch (e) {
            // REVERT ON FAILURE
            if (isBookmarked) {
                icon.classList.replace('fa-regular', 'fa-solid');
                newBookmarkBtn.classList.add('active');
            } else {
                icon.classList.replace('fa-solid', 'fa-regular');
                newBookmarkBtn.classList.remove('active');
            }
        }
      });
    }

    const loadWatchlists = async () => {
        if (!watchlistsContainer || !currentUser) return;
        try {
            const res = await fetch('/api/watchlists?t=' + Date.now(), { cache: 'no-store' });
            const watchlists = await res.json();
            watchlistsContainer.innerHTML = '';
            watchlists.forEach(list => {
                const isAdded = list.items.some(i => i.tmdbId == tmdbId && i.mediaType == mediaType);
                const label = document.createElement('label');
                label.className = 'watchlist-item';
                label.innerHTML = `<input type='checkbox' value='${list._id}' data-name='${list.name}' ${isAdded ? 'checked' : ''}> ${list.name}`;
                watchlistsContainer.appendChild(label);
            });
        } catch (e) {}
    };

    if (watchlistBtn && modal) {
      const newWatchlistBtn = watchlistBtn.cloneNode(true);
      watchlistBtn.parentNode.replaceChild(newWatchlistBtn, watchlistBtn);

      newWatchlistBtn.addEventListener('click', () => {
        if (!currentUser) return window.location.href = '/auth/google';
        loadWatchlists();
        modal.classList.add('show');
      });
    }

    if (createWatchlistBtn) {
        const newCreateBtn = createWatchlistBtn.cloneNode(true);
        createWatchlistBtn.parentNode.replaceChild(newCreateBtn, createWatchlistBtn);
        newCreateBtn.addEventListener('click', async () => {
            const name = prompt('Enter new watchlist name:');
            if (name && name.trim()) {
                await fetch('/api/watchlists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                await loadWatchlists();
            }
        });
    }

    if (closeBtn && modal) closeBtn.addEventListener('click', () => modal.classList.remove('show'));
    if (modal) modal.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('show'); });

    if (doneBtn && modal && watchlistsContainer) {
      const newDoneBtn = doneBtn.cloneNode(true);
      doneBtn.parentNode.replaceChild(newDoneBtn, doneBtn);

      newDoneBtn.addEventListener('click', async () => {
        const checkboxes = watchlistsContainer.querySelectorAll("input[type='checkbox']:checked");
        const listIds = Array.from(checkboxes).map(cb => cb.value);
        const listNames = Array.from(checkboxes).map(cb => cb.getAttribute('data-name'));

        modal.classList.remove('show');

        if (listIds.length > 0) {
            await fetch('/api/watchlists/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ listIds, tmdbId, mediaType }) });
            
            const titleElement = document.querySelector('.title') || document.querySelector('#tv-title');
            const mediaTitle = titleElement && titleElement.textContent.trim() !== '' ? titleElement.textContent : 'This title';
            showToast(mediaTitle, listNames);
        }
      });
    }

    if (searchInput && watchlistsContainer) {
      searchInput.addEventListener('input', (e) => {
        const term = e.target.value.toLowerCase();
        const items = watchlistsContainer.querySelectorAll('.watchlist-item');
        items.forEach(item => {
          const labelText = item.textContent.toLowerCase();
          item.style.display = labelText.includes(term) ? 'flex' : 'none';
        });
      });
    }
  };

  function showToast(title, lists) {
    let toast = document.getElementById('toast-notification');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast-notification';
      toast.className = 'toast-notification';
      document.body.appendChild(toast);
    }
    const listText = lists.length <= 4 ? lists.join(', ') : lists.slice(0, 4).join(', ') + ' ...';
    toast.innerHTML = `<strong>${title}</strong> added to ${listText}`;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 3500);
  }
});
window.addEventListener('load', () => window.initializeActionButtons && window.initializeActionButtons());