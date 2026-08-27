function StarRating({ rating, size = 'md' }) {
  const sizeClass = size === 'sm' ? 'text-sm' : 'text-base';
  const stars = [];
  
  for (let i = 1; i <= 5; i++) {
    if (i <= rating) {
      stars.push(<span key={i} className="text-yellow-400">★</span>);
    } else {
      stars.push(<span key={i} className="text-gray-300">☆</span>);
    }
  }
  
  return (
    <div className={sizeClass}>
      {stars}
    </div>
  );
}

export default StarRating;
