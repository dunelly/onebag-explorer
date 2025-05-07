import { useParams, Link } from 'react-router-dom';
import backpacksData from '../data.js';
import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function BackpackPage() {
  const { id } = useParams();
  const backpack = backpacksData.find(b => b.id === id);
  const [redditData, setRedditData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [gridImages, setGridImages] = useState([]);
  const [discussions, setDiscussions] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [threadImages, setThreadImages] = useState([]);
  const [currentDiscussionPage, setCurrentDiscussionPage] = useState(1);
  const [currentThumbnailPage, setCurrentThumbnailPage] = useState(1);
  const threadsPerPage = 5;
  const thumbnailsPerPage = 8;
  const [currentModalPage, setCurrentModalPage] = useState(1);

  useEffect(() => {
    async function fetchData() {
      if (!backpack) return;
      try {
        const redditFileName = `${backpack.brand.toLowerCase().replace(/'/g, '').replace(/\s+/g, '_')}_${backpack.model.toLowerCase().replace(/\s+/g, '_')}.json`;
        const redditResponse = await fetch(`/src/data/reddit_data/${redditFileName}`);
        const redditData = await redditResponse.json();
        setRedditData(redditData);

        try {
          const analysisFileName = `${backpack.brand.toLowerCase().replace(/'/g, '').replace(/\s+/g, '_')}_${backpack.model.toLowerCase().replace(/\s+/g, '_')}.analysis.json`;
          const analysisResponse = await fetch(`/src/data/analysis/${analysisFileName}`);
          if (analysisResponse.ok) {
            const analysisData = await analysisResponse.json();
            setAnalysis(analysisData);
          } else {
            console.warn(`Analysis file not found or failed to load: ${analysisFileName}`);
            setAnalysis(null);
          }
        } catch (analysisError) {
          console.error('Error loading analysis data:', analysisError);
          setAnalysis(null);
        }

        if (redditData?.imageThreads) {
          const uniqueThreads = [];
          const seenUrls = new Set();
          for (const item of redditData.imageThreads) {
            if (!seenUrls.has(item.thread.url)) {
              uniqueThreads.push(item);
              seenUrls.add(item.thread.url);
            }
          }
          const startIndex = (currentThumbnailPage - 1) * thumbnailsPerPage;
          const endIndex = startIndex + thumbnailsPerPage;
          setGridImages(uniqueThreads.slice(startIndex, endIndex));
          setDiscussions(uniqueThreads);
        } else {
          setGridImages([]);
          setDiscussions([]);
        }

      } catch (error) {
        console.error('Error loading main data:', error);
        setRedditData(null);
        setAnalysis(null);
        setGridImages([]);
        setDiscussions([]);
      }
    }
    fetchData();
  }, [backpack, currentThumbnailPage]);

  const handleImageClick = (item) => {
    const threadUrl = item.thread.url;
    
    const seenImages = new Set();
    const imagesFromThread = redditData.imageThreads
      .filter(img => img.thread.url === threadUrl)
      .filter(img => {
        if (seenImages.has(img.image)) {
          return false;
        }
        seenImages.add(img.image);
        return true;
      });
    
    const index = imagesFromThread.findIndex(img => img.image === item.image);
    
    setSelectedImage(item);
    setThreadImages(imagesFromThread);
    setCurrentImageIndex(index);
    setCurrentModalPage(1);
  };

  const handleThreadClick = (item) => {
    const seenImages = new Set();
    const imagesFromThread = redditData.imageThreads
      .filter(img => img.thread.url === item.thread.url)
      .filter(img => {
        if (seenImages.has(img.image)) {
          return false;
        }
        seenImages.add(img.image);
        return true;
      });
    
    if (imagesFromThread.length > 0) {
      setSelectedImage(imagesFromThread[0]);
      setThreadImages(imagesFromThread);
      setCurrentImageIndex(0);
      setCurrentModalPage(1);
    }
  };

  const handlePrevImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => {
      const newIndex = prev - 1;
      if (newIndex < 0) {
        if (currentModalPage > 1) {
          setCurrentModalPage(prev => prev - 1);
          return 4;
        }
        
        const currentThreadUrl = threadImages[0].thread.url;
        const currentThreadFirstImageIndex = redditData.imageThreads.findIndex(
          img => img.thread.url === currentThreadUrl
        );
        
        const prevThreadImages = redditData.imageThreads.slice(0, currentThreadFirstImageIndex)
          .filter(img => img.thread.url !== currentThreadUrl);
        
        if (prevThreadImages.length > 0) {
          const prevThreadUrl = prevThreadImages[prevThreadImages.length - 1].thread.url;
          const allPrevThreadImages = redditData.imageThreads.filter(
            img => img.thread.url === prevThreadUrl
          );
          
          setThreadImages(allPrevThreadImages);
          setSelectedImage(allPrevThreadImages[allPrevThreadImages.length - 1]);
          setCurrentModalPage(Math.ceil(allPrevThreadImages.length / 5));
          return allPrevThreadImages.length - 1;
        }
        return 0;
      }
      
      if ((prev + 1) % 5 === 0) {
        setCurrentModalPage(p => p + 1);
      }
      
      return newIndex;
    });
  };

  const handleNextImage = (e) => {
    e.stopPropagation();
    setCurrentImageIndex((prev) => {
      const newIndex = prev + 1;
      if (newIndex >= threadImages.length) {
        const currentThreadUrl = threadImages[0].thread.url;
        const currentThreadFirstImageIndex = redditData.imageThreads.findIndex(
          img => img.thread.url === currentThreadUrl
        );
        
        const nextThreadImages = redditData.imageThreads.slice(currentThreadFirstImageIndex + 1)
          .filter(img => img.thread.url !== currentThreadUrl);
        
        if (nextThreadImages.length > 0) {
          const nextThreadUrl = nextThreadImages[0].thread.url;
          const allNextThreadImages = redditData.imageThreads.filter(
            img => img.thread.url === nextThreadUrl
          );
          
          setThreadImages(allNextThreadImages);
          setSelectedImage(allNextThreadImages[0]);
          setCurrentModalPage(1);
          return 0;
        }
        return 0;
      }
      
      if (newIndex % 5 === 0) {
        setCurrentModalPage(p => p + 1);
      }
      
      return newIndex;
    });
  };

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') {
        setSelectedImage(null);
        setThreadImages([]);
        setCurrentImageIndex(0);
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [selectedImage]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowLeft') {
        handlePrevImage(e);
      } else if (e.key === 'ArrowRight') {
        handleNextImage(e);
      }
    };

    if (selectedImage) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [selectedImage, threadImages]);

  // --- Helper function for generating pagination numbers ---
  const generatePagination = (currentPage, totalPages) => {
    const delta = 2; // Number of pages to show before/after current page
    const range = [];
    const rangeWithDots = [];

    // Generate range of numbers
    for (let i = Math.max(2, currentPage - delta); i <= Math.min(totalPages - 1, currentPage + delta); i++) {
      range.push(i);
    }

    // Add first page
    if (totalPages > 1) {
        rangeWithDots.push(1);
    }

    // Add dots before the main range if needed
    if (currentPage - delta > 2) {
      rangeWithDots.push('...');
    }

    // Add the main range
    range.forEach(i => rangeWithDots.push(i));

    // Add dots after the main range if needed
    if (currentPage + delta < totalPages - 1) {
      rangeWithDots.push('...');
    }

    // Add last page
    if (totalPages > 1 && totalPages > range[range.length - 1]) {
        rangeWithDots.push(totalPages);
    }
    
    // Ensure page 1 isn't added twice if it was part of the main range
    if (range.length > 0 && range[0] === 1) {
        rangeWithDots.shift(); // Remove duplicate 1 if first range element is 1
    }
    // Ensure last page isn't added twice
    if (rangeWithDots[rangeWithDots.length - 1] === totalPages && rangeWithDots[rangeWithDots.length - 2] === totalPages){
        rangeWithDots.pop();
    }
    // Remove dots if they are adjacent to 1 or totalPages incorrectly
     if (rangeWithDots[1] === '...' && rangeWithDots[0] === 1) rangeWithDots.splice(1, 1);
     if (rangeWithDots[rangeWithDots.length - 2] === '...' && rangeWithDots[rangeWithDots.length - 1] === totalPages) rangeWithDots.splice(rangeWithDots.length - 2, 1);


    return rangeWithDots;
  };
  // --- End Helper function ---

  if (!backpack) {
    return <div className="p-4">Backpack not found</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <Link 
        to="/" 
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mb-6"
      >
        <ChevronLeft className="w-5 h-5" />
        <span>Back to All Backpacks</span>
      </Link>

      <div className="border border-gray-200 rounded-2xl p-8">
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">{backpack.brand} {backpack.name}</h1>
          <p className="text-gray-500 text-lg">
            {backpack.brand} {backpack.volume ? `• ${backpack.volume}L ` : ''}{backpack.weight ? `• ${backpack.weight}kg ` : ''}{backpack.price ? `• $${backpack.price} ` : ''}{backpack.dimensions ? `— ${backpack.dimensions} ` : ''} {backpack.laptopCompartment ? `• Fits up to ${backpack.laptopCompartment === 'Yes' ? '16"' : backpack.laptopCompartment} laptop ` : ''} {backpack.carryOnLegal ? `• ${backpack.carryOnLegal === 'Yes' ? 'Carry-On Legal' : backpack.carryOnLegal}` : ''}
          </p>
        </div>

        {/* Community Analysis Removed */}

        {/* --- Moved Pros & Cons Section --- */}
        {analysis && (Array.isArray(analysis.pros) && analysis.pros.length > 0 || Array.isArray(analysis.cons) && analysis.cons.length > 0) && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Pros & Cons</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Pros */}
              {Array.isArray(analysis.pros) && analysis.pros.length > 0 && (
                <div className="bg-green-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-green-800 mb-4">Pros</h3>
                  <ul className="space-y-2 list-none pl-0"> {/* Ensure no default list styling */}
                    {analysis.pros.slice(0, 3).map((pro, idx) => (
                      <li key={`pro-${idx}`} className="flex items-start">
                        <span className="text-green-600 mr-2 mt-1">✓</span> {/* Adjusted alignment */}
                        <span className="text-gray-700">{pro}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {/* Cons */}
              {Array.isArray(analysis.cons) && analysis.cons.length > 0 && (
                <div className="bg-red-50 p-6 rounded-xl">
                  <h3 className="text-lg font-semibold text-red-800 mb-4">Cons</h3>
                  <ul className="space-y-2 list-none pl-0"> {/* Ensure no default list styling */}
                    {analysis.cons.slice(0, 3).map((con, idx) => (
                      <li key={`con-${idx}`} className="flex items-start">
                        <span className="text-red-600 mr-2 mt-1">×</span> {/* Adjusted alignment */}
                        <span className="text-gray-700">{con}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        )}
        {/* --- End Moved Pros & Cons Section --- */}

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Photos from Reddit</h2>
          <div className="relative">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {gridImages.map((item, index) => (
                <button
                  key={index}
                  onClick={() => handleImageClick(item)}
                  className="block group w-full cursor-pointer"
                >
                  <div className="relative aspect-square overflow-hidden rounded-lg shadow-md">
                    <img
                      src={item.image}
                      alt={item.thread.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity duration-300 flex items-end">
                      <div className="p-2 w-full text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <p className="text-sm truncate">{item.thread.title}</p>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
            
            {currentThumbnailPage > 1 && (
              <button 
                onClick={() => setCurrentThumbnailPage(prev => prev - 1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Previous page"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
            )}
            
            {redditData && currentThumbnailPage * thumbnailsPerPage < redditData.imageThreads.length && (
              <button 
                onClick={() => setCurrentThumbnailPage(prev => prev + 1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-12 bg-white p-2 rounded-full shadow-lg hover:bg-gray-50 transition-colors"
                aria-label="Next page"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            )}
          </div>
        </section>

        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-6">Community Discussions</h2>
          <div className="space-y-4">
            {discussions
              .slice((currentDiscussionPage - 1) * threadsPerPage, currentDiscussionPage * threadsPerPage)
              .map((item, index) => (
                <button 
                  key={index}
                  onClick={() => handleThreadClick(item)}
                  className="block w-full text-left bg-white rounded-xl border border-gray-200 p-4 hover:border-gray-300 hover:shadow-md transition-all"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {item.thread.title}
                      </h3>
                      
                      <div className="flex items-center gap-4 text-sm text-gray-500 mb-3">
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                          </svg>
                          <span>{item.thread.score} points</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                          </svg>
                          <span>{item.thread.numComments} comments</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-gray-500">by u/{item.thread.author}</span>
                        </div>
                      </div>

                      {item.thread.selftext && (
                        <div className="text-sm text-gray-600 line-clamp-3 mb-3">
                          {item.thread.selftext}
                        </div>
                      )}

                      {item.thread.comments?.[0] && (
                        <div className="text-sm bg-gray-50 p-3 rounded-lg">
                          <p className="text-gray-500 mb-1">Top comment:</p>
                          <p className="text-gray-600 line-clamp-2">{item.thread.comments[0].body}</p>
                        </div>
                      )}
                    </div>

                    {item.image && (
                      <div className="flex-shrink-0 w-24 h-24 rounded-lg overflow-hidden">
                        <img 
                          src={item.image} 
                          alt={item.thread.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                  </div>
                </button>
            ))}
          </div>
          
          {/* Pagination - Updated Logic */}
          {discussions.length > threadsPerPage && (
            (() => { // IIFE to calculate totalPages once
              const totalPages = Math.ceil(discussions.length / threadsPerPage);
              const paginationNumbers = generatePagination(currentDiscussionPage, totalPages);

              return (
                <div className="mt-8 flex justify-center items-center gap-2 flex-wrap"> {/* Reduced gap, allow wrap */} 
                  {/* Previous Button */}
                  <button
                    onClick={() => setCurrentDiscussionPage(prev => Math.max(1, prev - 1))}
                    disabled={currentDiscussionPage === 1}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      currentDiscussionPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                    Previous
                  </button>

                  {/* Page Numbers/Dots */}
                  <div className="flex items-center gap-1 flex-wrap"> {/* Reduced gap */} 
                    {paginationNumbers.map((page, index) =>
                      page === '...' ? (
                        <span key={`dots-${index}`} className="px-2 py-1 text-gray-500">
                          ...
                        </span>
                      ) : (
                        <button
                          key={page}
                          onClick={() => setCurrentDiscussionPage(page)}
                          className={`w-9 h-9 rounded-md flex items-center justify-center transition-colors text-sm font-medium ${
                            currentDiscussionPage === page
                              ? 'bg-black text-white'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {page}
                        </button>
                      )
                    )}
                  </div>

                  {/* Next Button */}
                  <button
                    onClick={() => setCurrentDiscussionPage(prev =>
                      Math.min(totalPages, prev + 1)
                    )}
                    disabled={currentDiscussionPage >= totalPages}
                    className={`flex items-center gap-1 px-3 py-2 rounded-lg transition-colors ${
                      currentDiscussionPage >= totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    Next
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              );
            })()
          )}
        </section>

        {/* Purchase Buttons */}
        <div className="flex justify-center items-center gap-4 mt-12"> {/* Added flex and gap */} 
          {/* Amazon Button */}
          <a
            href={`https://www.amazon.com/s?k=${encodeURIComponent(`${backpack.brand} ${backpack.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-yellow-500 text-black px-6 py-3 rounded-lg text-lg font-medium hover:bg-yellow-600 transition-colors shadow-md"
          >
            Find on Amazon
          </a>
          
          {/* Google Search Button */}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(`${backpack.brand} ${backpack.name}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg text-lg font-medium hover:bg-blue-700 transition-colors shadow-md"
          >
            Search on Google
          </a>
        </div>
      </div>

      {/* Enhanced Full-size Image Modal with Gallery - Ensure this section is correctly closed */} 
      {selectedImage && threadImages.length > 0 && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center p-4"
          onClick={() => {
            setSelectedImage(null);
            setThreadImages([]);
            setCurrentImageIndex(0);
          }}
        >
          <div className="max-w-7xl w-full h-[90vh] relative flex flex-col items-center justify-center">
            <button
              onClick={() => {
                setSelectedImage(null);
                setThreadImages([]);
                setCurrentImageIndex(0);
              }}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-4xl"
            >
              ×
            </button>

            <div className="w-full h-full flex gap-4" onClick={(e) => e.stopPropagation()}>
              <div className="flex-1 flex flex-col">
                <div className="relative inline-block max-h-[70vh] w-full flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
                  {threadImages.length > 1 && (
                    <>
                      <button
                        onClick={handlePrevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
                      >
                        <ChevronLeft className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleNextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 bg-black bg-opacity-50 hover:bg-opacity-75 text-white p-2 rounded-full"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </button>
                    </>
                  )}
                  <img
                    src={threadImages[currentImageIndex].image}
                    alt={threadImages[currentImageIndex].thread.title}
                    className="max-h-[70vh] max-w-full object-contain"
                    loading="lazy"
                  />
                </div>

                {/* Thumbnails - Reverted to standard image loading */}
                {threadImages.length > 1 && (
                  <div className="mt-4 flex flex-wrap gap-2 max-w-full p-2 justify-center">
                    {threadImages.map((img, idx) => (
                      <button
                        key={idx}
                        onClick={() => setCurrentImageIndex(idx)}
                        className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-all ${
                          idx === currentImageIndex ? 'border-blue-500 scale-110' : 'border-transparent hover:border-gray-300'
                        }`}
                        aria-label={`Thumbnail ${idx + 1} for ${img.thread.title}`}
                      >
                        <img
                          src={img.image}
                          alt={`Thumbnail ${idx + 1}`}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="w-96 bg-white/10 backdrop-blur-md p-6 rounded-lg overflow-y-auto">
                <div className="space-y-6 text-white">
                  <a 
                    href={threadImages[currentImageIndex].thread.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block group"
                    onClick={e => e.stopPropagation()}
                  >
                    <h3 className="text-xl font-semibold group-hover:text-blue-400 transition-colors">
                      {threadImages[currentImageIndex].thread.title}
                    </h3>
                  </a>

                  <div className="flex items-center gap-4 text-sm text-gray-200">
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2 10.5a1.5 1.5 0 113 0v6a1.5 1.5 0 01-3 0v-6zM6 10.333v5.43a2 2 0 001.106 1.79l.05.025A4 4 0 008.943 18h5.416a2 2 0 001.962-1.608l1.2-6A2 2 0 0015.56 8H12V4a2 2 0 00-2-2 1 1 0 00-1 1v.667a4 4 0 01-.8 2.4L6.8 7.933a4 4 0 00-.8 2.4z" />
                      </svg>
                      <span>{threadImages[currentImageIndex].thread.score} points</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                      </svg>
                      <span>{threadImages[currentImageIndex].thread.numComments} comments</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span>by u/{threadImages[currentImageIndex].thread.author}</span>
                    </div>
                  </div>

                  {threadImages[currentImageIndex].thread.selftext && (
                    <div className="prose prose-invert">
                      <div className="text-gray-200 text-sm leading-relaxed whitespace-pre-wrap">
                        {threadImages[currentImageIndex].thread.selftext}
                      </div>
                    </div>
                  )}

                  {threadImages[currentImageIndex].thread.comments?.length > 0 && (
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold border-t border-gray-600 pt-4">Top Comments</h4>
                      {threadImages[currentImageIndex].thread.comments.map((comment, idx) => (
                        <a
                          key={idx}
                          href={threadImages[currentImageIndex].thread.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block space-y-2 bg-black/20 p-4 rounded-lg hover:bg-black/30 transition-colors"
                          onClick={e => e.stopPropagation()}
                        >
                          <div className="flex items-center gap-2 text-sm text-gray-300">
                            <span>u/{comment.author}</span>
                            <span>•</span>
                            <span>{comment.score} points</span>
                          </div>
                          <div className="text-gray-200 text-sm">
                            {comment.body}
                          </div>
                        </a>
                      ))}
                    </div>
                  )}
                </div> {/* Closing div for space-y-6 text-white */} 
              </div> {/* Closing div for w-96 bg-white/10... */} 
            </div> {/* Closing div for w-full h-full flex gap-4... */} 
          </div> {/* Closing div for max-w-7xl w-full... */} 
        </div>
      )}
    </div> // Closing div for container mx-auto...
  );
}
