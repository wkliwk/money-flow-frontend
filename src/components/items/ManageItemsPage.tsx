import React, { useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  TextField,
  SvgIcon,
  Divider,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import { ITEM_PRESETS } from '../expenses/ItemPicker';
import { useItemPresets } from '../../hooks/useItemPresets';

const ManageItemsPage: React.FC = () => {
  const { presets, setPreset, deletePreset } = useItemPresets();
  const [editing, setEditing] = useState<string | null>(null);
  const [draft, setDraft] = useState('');

  const startEdit = (label: string) => {
    setEditing(label);
    setDraft(presets[label] || '');
  };

  const save = () => {
    if (editing) {
      if (draft.trim()) setPreset(editing, draft.trim());
      else deletePreset(editing);
      setEditing(null);
    }
  };

  const expenseItems = ITEM_PRESETS.filter((p) => p.type === 'expense');
  const incomeItems = ITEM_PRESETS.filter((p) => p.type === 'income');

  const renderSection = (label: string, items: typeof ITEM_PRESETS) => (
    <Box sx={{ mb: 2 }}>
      <Typography
        variant="caption"
        sx={{
          color: 'text.disabled',
          fontSize: '0.65rem',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
          display: 'block',
          mb: 1,
          px: 1,
        }}
      >
        {label}
      </Typography>
      <Box sx={{ borderRadius: 2, border: '1px solid rgba(148,163,184,0.1)', overflow: 'hidden' }}>
        {items.map((item, idx) => (
          <Box key={item.label + item.type}>
            {idx > 0 && <Divider sx={{ borderColor: 'rgba(148,163,184,0.06)' }} />}
            <Box sx={{ px: 2, py: 1.25 }}>
              {editing === item.label ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, minWidth: 60 }}>{item.label}</Typography>
                  <TextField
                    size="small"
                    autoFocus
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') save();
                      if (e.key === 'Escape') setEditing(null);
                    }}
                    placeholder={`Default description for ${item.label}`}
                    sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
                  />
                  <IconButton size="small" onClick={save} sx={{ color: '#34d399' }}>
                    <CheckIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditing(null)} sx={{ color: 'text.disabled' }}>
                    <CloseIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <SvgIcon component={() => React.cloneElement(item.icon, { sx: { fontSize: 20, color: item.color } })} />
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography sx={{ fontSize: '0.85rem', fontWeight: 600 }}>{item.label}</Typography>
                    <Typography sx={{ fontSize: '0.72rem', color: presets[item.label] ? 'text.secondary' : 'text.disabled' }}>
                      {presets[item.label] || 'No default set'}
                    </Typography>
                  </Box>
                  <IconButton
                    size="small"
                    onClick={() => startEdit(item.label)}
                    sx={{ color: 'text.disabled', '&:hover': { color: '#818cf8' } }}
                  >
                    <EditIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                  {presets[item.label] && (
                    <IconButton
                      size="small"
                      onClick={() => deletePreset(item.label)}
                      sx={{ color: 'rgba(251,113,133,0.4)', '&:hover': { color: '#fb7185' } }}
                    >
                      <DeleteIcon sx={{ fontSize: 16 }} />
                    </IconButton>
                  )}
                </Box>
              )}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );

  return (
    <Box sx={{ maxWidth: 600, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" fontWeight={700} sx={{ mb: 0.5 }}>
          Item Presets
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.82rem' }}>
          Set a default description for each item type — auto-filled when you pick that item in the add form.
        </Typography>
      </Box>
      {renderSection('Expense Items', expenseItems)}
      {renderSection('Income Items', incomeItems)}
    </Box>
  );
};

export default ManageItemsPage;
