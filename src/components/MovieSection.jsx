import React from 'react';

const MovieCard = ({ movie, onMovieSelect }) => (
  <div
    onClick={() => onMovieSelect(movie)}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onMovieSelect(movie);
      }
    }}
    className="group cursor-pointer"
    role="button"
    tabIndex="0"
  >
    <div className="aspect-[2/3] bg-neutral-800 rounded-lg overflow-hidden transform transition-transform duration-300 group-hover:scale-105">
      {movie.poster_path ? (
        <img
          src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
          alt={movie.title}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center text-neutral-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
        </div>
      )}
    </div>
    <h3 className="mt-2 text-sm font-semibold text-white truncate group-hover:text-clip group-hover:whitespace-normal">{movie.title}</h3>
    <p className="text-xs text-neutral-400">{movie.release_date ? movie.release_date.substring(0, 4) : 'N/A'}</p>
  </div>
);

const SkeletonCard = () => (
  <div>
    <div className="aspect-[2/3] bg-neutral-800 rounded-lg animate-pulse"></div>
    <div className="h-4 bg-neutral-800 rounded mt-2 w-3/4 animate-pulse"></div>
    <div className="h-3 bg-neutral-800 rounded mt-1 w-1/2 animate-pulse"></div>
  </div>
);

const MovieSection = ({
  title,
  movies,
  isLoading,
  onMovieSelect,
  isExpandable = false,
  isExpanded = false,
  onToggleExpand = () => {},
}) => {
  const skeletonCount = 14; // Number of skeletons to show while loading

  return (
    <section className="w-full max-w-screen-xl mt-8">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-white">{title}</h2>
        {isExpandable && !isLoading && (
          <button
            onClick={onToggleExpand}
            className="text-sm font-semibold text-neutral-400 hover:text-white transition-colors cursor-pointer"
          >
            {isExpanded ? 'Show Less' : 'View All'}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 gap-4 sm:gap-5">
        {isLoading ? Array.from({ length: skeletonCount }).map((_, index) => <SkeletonCard key={index} />) : movies.map((movie) => <MovieCard key={movie.id} movie={movie} onMovieSelect={onMovieSelect} />)}
      </div>
    </section>
  );
};

export default MovieSection;

