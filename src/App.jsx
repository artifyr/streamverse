import React, { useState, useEffect, useCallback, useRef } from 'react';

// It's highly recommended to move this to a .env file
// Create a .env file in your project root and add:
// VITE_TMDB_API_KEY="your_tmdb_api_key"
// Then you can access it with import.meta.env.VITE_TMDB_API_KEY
const TMDB_API_KEY = '7d372d2acc09d0ec7b9a035be499c4c4';

function App() {
  // State to hold the value from the input field
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [submittedCode, setSubmittedCode] = useState(
    () => localStorage.getItem('vidgen_imdb_code') || ''
  );
  const [history, setHistory] = useState(
    () => JSON.parse(localStorage.getItem('vidgen_history')) || []
  );
  const [source, setSource] = useState(
    () => localStorage.getItem('vidgen_source') || 'vidfast'
  );
  const searchContainerRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('vidgen_imdb_code', submittedCode);
  }, [submittedCode]);

  useEffect(() => {
    localStorage.setItem('vidgen_source', source);
  }, [source]);

  useEffect(() => {
    localStorage.setItem('vidgen_history', JSON.stringify(history));
  }, [history]);

  const updateHistory = useCallback((code) => {
    if (!code) return;
    setHistory(prevHistory => {
      const newHistory = [...new Set([code, ...prevHistory])];
      return newHistory.slice(0, 10);
    });
  }, []);

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
        updateHistory(details.imdb_id);
      } else {
        console.error('IMDb ID not found for this movie.');
        // You could add user-facing error handling here
      }
    } catch (error) {
      console.error('Error fetching movie details:', error);
    }
  }, [updateHistory]);

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

  const handleHistoryClick = (code) => {
    setSubmittedCode(code);
    setSearchQuery('');
    setSearchResults([]);
  };

  const handleClearHistory = () => {
    setHistory([]);
  };

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
        updateHistory(trimmedCode);
        setSearchQuery('');
      }
    }
  }, [searchResults, searchQuery, handleMovieSelect, updateHistory]);

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center p-4 pt-12 sm:p-6 sm:pt-16 font-sans">
      
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white">
          StreamVerse
        </h1>
        <p className="text-neutral-400">Search for a movie to play.</p>
      </div>

      <div ref={searchContainerRef} className="w-full max-w-lg relative">
        <form onSubmit={handleSubmit} className="w-full flex gap-2 mb-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search for a movie..."
            className="flex-grow bg-neutral-900 border-2 border-neutral-700 rounded-md px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors duration-300"
            autoComplete="off"
          />
          <button
            type="submit"
            className="bg-white hover:bg-neutral-200 text-black font-bold py-2 px-4 sm:px-6 rounded-md transition-colors duration-300"
          >
            Play
          </button>
        </form>

        {isSearching && (
          <div className="absolute w-full bg-neutral-800 border border-neutral-700 rounded-md mt-1 p-4 text-center text-neutral-400 z-10">
            Searching...
          </div>
        )}

        {!isSearching && searchResults.length > 0 && (
          <ul className="absolute w-full bg-neutral-800 border border-neutral-700 rounded-md mt-1 max-h-80 overflow-y-auto z-10">
            {searchResults.slice(0, 10).map((movie) => (
              <li key={movie.id}>
                <button
                  onClick={() => handleMovieSelect(movie)}
                  className="w-full text-left p-3 hover:bg-neutral-700 transition-colors duration-200 flex items-center gap-4"
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
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="flex gap-4 mb-6 mt-4">
        <button
          onClick={() => setSource('vidfast')}
          className={`font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'vidfast'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          Vidfast
        </button>
        <button
          onClick={() => setSource('vidsrc')}
          className={`font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'vidsrc'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          Vidsrc
        </button>
        <button
          onClick={() => setSource('embedsu')}
          className={`font-semibold py-2 px-5 rounded-md transition-colors duration-300 ${
            source === 'embedsu'
              ? 'bg-white text-black'
              : 'border-2 border-neutral-700 text-neutral-400 hover:bg-neutral-800 hover:border-neutral-600'
          }`}
        >
          EmbedSu
        </button>
      </div>

      {history.length > 0 && (
        <div className="w-full max-w-lg mb-10 text-center sm:text-left">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold text-neutral-300">
              History
            </h3>
            <button
              onClick={handleClearHistory}
              className="text-sm text-neutral-500 hover:text-white transition-colors duration-200"
            >
              Clear
            </button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
            {history.map((code) => (
              <button
                key={code}
                onClick={() => handleHistoryClick(code)}
                className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white font-mono text-sm py-1 px-3 rounded-md transition-colors duration-200"
              >
                {code}
              </button>
            ))}
          </div>
        </div>
      )}


      {submittedCode && (
        <div className="w-full max-w-screen-xl bg-black rounded-lg shadow-lg overflow-hidden border border-neutral-800">
          <iframe
            key={`${submittedCode}-${source}`} 
            className="w-full aspect-video"
            src={streamUrl}
            title="Movie Player"
            allowFullScreen
          ></iframe>
        </div>
      )}
      {/* --- Footer --- */}
      <footer className="mt-auto text-center text-neutral-500 text-sm py-4">
        made for my baby with ❤️
      </footer>
    </div>
  );
}

export default App;
