import React from 'react';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import TagPicker from '../TagPicker';
import { Tag } from '../../../types';

const makeTag = (over: Partial<Tag> = {}): Tag => ({
  _id: `tag-${over.name ?? 'x'}`,
  name: 'X',
  color: '#10B981',
  ...over,
} as Tag);

const baseAvailable: Tag[] = [
  makeTag({ _id: 't1', name: 'food', color: '#FFAA00' }),
  makeTag({ _id: 't2', name: 'travel', color: '#00AAFF' }),
  makeTag({ _id: 't3', name: 'work' }),
];

const renderPicker = (over: Partial<React.ComponentProps<typeof TagPicker>> = {}) => {
  const onChange = over.onChange ?? jest.fn();
  const onCreateTag = over.onCreateTag ?? jest.fn().mockResolvedValue(makeTag({ _id: 'new', name: 'new' }));
  render(
    <TagPicker
      selectedTags={over.selectedTags ?? []}
      availableTags={over.availableTags ?? baseAvailable}
      onChange={onChange}
      onCreateTag={onCreateTag}
      disabled={over.disabled}
    />
  );
  return { onChange, onCreateTag };
};

describe('TagPicker', () => {
  it('renders the input with placeholder when no tags selected', () => {
    renderPicker();
    expect(screen.getByPlaceholderText(/type to search or create/i)).toBeInTheDocument();
  });

  it('renders selected tag chips', () => {
    renderPicker({ selectedTags: [baseAvailable[0], baseAvailable[1]] });
    expect(screen.getByText('food')).toBeInTheDocument();
    expect(screen.getByText('travel')).toBeInTheDocument();
  });

  it('removing a selected tag calls onChange without that tag', () => {
    const onChange = jest.fn();
    renderPicker({ selectedTags: [baseAvailable[0], baseAvailable[1]], onChange });
    const chip = screen.getByText('food').closest('.MuiChip-root') as HTMLElement;
    const deleteIcon = chip.querySelector('.MuiChip-deleteIcon') as HTMLElement;
    fireEvent.click(deleteIcon);
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map((t: Tag) => t._id)).toEqual(['t2']);
  });

  it('selecting an existing tag from the dropdown adds it via onChange', async () => {
    const onChange = jest.fn();
    renderPicker({ onChange });
    const input = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'food' } });
    });
    await waitFor(() => screen.getByRole('option', { name: /food/i }));
    await act(async () => {
      fireEvent.click(screen.getByRole('option', { name: /food/i }));
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange.mock.calls[0][0].map((t: Tag) => t._id)).toEqual(['t1']);
  });

  it('does not re-add a tag that is already selected (no-op via filter)', async () => {
    const onChange = jest.fn();
    renderPicker({ selectedTags: [baseAvailable[0]], onChange });
    const input = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'food' } });
    });
    // 'food' should not appear in the dropdown because it's filtered out
    await waitFor(() => {
      const foodOption = screen.queryByRole('option', { name: /^food$/i });
      expect(foodOption).toBeNull();
    });
  });

  // Note: Autocomplete "Create …" option flow is exercised indirectly through
  // the filter-options branch coverage. The full UI flow is fragile to drive
  // via fireEvent due to MUI Autocomplete's internal input state — covered by
  // Playwright E2E instead.

  it('does not show Create option when typed name matches an existing tag (case-insensitive)', async () => {
    renderPicker();
    const input = screen.getByRole('combobox');
    await act(async () => {
      fireEvent.change(input, { target: { value: 'FOOD' } });
    });
    await waitFor(() => screen.getByRole('option', { name: /food/i }));
    expect(screen.queryByText(/Create "FOOD"/)).toBeNull();
  });

  it('shows "Max 10 tags" label when at the limit', () => {
    const selectedTags = Array.from({ length: 10 }, (_, i) => makeTag({ _id: `t${i}`, name: `tag${i}` }));
    renderPicker({ selectedTags });
    expect(screen.getByLabelText(/Max 10 tags/)).toBeInTheDocument();
  });

  it('input renders as disabled when at the 10-tag limit', () => {
    const selectedTags = Array.from({ length: 10 }, (_, i) => makeTag({ _id: `t${i}`, name: `tag${i}` }));
    renderPicker({ selectedTags });
    expect(screen.getByRole('combobox')).toBeDisabled();
  });

  it('hides the input entirely when the picker is disabled', () => {
    renderPicker({ selectedTags: [baseAvailable[0]], disabled: true });
    expect(screen.queryByPlaceholderText(/type to search or create/i)).toBeNull();
    expect(screen.getByText('food')).toBeInTheDocument(); // chip still shown
    // chip cannot be removed when disabled
    const chip = screen.getByText('food').closest('.MuiChip-root') as HTMLElement;
    expect(chip.querySelector('.MuiChip-deleteIcon')).toBeNull();
  });
});
