import { useState, useEffect, useCallback } from 'react';
import { Tag } from '../types';
import { getTags, createTag, updateTag, deleteTag } from '../services/api';

export function useTags() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchTags = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTags();
      setTags(data);
    } catch {
      setError('Failed to load tags');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTags();
  }, [fetchTags]);

  const addTag = useCallback(async (name: string, color?: string): Promise<Tag> => {
    const tag = await createTag({ name, color });
    setTags((prev) => [...prev, tag]);
    return tag;
  }, []);

  const renameTag = useCallback(async (id: string, name: string): Promise<void> => {
    const updated = await updateTag(id, { name });
    setTags((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }, []);

  const recolorTag = useCallback(async (id: string, color: string): Promise<void> => {
    const updated = await updateTag(id, { color });
    setTags((prev) => prev.map((t) => (t._id === id ? updated : t)));
  }, []);

  const removeTag = useCallback(async (id: string): Promise<void> => {
    await deleteTag(id);
    setTags((prev) => prev.filter((t) => t._id !== id));
  }, []);

  return { tags, loading, error, fetchTags, addTag, renameTag, recolorTag, removeTag };
}
