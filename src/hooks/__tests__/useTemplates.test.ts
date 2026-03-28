import { renderHook, act } from '@testing-library/react';

const mockGetTemplates = jest.fn().mockResolvedValue([]);
const mockCreateTemplate = jest.fn().mockResolvedValue({ id: 'server-1', _id: 'server-1' });
const mockDeleteTemplateAPI = jest.fn().mockResolvedValue(null);

jest.mock('../../services/api', () => ({
  getTemplates: (...args: unknown[]) => mockGetTemplates(...args),
  createTemplate: (...args: unknown[]) => mockCreateTemplate(...args),
  deleteTemplateAPI: (...args: unknown[]) => mockDeleteTemplateAPI(...args),
}));

import { useTemplates } from '../useTemplates';

describe('useTemplates', () => {
  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
    mockGetTemplates.mockResolvedValue([]);
    mockCreateTemplate.mockResolvedValue({ id: 'server-1', _id: 'server-1' });
    mockDeleteTemplateAPI.mockResolvedValue(null);
  });

  it('starts with empty templates', () => {
    const { result } = renderHook(() => useTemplates());
    expect(result.current.templates).toEqual([]);
  });

  it('addTemplate adds a template with generated id', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => {
      result.current.addTemplate({
        label: 'Coffee',
        description: 'Morning coffee',
        type: 'expense',
        category: 'Food & Drink',
      });
    });
    expect(result.current.templates).toHaveLength(1);
    expect(result.current.templates[0].label).toBe('Coffee');
    expect(result.current.templates[0].id).toBeDefined();
  });

  it('addTemplate calls createTemplate API', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => {
      result.current.addTemplate({
        label: 'Coffee',
        description: 'Morning coffee',
        type: 'expense',
        category: 'Food & Drink',
      });
    });
    expect(mockCreateTemplate).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Coffee', category: 'Food & Drink' })
    );
  });

  it('deleteTemplate removes template by id', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => {
      result.current.addTemplate({
        label: 'Lunch',
        description: '',
        type: 'expense',
        category: 'Food & Drink',
      });
    });
    const id = result.current.templates[0].id;
    act(() => {
      result.current.deleteTemplate(id);
    });
    expect(result.current.templates).toHaveLength(0);
  });

  it('deleteTemplate calls deleteTemplateAPI', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => {
      result.current.addTemplate({
        label: 'Lunch',
        description: '',
        type: 'expense',
        category: 'Food & Drink',
      });
    });
    const id = result.current.templates[0].id;
    act(() => {
      result.current.deleteTemplate(id);
    });
    expect(mockDeleteTemplateAPI).toHaveBeenCalledWith(id);
  });

  it('persists templates to localStorage', () => {
    const { result } = renderHook(() => useTemplates());
    act(() => {
      result.current.addTemplate({
        label: 'Taxi',
        description: '',
        type: 'expense',
        category: 'Transport',
      });
    });
    const stored = JSON.parse(localStorage.getItem('money_flow_templates') || '[]');
    expect(stored[0].label).toBe('Taxi');
  });

  it('loads templates from localStorage on mount', () => {
    localStorage.setItem(
      'money_flow_templates',
      JSON.stringify([{ id: '1', label: 'Saved', description: '', type: 'expense', category: 'Other' }])
    );
    const { result } = renderHook(() => useTemplates());
    expect(result.current.templates[0].label).toBe('Saved');
  });
});
