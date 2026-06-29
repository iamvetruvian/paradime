import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import MoviePage from './pages/MoviePage';
import TvPage from './pages/TvPage';
import SearchPage from './pages/SearchPage';
import MediaPage from './pages/MediaPage';
import HistoryPage from './pages/HistoryPage';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/movie/:id" element={<MoviePage />} />
      <Route path="/tv/:id" element={<TvPage />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/play" element={<MediaPage />} />
      <Route path="/history" element={<HistoryPage />} />
    </Routes>
  );
}
