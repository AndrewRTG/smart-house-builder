export default function Pagination({ currentPage, totalPages, onPageChange, className = "community-pagination" }) {
  if (totalPages <= 1) return null;
  return (
    <div className={className}>
      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage === 0}
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>
      {Array.from({ length: totalPages }, (_, index) => (
        <button
          key={index}
          type="button"
          className={`pagination-btn ${currentPage === index ? "active" : ""}`}
          onClick={() => onPageChange(index)}
        >
          {index + 1}
        </button>
      ))}
      <button
        type="button"
        className="pagination-btn"
        disabled={currentPage >= totalPages - 1}
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
