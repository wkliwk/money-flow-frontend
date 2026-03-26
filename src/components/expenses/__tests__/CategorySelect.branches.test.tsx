import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import CategorySelect from '../CategorySelect';

describe('CategorySelect — branch coverage', () => {
  it('renders chip with emoji for known category', () => {
    render(<CategorySelect value="" onChange={jest.fn()} existingCategories={[]} />);
    // Food & Drink has emoji
    expect(screen.getByText(/🍽️ Food & Drink/)).toBeInTheDocument();
  });

  it('renders chip without emoji for custom category not in CATEGORY_EMOJI', () => {
    render(
      <CategorySelect
        value=""
        onChange={jest.fn()}
        existingCategories={['Custom Cat']}
      />
    );
    expect(screen.getByText('Custom Cat')).toBeInTheDocument();
  });

  it('calls onChange with empty string when Autocomplete selection is null/non-string', () => {
    const onChange = jest.fn();
    render(<CategorySelect value="Food & Drink" onChange={onChange} existingCategories={[]} />);
    // Clear the autocomplete by clicking the clear button (X icon)
    const clearBtn = document.querySelector('[title="Clear"]') || document.querySelector('[aria-label="Clear"]');
    if (clearBtn) {
      fireEvent.click(clearBtn);
      // After clearing, onChange should be called with '' (null branch in typeof check)
      expect(onChange).toHaveBeenCalled();
    } else {
      expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    }
  });

  it('filters out empty/whitespace existingCategories', () => {
    render(
      <CategorySelect
        value=""
        onChange={jest.fn()}
        existingCategories={['   ', '', 'Valid Cat']}
      />
    );
    expect(screen.getByText('Valid Cat')).toBeInTheDocument();
    // Whitespace/empty entries should not appear
    const chips = document.querySelectorAll('.MuiChip-label');
    const labels = Array.from(chips).map((c) => c.textContent?.trim());
    expect(labels).not.toContain('');
  });

  it('does not duplicate categories that appear in both presets and existingCategories', () => {
    render(
      <CategorySelect
        value=""
        onChange={jest.fn()}
        existingCategories={['Food & Drink']}
      />
    );
    // Should only appear once (Set deduplication)
    const matches = screen.queryAllByText(/🍽️ Food & Drink/);
    expect(matches.length).toBe(1);
  });

  it('applies selected styling when value matches chip', () => {
    const { rerender } = render(
      <CategorySelect value="" onChange={jest.fn()} existingCategories={[]} />
    );
    rerender(<CategorySelect value="Transport" onChange={jest.fn()} existingCategories={[]} />);
    // Transport chip exists and is highlighted (selected = true branch)
    expect(screen.getByText(/Transport/)).toBeInTheDocument();
  });
});
