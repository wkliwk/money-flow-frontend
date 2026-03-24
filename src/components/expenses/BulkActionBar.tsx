import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Typography,
  IconButton,
  Autocomplete,
  CircularProgress,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import DownloadIcon from '@mui/icons-material/Download';

interface Props {
  selectedCount: number;
  selectedIds: Set<string>;
  knownTags: string[];
  onDeleteSelected: () => Promise<void>;
  onTagSelected: (tags: string[]) => Promise<void>;
  onExportSelected: () => void;
  onClose: () => void;
}

const BulkActionBar: React.FC<Props> = ({
  selectedCount,
  selectedIds,
  knownTags,
  onDeleteSelected,
  onTagSelected,
  onExportSelected,
  onClose,
}) => {
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [tagDialog, setTagDialog] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [taggingLoading, setTaggingLoading] = useState(false);
  const [deletingLoading, setDeletingLoading] = useState(false);

  const handleDelete = async () => {
    setDeletingLoading(true);
    try {
      await onDeleteSelected();
      setDeleteConfirm(false);
      onClose();
    } finally {
      setDeletingLoading(false);
    }
  };

  const handleTag = async () => {
    setTaggingLoading(true);
    try {
      await onTagSelected(selectedTags);
      setTagDialog(false);
      onClose();
    } finally {
      setTaggingLoading(false);
    }
  };

  return (
    <>
      <Box
        sx={{
          position: 'sticky',
          bottom: 0,
          left: 0,
          right: 0,
          bgcolor: 'background.paper',
          borderTop: '1px solid rgba(148,163,184,0.1)',
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          justifyContent: 'space-between',
          zIndex: 10,
        }}
      >
        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 120 }}>
          {selectedCount} selected
        </Typography>

        <Box sx={{ display: 'flex', gap: 0.75 }}>
          <Button
            size="small"
            startIcon={<LocalOfferIcon />}
            onClick={() => setTagDialog(true)}
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          >
            Add Tags
          </Button>
          <Button
            size="small"
            startIcon={<DownloadIcon />}
            onClick={onExportSelected}
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          >
            Export
          </Button>
          <Button
            size="small"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteConfirm(true)}
            color="error"
            variant="outlined"
            sx={{ fontSize: '0.75rem' }}
          >
            Delete
          </Button>
          <IconButton size="small" onClick={onClose} sx={{ ml: 'auto' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm} onClose={() => setDeleteConfirm(false)}>
        <DialogTitle>Delete {selectedCount} transactions?</DialogTitle>
        <DialogContent>
          <Typography color="error" variant="body2" sx={{ mt: 1 }}>
            This action cannot be undone. All selected transactions will be permanently deleted.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirm(false)}>Cancel</Button>
          <Button
            color="error"
            variant="contained"
            onClick={handleDelete}
            disabled={deletingLoading}
          >
            {deletingLoading ? <CircularProgress size={16} /> : 'Delete All'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Tag Dialog */}
      <Dialog open={tagDialog} onClose={() => setTagDialog(false)} fullWidth maxWidth="sm">
        <DialogTitle>Add Tags to {selectedCount} transactions</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Autocomplete
            multiple
            freeSolo
            options={knownTags}
            value={selectedTags}
            onChange={(_, value) => setSelectedTags(value)}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip variant="outlined" label={option} {...getTagProps({ index })} />
              ))
            }
            renderInput={(params) => <TextField {...params} placeholder="Enter or select tags..." />}
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
            Tags will be added to existing tags (not replaced)
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTagDialog(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleTag} disabled={taggingLoading || selectedTags.length === 0}>
            {taggingLoading ? <CircularProgress size={16} /> : 'Add Tags'}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default BulkActionBar;
