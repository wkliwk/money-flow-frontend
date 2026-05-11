import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import TagPicker from '../TagPicker';
import type { Tag } from '../../../types';

describe('TagPicker', () => {
  it('creates a new tag from the autocomplete list', async () => {
    const onChange = jest.fn();
    const onCreateTag = jest.fn().mockResolvedValue({
      _id: 'tag-2',
      name: 'Travel',
      color: '#123456',
    } as Tag);

    render(
      <TagPicker
        selectedTags={[]}
        availableTags={[]}
        onChange={onChange}
        onCreateTag={onCreateTag}
      />,
    );

    const input = screen.getByRole('combobox');
    await userEvent.type(input, 'Travel');

    const createOption = await screen.findByText('Create "Travel"');
    await userEvent.click(createOption);

    await waitFor(() => {
      expect(onCreateTag).toHaveBeenCalledWith('Travel');
    });

    await waitFor(() => {
      expect(onChange).toHaveBeenCalledWith([
        {
          _id: 'tag-2',
          name: 'Travel',
          color: '#123456',
        },
      ]);
    });
  });
});
