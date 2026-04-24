const bearerToken =
  "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw";

const IMAGE_BASE_URL = "https://image.tmdb.org/t/p/original/";

const searchBar = document.querySelector(".searchbar");
searchBar.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    const value = searchBar.value;
    if (value.length === 0) {
      return;
    } else {
      window.location = `/search?query=${value}`;
    }
  }
});

/* -------------------- URL PARAM -------------------- */
const params = new URLSearchParams(window.location.search);
const tvId = params.get("id");

if (!tvId) {
  window.location.href = "/";
}

/* -------------------- DOM -------------------- */
const titleEl = document.getElementById("tv-title");
const backdropEl = document.getElementById("tv-backdrop");
const seasonSelect = document.getElementById("season-select");
const episodeList = document.getElementById("episode-list");
const castContainer = document.getElementById("cast-container");

/* -------------------- FETCH TV DETAILS -------------------- */
async function fetchTvDetails() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  const data = await res.json();

  titleEl.textContent = data.original_name;
  backdropEl.src = IMAGE_BASE_URL + data.backdrop_path;

  seasonSelect.innerHTML = "";
  data.seasons.forEach((season) => {
    if (season.season_number === 0) return;

    const option = document.createElement("option");
    option.value = season.season_number;
    option.textContent = `Season ${season.season_number}`;
    seasonSelect.appendChild(option);
  });

  fetchEpisodes(data.seasons.find((s) => s.season_number !== 0).season_number);
  fetchCast();
}

/* -------------------- FETCH EPISODES -------------------- */
async function fetchEpisodes(seasonNumber) {
  episodeList.innerHTML = "";

  const res = await fetch(
    `https://api.themoviedb.org/3/tv/${tvId}/season/${seasonNumber}`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
      },
    }
  );

  const data = await res.json();

  data.episodes.forEach((ep) => {
    const card = document.createElement("div");
    card.className = "episode-card";

    card.innerHTML = `
      <div class="episode-image">
        <img
          class="episode-thumbnail"
          src="${ep.still_path ? IMAGE_BASE_URL + ep.still_path : ""}"
        />
      </div>
      <div class="episode-details">
        <div class="episode-title">${ep.name}</div>
        <div class="episode-synopsis">${ep.overview || "No overview available"}</div>
      </div>
    `;
    card.addEventListener("click", () => {
      window.location.href = `/play?type=tv&id=${tvId}&s=${seasonNumber}&e=${ep.episode_number}`;
    });
    episodeList.appendChild(card);
  });
}

/* -------------------- FETCH CAST -------------------- */
async function fetchCast() {
  const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/credits`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
    },
  });

  const data = await res.json();
  castContainer.innerHTML = "";

  data.cast.slice(0, 12).forEach((actor) => {
    const card = document.createElement("div");
    card.className = "cast-card glass";

    card.innerHTML = `
      <img src="${
        actor.profile_path ? IMAGE_BASE_URL + actor.profile_path : ""
      }" />
      <div class="names">
      <div class="cast-name">${actor.name}</div>
      <div class="cast-character">${actor.character}</div>
      </div>
    `;

    card.addEventListener("click", () => {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(actor.name)}`,
        "_blank"
      );
    });

    castContainer.appendChild(card);
  });

  castContainer.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  castContainer.style.padding = "15px";
  castContainer.style.borderRadius = "15px";
}

/* -------------------- Inject Trailer Banner -------------------- */
async function injectTrailerBanner() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/tv/${tvId}/videos`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const data = await res.json();
    const trailer = data.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) {
      const banner = document.querySelector(".top-banner-section");
      
      if (getComputedStyle(banner).position === "static") {
        banner.style.position = "relative";
      }
      banner.style.overflow = "hidden";

      // Ensure text and buttons stay visible on top of iframe without overriding absolute positioning
      const titleEl = banner.querySelector(".title");
      const actionBtns = banner.querySelector(".action-buttons-container");
      if (titleEl) { titleEl.style.zIndex = "10"; }
      if (actionBtns) { actionBtns.style.zIndex = "10"; }

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1&playlist=${trailer.key}`;
      iframe.style.position = "absolute";
      iframe.style.top = "50%";
      iframe.style.left = "50%";
      iframe.style.transform = "translate(-50%, -50%)";
      iframe.style.width = "100vw";
      iframe.style.height = "56.25vw"; // 16:9 intrinsic ratio
      iframe.style.minHeight = "100%";
      iframe.style.minWidth = "177.77vh";
      iframe.style.zIndex = "1"; 
      iframe.style.pointerEvents = "none";
      iframe.style.opacity = "0";
      iframe.style.transition = "opacity 1.5s ease-in-out";
      iframe.allow = "autoplay; encrypted-media";
      iframe.frameBorder = "0";

      iframe.onload = () => {
        setTimeout(() => { iframe.style.opacity = "1"; }, 1500);
      };

      // Create Mute/Unmute floating button directly adhering to existing action-buttons
      const muteBtn = document.createElement("button");
      muteBtn.className = "btn btn-outline icon-btn";
      muteBtn.title = "Unmute Trailer";
      muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';

      let isMuted = true;
      muteBtn.onclick = () => {
        if (isMuted) {
          iframe.contentWindow.postMessage('{"event":"command","func":"unMute","args":""}', '*');
          iframe.contentWindow.postMessage('{"event":"command","func":"setVolume","args":[100]}', '*');
          muteBtn.innerHTML = '<i class="fa-solid fa-volume-high"></i>';
        } else {
          iframe.contentWindow.postMessage('{"event":"command","func":"mute","args":""}', '*');
          muteBtn.innerHTML = '<i class="fa-solid fa-volume-xmark"></i>';
        }
        isMuted = !isMuted;
      };

      if (actionBtns) {
        actionBtns.appendChild(muteBtn);
      } else {
        muteBtn.style.position = "absolute";
        muteBtn.style.bottom = "80px";
        muteBtn.style.right = "20px";
        muteBtn.style.zIndex = "10";
        banner.appendChild(muteBtn);
      }
      banner.appendChild(iframe);
    }
  } catch (err) {
    console.error("Failed to inject trailer", err);
  }
}

/* -------------------- EVENTS -------------------- */
seasonSelect.addEventListener("change", (e) => {
  fetchEpisodes(e.target.value);
});

/* -------------------- INIT -------------------- */
fetchTvDetails().then(injectTrailerBanner);