const movieContainer = document.querySelector(".movie-container");
const movieResults = document.querySelector(".movie-results");
const tvContainer = document.querySelector(".tv-container");
const tvResults = document.querySelector(".tv-results");
const searchContainer = document.querySelector(".search-container")
const searchBar = document.querySelector(".searchbar");

searchBar.addEventListener("keydown", (event)=>{
  if(event.key==="Enter"){
    event.preventDefault();
    const value = searchBar.value
    if(value.length===0){
      return
    }else{
        window.location = `/search?query=${value}`
      }
  }
})

const tmdbApiKey = "f29892040fcd94a66373b8170211ae55";
const tmdbToken = "eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw";
const baseImgUrl = "https://image.tmdb.org/t/p/original"
//Endpoint format: https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=All%20The%20Bright%20Places
// Cast endpoint: https://api.themoviedb.org/3/movie/105214/credits?api_key=f29892040fcd94a66373b8170211ae55

const params = new URLSearchParams(window.location.search);
const query = params.get("query");

searchBar.value = query;

const getData = async(query, apikey)=>{
  const endpoint = `https://api.themoviedb.org/3/search/multi?api_key=${apikey}&query=${encodeURIComponent(query)}`;
  const response = await fetch(endpoint);
  const data = await response.json()
  const entertainmentArray = data.results
  movieContainer.style.display = 'block';
  tvContainer.style.display = 'block';
  movieResults.textContent = "";
  tvResults.textContent =""
  if(entertainmentArray.length === 0){
    tvContainer.style.display = 'none'
    movieContainer.style.display = 'none'
    const errorMsg = document.createElement("h1")
    errorMsg.textContent = "Could not find anything like that"
    errorMsg.style.color = "white"
    searchContainer.prepend(errorMsg)
    return
  }
  const movieArray = entertainmentArray.filter((element)=>{
    return element.media_type === "movie" && element.poster_path!==null
  })
  const tvArray = entertainmentArray.filter((element)=>{
    return element.media_type === "tv" && element.poster_path !==null
  })
  if(movieArray.length === 0){
    movieContainer.style.display = "none"
  }
  if(tvArray.length === 0){
    tvContainer.style.display = "none"
  }
  
  console.log(tvArray)
  createSkeletonCards(movieArray.length || 6, movieResults);
  createSkeletonCards(tvArray.length || 6, tvResults);
  await renderCards(movieArray, movieResults)
  await renderCards(tvArray, tvResults)
}

// const createCards = (movie) => {
//   const card = document.createElement("div")
//   card.classList.add("card")
//   card.type = movie.media_type
//   card.name = movie.name || movie.original_name
//   const coverImg = document.createElement("img")
//   const coverImgSrc = `${baseImgUrl}${movie.poster_path}`
//   console.log(coverImgSrc)
//   coverImg.setAttribute("src", coverImgSrc)
//   coverImg.classList.add("card-img")
//   return card
// }


const renderCards = async (array, container) => {
  const promises = array.map(createCards);
  const cards = await Promise.all(promises);
  container.textContent =""
  cards.forEach((card) => container.appendChild(card));
};

const createSkeletonCards = (count, container) => {
  container.textContent = "";
  for (let i = 0; i < count; i++) {
    const skeleton = document.createElement("div");
    skeleton.classList.add("card", "skeleton-card");
    container.appendChild(skeleton);
  }
};

const createCards = (movie) => {
  return new Promise((resolve, reject) => {
    const card = document.createElement("div");
    card.classList.add("card");
    card.type = movie.media_type;
    card.name = movie.name || movie.original_name;
    card.addEventListener("click", ()=>{
      handleCardClick(movie.media_type, movie.id)
    })

    const coverImg = new Image();
    coverImg.src = `${baseImgUrl}${movie.poster_path}`;
    coverImg.classList.add("card-img");
    coverImg.decoding = "async";
    coverImg.loading = "eager";

    coverImg.onload = () => {
      card.appendChild(coverImg);
      resolve(card);
    };

    coverImg.onerror = reject;
  });
};

const handleCardClick = (type, tmdb) => {
  window.location = `/page?type=${type}&id=${tmdb}`
}

getData(query, tmdbApiKey)