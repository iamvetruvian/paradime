crousels = document.querySelectorAll('.crousel');
searchBox = document.querySelector('.searchbar');
tmdbApiKey = 'f29892040fcd94a66373b8170211ae55';
platters = document.querySelectorAll('.platter');
moviesContainer = document.querySelector('.movies-container');
tvshowsContainer = document.querySelector('.tvshows-container');
function createCards(movie) {
    const baseImageUrl = "https://image.tmdb.org/t/p/";
    const backdropPath = movie.poster_path;
    if (!backdropPath) {
        return null; // Skip movies without a backdrop image
    }
    const fullBackdropUrl = `${baseImageUrl}/original/${backdropPath}`;
    console.log(fullBackdropUrl);

    // const cardContainer = document.querySelector('.search-results');
    const card = document.createElement('div');
    card.classList.add('card');
    const cardImage = document.createElement('img');
    cardImage.classList.add('card-img');
    cardImage.src = fullBackdropUrl;
    const alttext = movie.name ? movie.name.slice(0, 20)+"..." : (movie.original_title ? movie.original_title.slice(0, 20)+"..." : "Movie Poster");
    cardImage.alt = alttext;
    card.appendChild(cardImage);
    // cardContainer.appendChild(card);
    return card;
}
// Search Box Focus Effect
// searchBox.addEventListener('focus', () => {
//     document.querySelector('.search-results-container').style.display = 'block';
//     document.querySelector('.search-results').innerHTML = '';
// });
// https://api.themoviedb.org/3/search/movie?api_key=f29892040fcd94a66373b8170211ae55&query=All%20The%20Bright%20Places
searchBox.addEventListener('input', ()=>{
    if (searchBox.value.trim() === '') {
        document.querySelector('#reset-button').style.display = 'none';

    } else {
        document.querySelector('#reset-button').style.display = 'block';
    }
});
searchBox.addEventListener('focus', () => {
    document.querySelector('.search-results-container').style.display = 'flex';
    
    document.querySelector('.hero-bg').style.display = 'none';
    document.querySelector('.poster-info').style.display = 'none';
    for (let platter of platters) {
        platter.style.display = 'none';
    }
});
searchBox.addEventListener('keydown', async (event) => {
    if (event.key !== 'Enter') return;
    event.preventDefault();
    document.querySelector('.search-results-container').style.display = 'flex ';
    document.querySelector('.search-results').innerHTML = '';
    
    
    const query = searchBox.value.trim();
    const res = await fetch(`https://api.themoviedb.org/3/search/multi?api_key=${tmdbApiKey}&query=${encodeURIComponent(query)}`);
    const data = await res.json();
    console.log(data.results);
    if (data.results.length === 0) {
        let noResultsMessage = document.querySelector('.alert-warning');
        if(noResultsMessage) {
            noResultsMessage.remove();
        }
        noResultsMessage = document.createElement('p');

        noResultsMessage.classList.add('alert');
        noResultsMessage.classList.add('alert-warning');
        noResultsMessage.style.margin = '20px';
        noResultsMessage.textContent = 'No results found.';
        document.querySelector ('.search-results-container').prepend(noResultsMessage);
        return;
    }
    // const baseImageUrl = "https://image.tmdb.org/t/p/w780/mR04QRFtok3EJn4fMBrCvi5xOeh.jpg";
    for (let movie of data.results) {
        const card =createCards(movie);
        if (!card) continue;
        // console.log(card)
        const noResultsMessage = document.querySelector('.alert-warning');
        if(noResultsMessage) {
            noResultsMessage.remove();
        }
        document.querySelector('.search-results').appendChild(card);
    }
    if (document.querySelector('.search-results').innerHTML === '') {
        let noResultsMessage = document.querySelector('.alert-warning');
        if(noResultsMessage) {
            noResultsMessage.remove();
        }
        noResultsMessage = document.createElement('p');
        noResultsMessage.classList.add('alert');
        noResultsMessage.classList.add('alert-warning');
        noResultsMessage.style.margin = '20px';
        noResultsMessage.textContent = 'No results found.';
        document.querySelector ('.search-results-container').prepend(noResultsMessage);
    }
    // const fullBackdropUrl = `${baseImageUrl}w780${backdropPath}`;
});

// tmbd api link:   
// api key = f29892040fcd94a66373b8170211ae55
// api read access token = eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJmMjk4OTIwNDBmY2Q5NGE2NjM3M2I4MTcwMjExYWU1NSIsIm5iZiI6MTc2ODUwMzk1NS45MjQsInN1YiI6IjY5NjkzYTkzOGYxN2U1Y2Q1YWE4ODJjYiIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.wR22Ym0MqJmDhbQs_-fQXemdHTBr0JeIok07HcYSnzw


crousels.forEach(crousel => {
    const leftButton = crousel.querySelector('.scroll-left');
    const rightButton = crousel.querySelector('.scroll-right'); 
    const scrollControls = crousel.querySelector('.scroll-controls');
    const cardContainer = crousel;

    cardContainer.addEventListener('mouseover', () => {
        scrollControls.style.opacity = '1';
    });

    cardContainer.addEventListener('mouseout', () => {
        scrollControls.style.opacity = '0';
    });

    leftButton.addEventListener('click', () => {
        cardContainer.scrollBy({
            left: -300,
            behavior: 'smooth'
        });
    });

    rightButton.addEventListener('click', () => {
        cardContainer.scrollBy({
            left: 300,
            behavior: 'smooth'
        });
    });
});