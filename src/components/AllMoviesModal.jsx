import React from 'react';
import MovieCard from './MovieCard';

const AllMoviesModal = ({ isOpen, onClose, title, movies, onMovieSelect }) => {
  if (!isOpen) return null;

  const handleCardClick = (movie) => {
    onMovieSelect(movie);
    onClose(); // Close modal after selection
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="bg-neutral-900 rounded-lg shadow-xl w-full max-w-5xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
      >
        <header className="flex justify-between items-center p-4 border-b border-neutral-800 flex-shrink-0">
          <h2 className="text-2xl font-bold text-white">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-white" aria-label="Close modal">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>
        <main className="p-6 overflow-y-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {movies.map((movie) => (
              <MovieCard key={movie.id} movie={movie} onMovieSelect={handleCardClick} />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default AllMoviesModal;
