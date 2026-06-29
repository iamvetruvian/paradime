import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';

export default function Navbar() {
  const user = useAuth();
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleSearch = (e) => {
    if (e.key === 'Enter' && query.trim()) {
      navigate(`/search?query=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleSearchIconClick = (e) => {
    if (window.innerWidth <= 768 && !searchExpanded) {
      e.preventDefault();
      setSearchExpanded(true);
      setTimeout(() => searchRef.current?.focus(), 50);
    }
  };

  return (
    <div className={`navbar glass${searchExpanded ? ' search-expanded' : ''}`}>
      <a className="navbar-brand" href="/">
        <img className="navbar-logo" src="/assets/logo.png" alt="Paradime" />
      </a>

      <form
        className="d-flex"
        role="search"
        onSubmit={(e) => e.preventDefault()}
        onClick={() => {
          if (window.innerWidth <= 768 && !searchExpanded) {
            setSearchExpanded(true);
            setTimeout(() => searchRef.current?.focus(), 50);
          }
        }}
      >
        <i
          className="fa-solid fa-magnifying-glass"
          onClick={handleSearchIconClick}
        />
        <input
          ref={searchRef}
          className="form-control me-2 searchbar"
          type="search"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleSearch}
          onBlur={() => {
            if (window.innerWidth <= 768) {
              setTimeout(() => setSearchExpanded(false), 150);
            }
          }}
        />
        <button
          id="reset-button"
          className="btn btn-outline"
          type="button"
          onClick={() => setQuery('')}
        >
          <i className="fa-solid fa-xmark" />
        </button>
      </form>

      {user === undefined ? null : user && user.photos?.length > 0 ? (
        <div className="profile-dropdown-container" ref={dropdownRef}>
          <button
            className="profile-pic-btn"
            onClick={(e) => {
              e.stopPropagation();
              setDropdownOpen((o) => !o);
            }}
          >
            <img
              src={user.photos[0].value}
              alt="Profile"
              referrerPolicy="no-referrer"
            />
          </button>
          <div className={`profile-dropdown-menu${dropdownOpen ? ' show' : ''}`}>
            <a href="/history">
              <i className="fa-solid fa-clock-rotate-left" /> Watch History
            </a>
            <a href="#">
              <i className="fa-solid fa-bookmark" /> Bookmarks
            </a>
            <a href="#">
              <i className="fa-solid fa-list-ul" /> Watch Lists
            </a>
            <hr style={{ borderColor: '#333', margin: '5px 0' }} />
            <a href="/logout">
              <i className="fa-solid fa-arrow-right-from-bracket" /> Logout
            </a>
          </div>
        </div>
      ) : (
        <button
          className="btn btn-outline login-btn"
          onClick={() => (window.location.href = '/auth/google')}
        >
          <i className="fa-solid fa-circle-user" />
        </button>
      )}
    </div>
  );
}
