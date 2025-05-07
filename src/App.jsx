import { useState, useEffect } from 'react';

function App() {
  const [backpacks, setBackpacks] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('/onebag-explorer/data/reddit_data/backpacks.json')
      .then(response => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(data => {
        setBackpacks(data.backpacks);
      })
      .catch(error => {
        console.error('Error fetching backpacks:', error);
        setError(error.message);
      });
  }, []);

  if (error) {
    return <div>Error loading backpacks: {error}</div>;
  }

  return (
    <div>
      <h1>Onebag Explorer</h1>
      <div className="backpack-grid">
        {backpacks.map(backpack => (
          <div key={backpack.name} className="backpack-card">
            <h2>{backpack.name}</h2>
            <p>{backpack.description}</p>
            <p>Capacity: {backpack.capacity}</p>
            <p>Price: {backpack.price}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App; 