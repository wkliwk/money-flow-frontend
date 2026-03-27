import { useState, useCallback, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { getTemplates, createTemplate, deleteTemplate as deleteTemplateAPI, APITemplate } from '../services/api';

export interface TransactionTemplate {
  id: string;
  label: string;
  item?: string;
  description: string;
  type: TransactionType;
  category: string;
  defaultAmount?: number;
}

const KEY = 'money_flow_templates';

function loadLocal(): TransactionTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocal(templates: TransactionTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {}
}

function apiToLocal(t: APITemplate): TransactionTemplate {
  return {
    id: t._id,
    label: t.name,
    item: t.item,
    description: t.description || '',
    type: (t.type as TransactionType) || 'expense',
    category: t.category || '',
    defaultAmount: t.amount > 0 ? t.amount : undefined,
  };
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>(loadLocal);
  const migrated = useRef(false);

  // Fetch from API on mount, migrate localStorage if needed
  useEffect(() => {
    getTemplates()
      .then(async (apiTemplates) => {
        const fromApi = apiTemplates.map(apiToLocal);
        setTemplates(fromApi);
        saveLocal(fromApi);

        // Migrate localStorage templates to API (one-time)
        if (!migrated.current) {
          migrated.current = true;
          const local = loadLocal();
          const apiIds = new Set(fromApi.map((t) => t.id));
          const toMigrate = local.filter((t) => !apiIds.has(t.id));
          for (const t of toMigrate) {
            try {
              await createTemplate({
                name: t.label,
                amount: t.defaultAmount || 0,
                category: t.category,
                description: t.description,
                type: t.type,
                item: t.item,
                frequency: 'monthly',
              });
            } catch {
              // Migration failed for this template — skip
            }
          }
          if (toMigrate.length > 0) {
            // Re-fetch to get migrated templates with proper IDs
            const updated = await getTemplates();
            const refreshed = updated.map(apiToLocal);
            setTemplates(refreshed);
            saveLocal(refreshed);
          }
        }
      })
      .catch(() => {
        // API unavailable — use localStorage fallback
      });
  }, []);

  const addTemplate = useCallback(async (t: Omit<TransactionTemplate, 'id'>) => {
    // Optimistic local update
    const tempId = String(Date.now());
    const optimistic = { ...t, id: tempId };
    setTemplates((prev) => {
      const next = [...prev, optimistic];
      saveLocal(next);
      return next;
    });

    try {
      const created = await createTemplate({
        name: t.label,
        amount: t.defaultAmount || 0,
        category: t.category,
        description: t.description,
        type: t.type,
        item: t.item,
        frequency: 'monthly',
      });
      // Replace temp ID with real ID
      setTemplates((prev) => {
        const next = prev.map((tmpl) => tmpl.id === tempId ? apiToLocal(created) : tmpl);
        saveLocal(next);
        return next;
      });
    } catch {
      // API failed — keep local version with temp ID
    }
  }, []);

  const removeTemplate = useCallback(async (id: string) => {
    // Optimistic local update
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      saveLocal(next);
      return next;
    });

    try {
      await deleteTemplateAPI(id);
    } catch {
      // API failed — item already removed from UI
    }
  }, []);

  return { templates, addTemplate, deleteTemplate: removeTemplate };
}
