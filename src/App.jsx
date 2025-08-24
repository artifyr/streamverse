import React, { useState, useEffect } from 'react';

function App() {
  // State to hold the value from the input field
  const [imdbCode, setImdbCode] = useState(''); 
  const [submittedCode, setSubmittedCode] = useState(
    () => localStorage.getItem('vidgen_imdb_code') || ''
  );

  const [source, setSource] = useState(
    () => localStorage.getItem('vidgen_source') || 'vidfast'
  );

  useEffect(() => {
    localStorage.setItem('vidgen_imdb_code', submittedCode);
  }, [submittedCode]);

  useEffect(() => {
    localStorage.setItem('vidgen_source', source);
  }, [source]);
  
  const handleSubmit = (event) => {
    event.preventDefault(); 
    if (imdbCode.trim()) {
      setSubmittedCode(imdbCode.trim());
    }
  };

  let streamUrl = '';
  if (submittedCode) {
    if (source === 'vidfast') {
      streamUrl = `https://vidfast.pro/movie/${submittedCode}`;
    } else if (source === 'vidsrc') {
      streamUrl = `https://vidsrc.net/embed/movie?imdb=${submittedCode}`;
    }
  }

  return (
    <div className="min-h-screen bg-neutral-900 text-white flex flex-col items-center p-4 pt-12 sm:p-6 sm:pt-16 font-sans">
      
      <div className="text-center mb-8">
        <h1 className="text-4xl sm:text-5xl font-bold mb-2 text-white">
          StreamVerse
        </h1>
        <p className="text-neutral-400">Enter an IMDb code to play.</p>
      </div>

      <form onSubmit={handleSubmit} className="w-full max-w-lg flex gap-2 mb-4">
        <input
          type="text"
          value={imdbCode}
          onChange={(e) => setImdbCode(e.target.value)}
          placeholder="e.g., tt3504064"
          className="flex-grow bg-neutral-900 border-2 border-neutral-700 rounded-md px-4 py-2 text-white placeholder-neutral-500 focus:outline-none focus:border-white focus:ring-1 focus:ring-white transition-colors duration-300"
        />
        <button
          type="submit"
          className="bg-white hover:bg-neutral-200 text-black font-bold py-2 px-4 sm:px-6 rounded-md transition-colors duration-300"
        >
          Play
        </button>
      </form>

      <div className="flex gap-4 mb-10">
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
      </div>


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

    </div>
  );
}

export default App;
