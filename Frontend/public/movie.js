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

/* -------------------- 1. Extract TMDb ID -------------------- */
const params = new URLSearchParams(window.location.search);
const movieId = params.get("id");

if (!movieId) {
  console.error("No movie ID found in URL");
  window.location.href = "/";
}

/* -------------------- 2. Fetch Movie Details -------------------- */
async function fetchMovieDetails() {
  if (window.movieDataPromise) {
    return await window.movieDataPromise;
  }
  const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}`, {
    headers: {
      Authorization: `Bearer ${bearerToken}`,
      "Content-Type": "application/json",
    },
  });
  data = res.json();
  console.log(data);
  return data;
}

/* -------------------- 9. Fetch Credits -------------------- */
async function fetchMovieCredits() {
  const res = await fetch(
    `https://api.themoviedb.org/3/movie/${movieId}/credits`,
    {
      headers: {
        Authorization: `Bearer ${bearerToken}`,
        "Content-Type": "application/json",
      },
    },
  );

  return res.json();
}

/* -------------------- Render Movie Details -------------------- */
function renderMovieDetails(movie) {
  /* Title */
  document.querySelector(".title").textContent = movie.original_title;

  /* Backdrop */
  const backdropEl = document.querySelector(".backdrop-image");
  backdropEl.style.transition = "opacity 0.2s, filter 0.2s";
  backdropEl.style.filter = "blur(10px)";
  if (movie.backdrop_path) backdropEl.src = "https://image.tmdb.org/t/p/w300" + movie.backdrop_path;
  
  if (movie.backdrop_path) {
    const hdImg = new Image();
    hdImg.src = "https://image.tmdb.org/t/p/original" + movie.backdrop_path;
    hdImg.onload = () => {
      backdropEl.src = hdImg.src;
      backdropEl.style.filter = "none";
    };
  }

  /* Poster */
  const posterEl = document.querySelector(".poster-image");
  posterEl.style.transition = "opacity 0.2s, filter 0.2s";
  posterEl.style.filter = "blur(10px)";
  if (movie.poster_path) posterEl.src = "https://image.tmdb.org/t/p/w300" + movie.poster_path;

  if (movie.poster_path) {
    const hdPoster = new Image();
    hdPoster.src = "https://image.tmdb.org/t/p/original" + movie.poster_path;
    hdPoster.onload = () => {
        posterEl.src = hdPoster.src;
        posterEl.style.filter = "none";
    };
  }

  /* Overview */
  document.querySelector(".over-view p").textContent = movie.overview;

  /* Genres */
  const genreContainer = document.querySelector(".genre-tags");
  genreContainer.innerHTML = "";

  movie.genres.forEach((genre) => {
    const tag = document.createElement("div");
    tag.className = "tag";
    tag.textContent = genre.name;
    genreContainer.appendChild(tag);
  });

  /* Origin Country Flags */
  const originContainer = document.querySelector(".lang-origin");
  originContainer.innerHTML = "";

  movie.origin_country.forEach((code) => {
    const img = document.createElement("img");
    img.src = `https://cdn.jsdelivr.net/npm/country-flag-icons@1.5.5/3x2/${code}.svg`;
    img.height = 20;
    originContainer.appendChild(img);
  });

  /* Additional Stats */
  if (movie.release_date) {
    document.querySelector(".release-date").innerHTML =
      `<i class="fa-regular fa-calendar"></i> ${movie.release_date}`;
  }
  if (movie.runtime) {
    document.querySelector(".runtime").innerHTML =
      `<i class="fa-regular fa-clock"></i> ${movie.runtime} min`;
  }
  if (movie.vote_average) {
    document.querySelector(".rating").innerHTML =
      `<i class="fa-solid fa-star" style="color: gold;"></i> ${movie.vote_average.toFixed(1)}/10`;
  }

  /* Tagline */
  if (movie.tagline) {
    document.querySelector(".tagline").textContent = `"${movie.tagline}"`;
  }

  /* Production Companies */
  const productionContainer = document.querySelector(".production-container");
  if (productionContainer) {
    productionContainer.innerHTML = "";
    if (movie.production_companies) {
      movie.production_companies.forEach((company) => {
        if (!company.logo_path) return;
        const img = document.createElement("img");
        img.src = "https://image.tmdb.org/t/p/w300" + company.logo_path;
        img.alt = company.name;
        img.style.height = "40px";
        img.style.objectFit = "contain";
        img.style.backgroundColor = "rgba(255, 255, 255, 0.8)";
        img.style.padding = "5px";
        img.style.borderRadius = "5px";
        img.title = company.name;
        img.loading = "lazy";
        img.decoding = "async";
        productionContainer.appendChild(img);
      });
    }
  }
}

/* -------------------- Render Cast -------------------- */
function renderCast(credits) {
  const container = document.querySelector(".cast-card-container");
  container.innerHTML = "";

  credits.cast.forEach((actor) => {
    if (!actor.profile_path) return;
    // console.log(IMAGE_BASE_URL + actor.profile_path);

    const card = document.createElement("div");
    card.className = "cast-card";

    card.innerHTML = `
            <img src="${IMAGE_BASE_URL + actor.profile_path}" loading="lazy" decoding="async">
            <div class="names">
                <div class="cast-name">${actor.name}</div>
                <div class="character-name">${actor.character}</div>
            </div>
        `;

    card.addEventListener("click", () => {
      window.open(
        `https://www.google.com/search?q=${encodeURIComponent(actor.name)}`,
        "_blank",
      );
    });

    container.appendChild(card);
  });

  container.style.border = "1px solid rgba(255, 255, 255, 0.2)";
  container.style.padding = "15px";
  container.style.borderRadius = "15px";
}

/* -------------------- Inject Trailer Banner -------------------- */
async function injectTrailerBanner() {
  try {
    const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos`, {
      headers: { Authorization: `Bearer ${bearerToken}` },
    });
    const data = await res.json();
    const trailer = data.results.find((v) => v.type === "Trailer" && v.site === "YouTube");
    if (trailer) {
      const banner = document.querySelector(".top-banner-section");
      
      // Ensure banner acts as a proper clipping mask
      if (getComputedStyle(banner).position === "static") {
        banner.style.position = "relative";
      }
      banner.style.overflow = "hidden";

      // Ensure text and buttons stay visible on top of iframe without overriding their absolute positioning
      const titleEl = banner.querySelector(".title");
      const actionBtns = banner.querySelector(".action-buttons-container");
      if (titleEl) { titleEl.style.zIndex = "10"; }
      if (actionBtns) { actionBtns.style.zIndex = "10"; }

      const iframe = document.createElement("iframe");
      iframe.src = `https://www.youtube.com/embed/${trailer.key}?autoplay=1&mute=1&controls=0&disablekb=1&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&loop=1&playlist=${trailer.key}`;
      iframe.style.position = "absolute";
      // Center strategy scaling up
      iframe.style.top = "50%";
      iframe.style.left = "50%";
      iframe.style.transform = "translate(-50%, -50%)";
      iframe.style.width = "100vw";
      iframe.style.height = "56.25vw"; // 16:9 intrinsic ratio
      iframe.style.minHeight = "100%";
      iframe.style.minWidth = "177.77vh";
      iframe.style.zIndex = "1"; // sits right above backdrop (which is usually bg or z-0)
      iframe.style.pointerEvents = "none";
      iframe.style.opacity = "0";
      iframe.style.transition = "opacity 1.5s ease-in-out";
      iframe.allow = "autoplay; encrypted-media";
      iframe.frameBorder = "0";

      // Fade in once player has had enough time to start playback
      iframe.onload = () => {
        setTimeout(() => {
          iframe.style.opacity = "1";
        }, 1500);
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
        muteBtn.style.bottom = "80px"; // above play btn
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

/* -------------------- Init -------------------- */
(async function init() {
  try {
    const movie = await fetchMovieDetails();
    renderMovieDetails(movie);
    
    // Inject trailer banner as a non-blocking background procedure
    injectTrailerBanner();

    const credits = await fetchMovieCredits();
    renderCast(credits);

    const watchNow = document.querySelector(".watch-now-btn");
    const color = "#fc5b6e";
    watchNow.addEventListener("click", (event) => {
      window.location.href = `/play?type=movie&id=${movieId}`;
      // window.location.href = `https://www.cineby.gd/movie/${movie.id}`;
    });
  } catch (err) {
    console.error("Failed to load movie data", err);
  }
})();
