crousels = document.querySelectorAll(".crousel");
tmdbApiKey = "f29892040fcd94a66373b8170211ae55";
platters = document.querySelectorAll(".platter");
allCards = document.querySelectorAll(".card");

// https://api.themoviedb.org/3/search/movie?api_key=f29892040fcd94a66373b8170211ae55&query=All%20The%20Bright%20Places

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
// tmbd api link:
// api key = f29892040fcd94a66373b8170211ae55
// api read access token = eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw
crousels.forEach((crousel) => {
  const leftButton = crousel.querySelector(".scroll-left");
  const rightButton = crousel.querySelector(".scroll-right");
  const scrollControls = crousel.querySelector(".scroll-controls");
  const cardContainer = crousel;

  cardContainer.addEventListener("mouseover", () => {
    scrollControls.style.opacity = "1";
  });

  cardContainer.addEventListener("mouseout", () => {
    scrollControls.style.opacity = "0";
  });

  leftButton.addEventListener("click", () => {
    cardContainer.scrollBy({
      left: -300,
      behavior: "smooth",
    });
  });

  rightButton.addEventListener("click", () => {
    cardContainer.scrollBy({
      left: 300,
      behavior: "smooth",
    });
  });
});

async function loadDynamicPlatters() {
  const baseUrl = "https://api.themoviedb.org/3";
  // w342 is smaller and loads much faster than w500 while still looking crisp on most screens
  const imgBaseUrl = "https://image.tmdb.org/t/p/w342";

  const fetchCards = async (url, defaultType) => {
    try {
      const res = await fetch(url);
      const data = await res.json();
      return data.results.map((item) => ({
        id: item.id,
        type: item.media_type || defaultType,
        poster_path: item.poster_path,
      }));
    } catch (e) {
      console.error(e);
      return [];
    }
  };

  const populateCarousel = (selector, items) => {
    const crousel = document.querySelector(selector);
    if (!crousel) return;

    const scrollControls = crousel.querySelector(".scroll-controls");
    crousel.innerHTML = "";
    if (scrollControls) {
      crousel.appendChild(scrollControls);
    }

    items.forEach((item, index) => {
      if (!item.poster_path) return;
      const card = document.createElement("div");
      card.className = "card";
      card.onclick = () => {
        window.location.href = `/page?type=${item.type}&id=${item.id}`;
      };

      const img = document.createElement("img");
      img.src = `${imgBaseUrl}${item.poster_path}`;
      img.alt = "";
      img.className = "card-img";
      img.loading = "lazy";
      img.decoding = "async";

      card.appendChild(img);
      crousel.appendChild(card);
    });
  };

  // Optimization: Fetch all platters simultaneously rather than sequentially
  const [topMovies, topTv, trending, classics] = await Promise.all([
    fetchCards(
      `${baseUrl}/movie/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`,
      "movie",
    ),
    fetchCards(
      `${baseUrl}/tv/top_rated?api_key=${tmdbApiKey}&language=en-US&page=1`,
      "tv",
    ),
    fetchCards(`${baseUrl}/trending/all/day?api_key=${tmdbApiKey}`, "movie"),
    fetchCards(
      `${baseUrl}/discover/movie?api_key=${tmdbApiKey}&sort_by=vote_average.desc&vote_count.gte=5000&primary_release_date.lte=1995-01-01`,
      "movie",
    ),
  ]);

  populateCarousel(".featured.platter .crousel", topMovies);
  populateCarousel(".categories.platter .crousel", topTv);
  populateCarousel(".trending.platter .crousel", trending);
  populateCarousel(".classics.platter .crousel", classics);
}

document.addEventListener("DOMContentLoaded", loadDynamicPlatters);
// Also load if already loaded
if (
  document.readyState === "complete" ||
  document.readyState === "interactive"
) {
  loadDynamicPlatters();
}
