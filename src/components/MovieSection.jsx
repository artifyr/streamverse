import React from 'react';

const MovieCard = ({ movie, onMovieSelect }) => {
  // Fallback for missing poster
  const PosterFallback = () => (
    <div className="bg-neutral-800 rounded-lg aspect-[2/3] flex items-center justify-center text-center p-2 group-hover:bg-neutral-700 transition-colors">
      <p className="text-neutral-400">{movie.title}</p>
    </div>
  );

  return (
    <div
      className="cursor-pointer group"
      onClick={() => onMovieSelect(movie)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onMovieSelect(movie)}
      role="button"
      tabIndex="0"
      aria-label={`Play ${movie.title}`}
    >
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="rounded-lg w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105 shadow-lg"
          loading="lazy"
        />
      ) : (
        <PosterFallback />
      )}
    </div>
  );
};

const MovieSection = ({ title, movies, isLoading, onMovieSelect }) => {
  if (isLoading) {
    return (
      <div className="w-full max-w-screen-xl mt-8 px-2 sm:px-0">
        <h2 className="text-2xl font-bold text-white mb-6">{title}</h2>
        <p className="text-neutral-400">Loading movies...</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-screen-xl mt-8">
      <h2 className="text-2xl font-bold text-white mb-6 px-2 sm:px-0">{title}</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
        {movies.map((movie) => (
          <MovieCard key={movie.id} movie={movie} onMovieSelect={onMovieSelect} />
        ))}
      </div>
    </div>
  );
};

export default MovieSection;