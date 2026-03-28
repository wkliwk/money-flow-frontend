import { useState, useCallback, useEffect, useRef } from 'react';
import { TransactionType } from '../types';
import { getTemplates, createTemplate, deleteTemplateAPI } from '../services/api';

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

function persistLocal(templates: TransactionTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {
    // storage unavailable — silently ignore
  }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>(loadLocal);
  const fetched = useRef(false);

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    getTemplates()
      .then((data) => {
        const mapped: TransactionTemplate[] = data.map((d) => ({
          id: d.id || d._id,
          label: d.label,
          item: d.item,
          description: d.description,
          type: d.type,
          category: d.category,
          defaultAmount: d.defaultAmount,
        }));
        setTemplates(mapped);
        persistLocal(mapped);
      })
      .catch(() => {/* use localStorage fallback */});
  }, []);

  const addTemplate = useCallback((t: Omit<TransactionTemplate, 'id'>) => {
    const tempId = String(Date.now());
    const newTemplate: TransactionTemplate = { ...t, id: tempId };
    setTemplates((prev) => {
      const next = [...prev, newTemplate];
      persistLocal(next);
      return next;
    });

    createTemplate({
      label: t.label,
      description: t.description,
      type: t.type,
      category: t.category,
      item: t.item,
      defaultAmount: t.defaultAmount,
    }).then((saved) => {
      setTemplates((prev) => {
        const next = prev.map((tmpl) =>
          tmpl.id === tempId ? { ...tmpl, id: saved.id || saved._id } : tmpl
        );
        persistLocal(next);
        return next;
      });
    }).catch(() => {/* keep local version */});
  }, []);

  const deleteTemplate = useCallback((id: string) => {
    setTemplates((prev) => {
      const next = prev.filter((t) => t.id !== id);
      persistLocal(next);
      return next;
    });
    deleteTemplateAPI(id).catch(() => {/* already removed locally */});
  }, []);

  return { templates, addTemplate, deleteTemplate };
}
