import { useState, useCallback } from 'react';
import { TransactionType } from '../types';

export interface TransactionTemplate {
  id: string;
  label: string;
  description: string;
  type: TransactionType;
  category: string;
  defaultAmount?: number;
}

const KEY = 'money_flow_templates';

function load(): TransactionTemplate[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function save(templates: TransactionTemplate[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(templates));
  } catch {
    // storage unavailable — silently ignore
  }
}

export function useTemplates() {
  const [templates, setTemplates] = useState<TransactionTemplate[]>(load);

  const addTemplate = useCallback((t: Omit<TransactionTemplate, 'id'>) => {
    const next = [...templates, { ...t, id: String(Date.now()) }];
    setTemplates(next);
    save(next);
  }, [templates]);

  const deleteTemplate = useCallback((id: string) => {
    const next = templates.filter((t) => t.id !== id);
    setTemplates(next);
    save(next);
  }, [templates]);

  return { templates, addTemplate, deleteTemplate };
}
