import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import OneBagHomepage from './pages/OneBagHomepage'
import BackpackPage from './pages/BackpackPage'
import data from './data'
import './index.css'

// Debug component to show available backpacks
const Debug = () => (
  <div className="p-6">
    <h1>Available Backpacks:</h1>
    <pre>{JSON.stringify(data, null, 2)}</pre>
  </div>
);

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<OneBagHomepage />} />
        <Route path="/pack/:id" element={<BackpackPage />} />
        <Route path="/debug" element={<Debug />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
)