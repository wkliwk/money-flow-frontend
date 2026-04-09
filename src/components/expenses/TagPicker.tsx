import React, { useState, useRef } from 'react';
import {
  Box,
  Chip,
  TextField,
  Autocomplete,
  Typography,
  createFilterOptions,
} from '@mui/material';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import { Tag } from '../../types';

const MAX_TAGS_PER_TRANSACTION = 10;

interface Props {
  selectedTags: Tag[];
  availableTags: Tag[];
  onChange: (tags: Tag[]) => void;
  onCreateTag: (name: string) => Promise<Tag>;
  disabled?: boolean;
}

interface TagOption {
  _id: string;
  name: string;
  color?: string;
  inputValue?: string;
}

const filter = createFilterOptions<TagOption>();

const TagPicker: React.FC<Props> = ({ selectedTags, availableTags, onChange, onCreateTag, disabled }) => {
  const [inputValue, setInputValue] = useState('');
  const [creating, setCreating] = useState(false);
  const creatingRef = useRef(false);

  const options: TagOption[] = availableTags.map((t) => ({
    _id: t._id,
    name: t.name,
    color: t.color,
  }));

  const handleChange = async (_: React.SyntheticEvent, newValue: TagOption | null) => {
    if (!newValue) return;

    if (newValue.inputValue) {
      // User wants to create a new tag inline
      if (creatingRef.current) return;
      creatingRef.current = true;
      setCreating(true);
      try {
        const created = await onCreateTag(newValue.inputValue.trim());
        onChange([...selectedTags, created]);
      } finally {
        setCreating(false);
        creatingRef.current = false;
      }
      setInputValue('');
      return;
    }

    // Existing tag selected
    const alreadySelected = selectedTags.some((t) => t._id === newValue._id);
    if (!alreadySelected && selectedTags.length < MAX_TAGS_PER_TRANSACTION) {
      const original = availableTags.find((t) => t._id === newValue._id);
      if (original) {
        onChange([...selectedTags, original]);
      }
    }
    setInputValue('');
  };

  const handleRemove = (id: string) => {
    onChange(selectedTags.filter((t) => t._id !== id));
  };

  const atLimit = selectedTags.length >= MAX_TAGS_PER_TRANSACTION;

  return (
    <Box>
      {selectedTags.length > 0 && (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
          {selectedTags.map((tag) => (
            <Chip
              key={tag._id}
              label={tag.name}
              size="small"
              onDelete={disabled ? undefined : () => handleRemove(tag._id)}
              sx={{
                fontSize: '0.72rem',
                height: 24,
                bgcolor: tag.color ? `${tag.color}22` : undefined,
                borderColor: tag.color ?? undefined,
                color: tag.color ?? undefined,
                border: '1px solid',
                fontWeight: 500,
              }}
              icon={<LocalOfferIcon sx={{ fontSize: '12px !important', color: `${tag.color} !important` }} />}
            />
          ))}
        </Box>
      )}
      {!disabled && (
        <Autocomplete<TagOption, false, false, false>
          options={options.filter((o) => !selectedTags.some((s) => s._id === o._id))}
          getOptionLabel={(option) => option.inputValue ?? option.name}
          inputValue={inputValue}
          onInputChange={(_, val) => setInputValue(val)}
          onChange={handleChange}
          value={null}
          disabled={atLimit || creating}
          filterOptions={(opts, params) => {
            const filtered = filter(opts, params);
            const { inputValue: iv } = params;
            const trimmed = iv.trim();
            if (
              trimmed &&
              !opts.some((o) => o.name.toLowerCase() === trimmed.toLowerCase()) &&
              !selectedTags.some((t) => t.name.toLowerCase() === trimmed.toLowerCase())
            ) {
              filtered.push({ _id: '__new__', name: `Create "${trimmed}"`, inputValue: trimmed });
            }
            return filtered;
          }}
          renderOption={(props, option) => (
            <li {...props} key={option._id}>
              {option._id === '__new__' ? (
                <Typography variant="body2" color="primary">
                  {option.name}
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {option.color && (
                    <Box
                      sx={{
                        width: 10,
                        height: 10,
                        borderRadius: '50%',
                        bgcolor: option.color,
                        flexShrink: 0,
                      }}
                    />
                  )}
                  <Typography variant="body2">{option.name}</Typography>
                </Box>
              )}
            </li>
          )}
          renderInput={(params) => (
            <TextField
              {...params}
              size="small"
              label={atLimit ? `Max ${MAX_TAGS_PER_TRANSACTION} tags` : 'Add tag'}
              placeholder={atLimit ? '' : 'Type to search or create…'}
              InputProps={{
                ...params.InputProps,
                startAdornment: (
                  <>
                    <LocalOfferIcon sx={{ fontSize: 16, color: 'text.disabled', mr: 0.5 }} />
                    {params.InputProps.startAdornment}
                  </>
                ),
              }}
            />
          )}
          noOptionsText="No tags — type to create one"
          clearOnBlur
          handleHomeEndKeys
          selectOnFocus
        />
      )}
    </Box>
  );
};

export default TagPicker;
