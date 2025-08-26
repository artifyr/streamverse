import React, { useState, useEffect, useCallback, useRef, useReducer } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import MovieSection from './components/MovieSection';
import PinModal from './components/PinModal';

// It's highly recommended to move this to a .env file
// Create a .env file in your project root and add:
// VITE_TMDB_API_KEY="your_tmdb_api_key"
// Then you can access it with import.meta.env.VITE_TMDB_API_KEY
const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const initialMovieListsState = {
  barbie: [],
  isBarbieExpanded: false,
  tinkerbell: [],
  isTinkerbellExpanded: false,
  bengali: [],
  isBengaliExpanded: false,
  popular: [],
  isLoading: true,
  error: null,
};

function movieListsReducer(state, action) {
  switch (action.type) {
    case 'FETCH_START':
      return { ...state, isLoading: true, error: null };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        isLoading: false,
        popular: action.payload.popular,
        barbie: action.payload.barbie,
        tinkerbell: action.payload.tinkerbell,
        bengali: action.payload.bengali,
      };
    case 'FETCH_ERROR':
      return { ...state, isLoading: false, error: action.payload };
    case 'TOGGLE_BARBIE_EXPAND':
      return { ...state, isBarbieExpanded: !state.isBarbieExpanded };
    case 'TOGGLE_TINKERBELL_EXPAND':
      return { ...state, isTinkerbellExpanded: !state.isTinkerbellExpanded };
    case 'TOGGLE_BENGALI_EXPAND':
      return { ...state, isBengaliExpanded: !state.isBengaliExpanded };
    case 'ABORT_FETCH':
      return { ...state, isLoading: false };
    default:
      throw new Error(`Unhandled action type: ${action.type}`);
  }
}

function App() {
  const [isUnlocked, setIsUnlocked] = useState(() => {
    const sessionData = localStorage.getItem('vidgen_unlock_session');
    if (!sessionData) {
      return false;
    }

    try {
      const { timestamp } = JSON.parse(sessionData);
      // 2 hours in milliseconds
      const EXPIRATION_TIME = 2 * 60 * 60 * 1000;
      const isExpired = Date.now() - timestamp > EXPIRATION_TIME;

      if (isExpired) {
        localStorage.removeItem('vidgen_unlock_session');
        return false;
      }
      return true;
    } catch (e) {
      // If data is malformed, clear it and lock the site
      localStorage.removeItem('vidgen_unlock_session');
      return false;
    }
  });
  // State to hold the value from the input field
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(
    () => localStorage.getItem('vidgen_imdb_code') || ''
  );
  const [source, setSource] = useState(
    () => localStorage.getItem('vidgen_source') || 'vidfast'
  );
  const [movieListsState, dispatchMovieLists] = useReducer(movieListsReducer, initialMovieListsState);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchContainerRef = useRef(null);
  const initialToastShown = useRef(false);

  // Effect for showing random love toasts
  useEffect(() => {
    // Don't show toasts if the site is locked
    if (!isUnlocked) {
      return;
    }

    const phrases = [
      "I loveee youu babypie",
      "Hope you know i love youu",
      "Mwahhh",
      "Goodmorning Pineapple",
      "You're my favorite person",
      "Thinking of you, my love",
      "You make my world sooo much betterr",
      "Just a little reminder that I lovee youuu",
      "Hiii babyyypie"
    ];
    const emojis = ['❤️', '💕', '😽', '😘', '🌸'];

    const showRandomToast = () => {
      const randomPhrase = phrases[Math.floor(Math.random() * phrases.length)];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      // By passing a function, we can render custom JSX and control the layout.
      toast(
        () => (
          <span>
            {randomPhrase}
            <span role="img" aria-label="emoji" style={{ marginLeft: '8px' }}>
              {randomEmoji}
            </span>
          </span>
        ),
        {
          style: {
            borderRadius: '10px',
            background: '#333',
            color: '#fff',
          },
        }
      );
    };

    // In React 18's StrictMode, useEffect runs twice in development.
    // This ref-based check ensures the initial toast is only shown once.
    if (!initialToastShown.current) {
      // Show the first toast immediately on load
      showRandomToast();
      initialToastShown.current = true;
    }

    const intervalId = setInterval(showRandomToast, 15 * 60 * 1000); // 15 minutes
    return () => clearInterval(intervalId); // Cleanup on unmount
  }, [isUnlocked]); // Re-run when unlocked

  // Effect to fetch movie lists on initial load
  useEffect(() => {
    const fetchMovieLists = async () => {
      // Don't fetch if the site is locked
      if (!isUnlocked) {
        dispatchMovieLists({ type: 'ABORT_FETCH' });
        return;
      }

      if (submittedCode) {
        // If a movie is selected, no need to load lists
        dispatchMovieLists({ type: 'ABORT_FETCH' });
        return;
      }
      dispatchMovieLists({ type: 'FETCH_START' });

      const fetchAllPagesForQuery = async (query) => {
        try {
          // Fetch first page to get total pages
          const initialResponse = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=1`);
          if (!initialResponse.ok) {
            console.error(`Failed to fetch initial page for ${query}`);
            return [];
          }
          const initialData = await initialResponse.json();
          const totalPages = initialData.total_pages;
          let allResults = initialData.results || [];

          if (totalPages > 1) {
            const pagePromises = [];
            // Fetch up to 3 pages total to get more results without being too slow.
            const maxPagesToFetch = Math.min(totalPages, 3);
            for (let i = 2; i <= maxPagesToFetch; i++) {
              pagePromises.push(
                fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(query)}&page=${i}`)
                  .then(res => res.ok ? res.json() : Promise.resolve({ results: [] }))
              );
            }
            const subsequentPagesData = await Promise.all(pagePromises);
            subsequentPagesData.forEach(pageData => {
              allResults.push(...(pageData.results || []));
            });
          }
          return allResults;
        } catch (error) {
          console.error(`Error fetching all pages for query "${query}":`, error);
          return [];
        }
      };

      const filterAndDeduplicate = (movies, { genreId, requirePoster = true } = {}) => {
        let filteredMovies = movies;

        // 1. Filter by genre if genreId is provided
        if (genreId) {
          filteredMovies = filteredMovies.filter(
            (movie) =>
              // Safer check for genre_ids
              Array.isArray(movie.genre_ids) && movie.genre_ids.includes(genreId)
          );
        }

        // 2. Filter by poster path if required
        if (requirePoster) {
          filteredMovies = filteredMovies.filter((movie) => movie.poster_path);
        }

        // 3. Deduplicate
        return filteredMovies.filter(
          (movie, index, self) =>
            index === self.findIndex((m) => m.id === movie.id)
        );
      };

      const fetchAllBengaliMovies = async () => {
        try {
          // Fetch 3 pages to get up to 120 movies
          const pagePromises = [1, 2, 3, 4, 5, 6].map(page =>
            fetch(`https://api.themoviedb.org/3/discover/movie?api_key=${TMDB_API_KEY}&language=en-US&page=${page}&with_origin_country=IN&with_original_language=bn&primary_release_date.lte=2009-12-31`)
              .then(res => {
                if (!res.ok) {
                  console.error(`Failed to fetch page ${page} of Bengali movies`);
                  return Promise.resolve({ results: [] }); // Don't break the Promise.all
                }
                return res.json();
              })
          );
          const bengaliPagesData = await Promise.all(pagePromises);
          return bengaliPagesData.reduce((allMovies, pageData) => {
            allMovies.push(...(pageData.results || []));
            return allMovies;
          }, []);
        } catch (error) {
          console.error('Error fetching all Bengali movies:', error);
          return []; // Return empty array on failure
        }
      };

      try {
        const [
          popularResponse,
          barbieMovies,
          tinkerbellMovies,
          bengaliMovies,
        ] = await Promise.all([
          fetch(`https://api.themoviedb.org/3/movie/popular?api_key=${TMDB_API_KEY}&language=en-US&page=1`),
          fetchAllPagesForQuery('Barbie'),
          fetchAllPagesForQuery('Tinkerbell'),
          fetchAllBengaliMovies(),
        ]);

        if (!popularResponse.ok) throw new Error('Failed to fetch popular movies');

        const popularData = await popularResponse.json();
        const animationGenreId = 16; // Genre ID for Animation

        dispatchMovieLists({
          type: 'FETCH_SUCCESS',
          payload: {
            popular: popularData.results || [],
            barbie: filterAndDeduplicate(barbieMovies, { genreId: animationGenreId }),
            tinkerbell: filterAndDeduplicate(tinkerbellMovies, { genreId: animationGenreId }),
            bengali: filterAndDeduplicate(bengaliMovies),
          },
        });
      } catch (error) {
        console.error('Error fetching movie lists:', error);
        dispatchMovieLists({ type: 'FETCH_ERROR', payload: 'Could not load movies. Please try again later.' });
      }
    };
    fetchMovieLists();
  }, [submittedCode, isUnlocked]); // Re-fetch if we go back to the homepage or unlock

  useEffect(() => {
    localStorage.setItem('vidgen_imdb_code', submittedCode);
  }, [submittedCode]);

  useEffect(() => {
    localStorage.setItem('vidgen_source', source);
  }, [source]);

  const handleMovieSelect = useCallback(async (movie) => {
    if (!movie || !movie.id) return;
  
    setSearchQuery('');
    setSearchResults([]);
    setIsSearching(false);

    try {
      const response = await fetch(`https://api.themoviedb.org/3/movie/${movie.id}?api_key=${TMDB_API_KEY}`);
      if (!response.ok) throw new Error('Failed to fetch movie details');
      
      const details = await response.json();
      if (details.imdb_id) {
        setSubmittedCode(details.imdb_id);
      } else {
        const errorMsg = 'Could not find streaming information for this movie.';
        console.error(errorMsg);
        toast.error(errorMsg);
      }
    } catch (error) {
      toast.error('Failed to get movie details. Please try again.');
      console.error('Error fetching movie details:', error);
    }
  }, []);

  const handleGoHome = useCallback(() => {
    setSubmittedCode('');
  }, []);

  const handleUnlock = useCallback(() => {
    const sessionData = {
      timestamp: Date.now(),
    };
    localStorage.setItem('vidgen_unlock_session', JSON.stringify(sessionData));
    setIsUnlocked(true);
  }, []);

  const scrollTop = useCallback(() => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const response = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${TMDB_API_KEY}&query=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) throw new Error('Network response was not ok');
        
        const data = await response.json();
        setSearchResults(data.results || []);
      } catch (error) {
        console.error("Failed to fetch movies:", error);
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 500);

    return () => clearTimeout(debounceTimer);
  }, [searchQuery]);

  // Effect to close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setSearchResults([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Effect for scroll to top button visibility
  useEffect(() => {
    const checkScrollTop = () => {
      // Show button after scrolling down 400px
      if (window.scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener("scroll", checkScrollTop);
    return () => window.removeEventListener("scroll", checkScrollTop);
  }, []);

  let streamUrl = '';
  if (submittedCode) {
    if (source === 'vidfast') {
      streamUrl = `https://vidfast.pro/movie/${submittedCode}`;
    } else if (source === 'vidsrc') {
      streamUrl = `https://vidsrc.net/embed/movie?imdb=${submittedCode}`;
    } else if (source === 'embedsu') {
      streamUrl = `https://embed.su/embed/movie/${submittedCode}`;
    }
  }

  const handleSubmit = useCallback((event) => {
    event.preventDefault();
    if (searchResults.length > 0) {
      handleMovieSelect(searchResults[0]);
    } else {
      const trimmedCode = searchQuery.trim();
      if (trimmedCode.startsWith('tt')) {
        setSubmittedCode(trimmedCode);
        setSearchQuery('');
      }
    }
  }, [searchResults, searchQuery, handleMovieSelect]);
  
  const FOR_YOU_INITIAL_LIMIT = 14;

  return (
    <div className="relative min-h-screen bg-neutral-900 text-white flex flex-col items-center p-6 pt-32 sm:p-8 sm:pt-32 font-sans">
      {!isUnlocked && <PinModal onUnlock={handleUnlock} />}

      {submittedCode && (
        <button
          onClick={handleGoHome}
          className="absolute top-6 left-6 sm:top-8 sm:left-8 bg-neutral-800 hover:bg-neutral-700 text-white p-3 rounded-full transition-colors duration-300 z-20 shadow-lg cursor-pointer"
          aria-label="Go to homepage"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h7.5" />
          </svg>
        </button>
      )}
      <Toaster position="top-center" />
      
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white">
          StreamVerse
        </h1>
        <p className="text-neutral-400">Streaming site for my love 💕</p>
      </div>

      <div ref={searchContainerRef} className="w-full max-w-lg relative">
        <form onSubmit={handleSubmit} className="w-full mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
              <svg className="w-5 h-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
              </svg>
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for a movie..."
              className="w-full bg-neutral-900 border-2 border-neutral-700 rounded-lg pl-10 pr-28 sm:pr-32 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white/50 focus:ring-1 focus:ring-white/40 transition-colors duration-300"
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-2 flex items-center gap-2">
              {isSearching ? (
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="text-neutral-500 hover:text-white transition-colors cursor-pointer"
                  aria-label="Clear search"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
              <button
                type="submit"
                className="bg-neutral-100/70 hover:bg-neutral-200 text-black font-bold py-1 px-4 sm:px-4 -mr-1 rounded-md transition-colors duration-300 cursor-pointer"
              >
                Play
              </button>
            </div>
          </div>
        </form>

        {!isSearching && searchResults.length > 0 && (
          <ul className="absolute w-full bg-neutral-800 border border-neutral-700 rounded-xl mt-1 max-h-80 overflow-y-auto z-10">
            {searchResults.slice(0, 10).map((movie) => (
              <li
                key={movie.id}
                onClick={() => handleMovieSelect(movie)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    handleMovieSelect(movie);
                  }
                }}
                className="w-full text-left p-3 hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-4 cursor-pointer"
                role="button"
                tabIndex="0"
              >
                  {movie.poster_path ? (
                    <img 
                      src={`https://image.tmdb.org/t/p/w92${movie.poster_path}`} 
                      alt={movie.title}
                      className="w-12 rounded flex-shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-[72px] bg-neutral-700 rounded flex items-center justify-center text-neutral-500 flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                  )}
                  <div className="overflow-hidden">
                    <p className="font-semibold text-white truncate">{movie.title}</p>
                    <p className="text-sm text-neutral-400">
                      {movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}
                    </p>
                  </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4 mb-8 mt-2">
        <button
          onClick={() => setSource('vidfast')}
          className={`cursor-pointer font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'vidfast'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          Vidfast
        </button>
        <button
          onClick={() => setSource('vidsrc')}
          className={`cursor-pointer font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'vidsrc'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          Vidsrc
        </button>
        <button
          onClick={() => setSource('embedsu')}
          className={`cursor-pointer font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'embedsu'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          EmbedSu
        </button>
      </div>

      {submittedCode ? (
        <div className="w-full max-w-screen-xl bg-black rounded-lg shadow-lg overflow-hidden border border-neutral-800">
          <iframe
            key={`${submittedCode}-${source}`}
            className="w-full aspect-video"
            src={streamUrl}
            title="Movie Player"
            allowFullScreen
            allow="autoplay; encrypted-media; picture-in-picture"
            referrerPolicy="origin-when-cross-origin"
          ></iframe>
        </div>
      ) : movieListsState.error ? (
        <div className="w-full max-w-screen-xl mt-8 text-center text-red-400 bg-red-900/20 p-6 rounded-lg">
          <p className="font-semibold">Something went wrong</p>
          <p>{movieListsState.error}</p>
        </div>
      ) : (
        <>
          {(movieListsState.isLoading || movieListsState.barbie.length > 0) && (
            <MovieSection
              title="Barbie Animated Movies"
              movies={movieListsState.isBarbieExpanded ? movieListsState.barbie : movieListsState.barbie.slice(0, FOR_YOU_INITIAL_LIMIT)}
              isLoading={movieListsState.isLoading}
              onMovieSelect={handleMovieSelect}
              isExpandable={movieListsState.barbie.length > FOR_YOU_INITIAL_LIMIT}
              isExpanded={movieListsState.isBarbieExpanded}
              onToggleExpand={() => dispatchMovieLists({ type: 'TOGGLE_BARBIE_EXPAND' })}
            />
          )}
          {(movieListsState.isLoading || movieListsState.tinkerbell.length > 0) && (
            <MovieSection
              title="Tinkerbell Animated Movies"
              movies={movieListsState.isTinkerbellExpanded ? movieListsState.tinkerbell : movieListsState.tinkerbell.slice(0, FOR_YOU_INITIAL_LIMIT)}
              isLoading={movieListsState.isLoading}
              onMovieSelect={handleMovieSelect}
              isExpandable={movieListsState.tinkerbell.length > FOR_YOU_INITIAL_LIMIT}
              isExpanded={movieListsState.isTinkerbellExpanded}
              onToggleExpand={() => dispatchMovieLists({ type: 'TOGGLE_TINKERBELL_EXPAND' })}
            />
          )}
          {(movieListsState.isLoading || movieListsState.bengali.length > 0) && (
            <MovieSection
              title="Popular Bengali Movies (Before 2010)"
              movies={movieListsState.isBengaliExpanded ? movieListsState.bengali : movieListsState.bengali.slice(0, FOR_YOU_INITIAL_LIMIT)}
              isLoading={movieListsState.isLoading}
              onMovieSelect={handleMovieSelect}
              isExpandable={movieListsState.bengali.length > FOR_YOU_INITIAL_LIMIT}
              isExpanded={movieListsState.isBengaliExpanded}
              onToggleExpand={() => dispatchMovieLists({ type: 'TOGGLE_BENGALI_EXPAND' })}
            />
          )}
          <MovieSection
            title="Popular Movies"
            movies={movieListsState.popular}
            isLoading={movieListsState.isLoading}
            onMovieSelect={handleMovieSelect}
          />
        </>
      )}
      {/* --- Footer --- */}
      <footer className="text-center text-neutral-500 text-sm py-16">
        made for my baby with ❤️
      </footer>

      {showScrollTop && (
        <button
          onClick={scrollTop}
          className="fixed bottom-8 right-8 bg-neutral-700/50 backdrop-blur-lg text-white p-3 rounded-full shadow-lg hover:bg-black/50 transition-colors duration-300 z-20 cursor-pointer"
          aria-label="Scroll to top"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 19.5v-15m0 0l-6.75 6.75M12 4.5l6.75 6.75" />
          </svg>
        </button>
      )}
    </div>
  );
}

export default App;
