'use client';
import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import { useAuth, useUser } from '@clerk/nextjs';
import { API_URL } from '../../constants';
import { Album } from '../../types';
import { SkeletonTable } from '../../components/Table/Skeleton';
import { useScrollToTop } from '../../utils';
import { createAuthenticatedClient } from '../../lib/auth-api';

type RankedAlbum = Album & { rank: number };

const TopAlbumsPage = () => {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [albums, setAlbums] = useState<RankedAlbum[]>([]);
  const [initialOrder, setInitialOrder] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const dragIndex = useRef<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  useScrollToTop();

  useEffect(() => {
    const fetchTopAlbums = async () => {
      try {
        setIsLoading(true);
        const response = await axios.get(`${API_URL}/top-albums`);
        const fetched: RankedAlbum[] = response.data.albums ?? [];
        setAlbums(fetched);
        setInitialOrder(fetched.map((a) => a._id));
      } catch (err) {
        console.error('Error fetching top albums:', err);
        setError('Failed to load top albums');
      } finally {
        setIsLoading(false);
      }
    };
    fetchTopAlbums();
  }, []);

  const isDirty =
    albums.length === initialOrder.length &&
    albums.some((album, index) => album._id !== initialOrder[index]);

  const handleDragStart = (index: number) => () => {
    dragIndex.current = index;
    setSuccessMessage(null);
    setError(null);
  };

  const handleDragOver =
    (index: number) => (event: React.DragEvent<HTMLLIElement>) => {
      event.preventDefault();
      if (dragOverIndex !== index) {
        setDragOverIndex(index);
      }
    };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  const handleDrop = (index: number) => (event: React.DragEvent<HTMLLIElement>) => {
    event.preventDefault();
    const from = dragIndex.current;
    dragIndex.current = null;
    setDragOverIndex(null);
    if (from === null || from === index) return;

    setAlbums((prev) => {
      const next = [...prev];
      const [moved] = next.splice(from, 1);
      next.splice(index, 0, moved);
      return next.map((album, i) => ({ ...album, rank: i + 1 }));
    });
  };

  const handleDragEnd = () => {
    dragIndex.current = null;
    setDragOverIndex(null);
  };

  const handleSave = async () => {
    if (!isDirty) return;
    try {
      setIsSaving(true);
      setError(null);
      setSuccessMessage(null);
      const client = await createAuthenticatedClient(getToken);
      const albumIds = albums.map((album) => album._id);
      await client.put(`${API_URL}/top-albums`, { albumIds });
      setInitialOrder(albumIds);
      setSuccessMessage('Top albums order saved');
    } catch (err) {
      const message =
        axios.isAxiosError(err) && err.response?.data?.message
          ? err.response.data.message
          : 'Failed to save top albums order';
      setError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setAlbums((prev) => {
      const byId = new Map(prev.map((a) => [a._id, a]));
      return initialOrder
        .map((id) => byId.get(id))
        .filter((a): a is RankedAlbum => Boolean(a))
        .map((album, i) => ({ ...album, rank: i + 1 }));
    });
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="layout-container">
      <section className="layout-section">
        <div className="layout-header text-center">
          <h1 className="mb-component-sm">Top Albums</h1>
          <p className="text-neutral-600 max-w-md mx-auto">
            Drag and drop to reorder your top gold-rated albums, then save to
            update the rankings.
          </p>
        </div>

        <div className="layout-flex-between mx-4 mb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={handleSave}
              className="btn-search-primary"
              disabled={!isSignedIn || !isDirty || isSaving || isLoading}
            >
              {isSaving ? 'Saving...' : 'Save order'}
            </button>
            {isDirty && !isSaving && (
              <button onClick={handleReset} className="btn-link-sm">
                Reset
              </button>
            )}
          </div>
          {!isSignedIn && !isLoading && (
            <span className="text-sm text-neutral-500">
              Sign in to save changes
            </span>
          )}
        </div>

        {error && (
          <div className="mx-4 mb-4 px-4 py-2 rounded border border-red-200 bg-red-50 text-sm text-red-700">
            {error}
          </div>
        )}
        {successMessage && (
          <div className="mx-4 mb-4 px-4 py-2 rounded border border-green-200 bg-green-50 text-sm text-green-700">
            {successMessage}
          </div>
        )}

        <div className="layout-content">
          {isLoading ? (
            <SkeletonTable cols={3} />
          ) : albums.length === 0 ? (
            <div className="table-empty mt-6 text-center">
              No top albums found
            </div>
          ) : (
            <ol className="mt-6 space-y-2">
              {albums.map((album, index) => (
                <li
                  key={album._id}
                  draggable={isSignedIn ?? false}
                  onDragStart={handleDragStart(index)}
                  onDragOver={handleDragOver(index)}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop(index)}
                  onDragEnd={handleDragEnd}
                  className={`flex items-center gap-4 px-4 py-3 rounded border bg-white transition-colors ${
                    dragOverIndex === index
                      ? 'border-music-500 bg-music-50'
                      : 'border-neutral-200'
                  } ${isSignedIn ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}
                >
                  <span className="w-10 text-center font-bold text-music-600 table-number">
                    {index + 1}
                  </span>
                  <span
                    aria-hidden
                    className="text-neutral-400 select-none"
                    title={isSignedIn ? 'Drag to reorder' : 'Sign in to reorder'}
                  >
                    ⋮⋮
                  </span>
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/album?id=${album._id}`}
                      className="table-link font-medium block truncate"
                    >
                      {album.displayTitle}
                    </Link>
                    <div className="text-sm text-neutral-500 truncate">
                      {album.artistDisplayName} · {album.year}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      </section>
    </div>
  );
};

export default TopAlbumsPage;
