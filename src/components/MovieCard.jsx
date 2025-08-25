import React from 'react';

const PosterFallback = () => (
  <div className="w-full aspect-[2/3] bg-neutral-800 rounded-lg flex items-center justify-center text-neutral-600">
    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  </div>
);

const MovieCard = ({ movie, onMovieSelect }) => {
  const releaseYear = movie.release_date
    ? new Date(movie.release_date).getFullYear()
    : null;

  return (
    <div
      className="cursor-pointer group"
      onClick={() => onMovieSelect(movie)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onMovieSelect(movie);
        }
      }}
      role="button"
      tabIndex="0"
      aria-label={`Play ${movie.title}`}
    >
      {movie.poster_path ? (
        <div className="relative overflow-hidden rounded-lg shadow-lg aspect-[2/3]">
          <img
            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
            alt={movie.title}
            className="w-full h-full object-cover transform transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
            <h3 className="text-white font-bold text-base">{movie.title}</h3>
            {releaseYear && (
              <p className="text-neutral-300 text-sm">{releaseYear}</p>
            )}
          </div>
        </div>
      ) : (
        <PosterFallback />
      )}
    </div>
  );
};

export default MovieCard;
