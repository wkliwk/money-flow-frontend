import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  List,
  ListItem,
  CircularProgress,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import { getContacts, createContact, updateContact, deleteContact, Contact } from '../../services/api';

const ContactsSection: React.FC = () => {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(false);
  const [addName, setAddName] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');

  const refresh = useCallback(async () => {
    try {
      const data = await getContacts();
      setContacts(data);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleAdd = async () => {
    if (!addName.trim()) return;
    setLoading(true);
    try {
      await createContact({ name: addName.trim(), email: addEmail.trim() || undefined });
      setAddName('');
      setAddEmail('');
      setShowAddForm(false);
      refresh();
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (c: Contact) => {
    setEditingId(c._id);
    setEditName(c.name);
    setEditEmail(c.email ?? '');
  };

  const saveEdit = async () => {
    if (!editingId || !editName.trim()) return;
    try {
      await updateContact(editingId, {
        name: editName.trim(),
        email: editEmail.trim() || null,
      });
      setEditingId(null);
      refresh();
    } catch {
      // silently fail
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteContact(id);
      refresh();
    } catch {
      // silently fail
    }
  };

  return (
    <Box>
      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
        People you split or share expenses with. No MoneyFlow account needed.
      </Typography>

      {contacts.length > 0 && (
        <List disablePadding sx={{ mb: 1 }}>
          {contacts.map((c) => (
            <ListItem key={c._id} disableGutters sx={{ py: 0.5, gap: 0.5, alignItems: 'flex-start' }}>
              <PersonIcon sx={{ fontSize: 16, color: 'text.disabled', mt: 0.5 }} />
              {editingId === c._id ? (
                <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                  <TextField
                    size="small"
                    autoFocus
                    placeholder="Name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.6 } }}
                  />
                  <TextField
                    size="small"
                    placeholder="Email (optional)"
                    value={editEmail}
                    onChange={(e) => setEditEmail(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') saveEdit(); if (e.key === 'Escape') setEditingId(null); }}
                    sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.6 } }}
                  />
                </Box>
              ) : (
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontSize: '0.85rem', fontWeight: 500 }}>{c.name}</Typography>
                  {c.email && (
                    <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled' }}>{c.email}</Typography>
                  )}
                </Box>
              )}
              {editingId === c._id ? (
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  <IconButton size="small" onClick={saveEdit} sx={{ color: 'success.main' }}>
                    <CheckIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => setEditingId(null)}>
                    <CloseIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 0.25 }}>
                  <IconButton size="small" onClick={() => startEdit(c)} sx={{ color: 'text.disabled' }}>
                    <EditIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(c._id)} sx={{ color: 'text.disabled' }}>
                    <DeleteIcon sx={{ fontSize: 15 }} />
                  </IconButton>
                </Box>
              )}
            </ListItem>
          ))}
        </List>
      )}

      {contacts.length === 0 && !showAddForm && (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontStyle: 'italic', mb: 1.5 }}>
          No contacts yet.
        </Typography>
      )}

      {showAddForm ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          <TextField
            size="small"
            autoFocus
            placeholder="Name *"
            value={addName}
            onChange={(e) => setAddName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
            disabled={loading}
          />
          <TextField
            size="small"
            placeholder="Email (optional)"
            value={addEmail}
            onChange={(e) => setAddEmail(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') setShowAddForm(false); }}
            sx={{ '& .MuiInputBase-input': { fontSize: '0.82rem', py: 0.75 } }}
            disabled={loading}
          />
          <Box sx={{ display: 'flex', gap: 0.75 }}>
            <IconButton
              size="small"
              onClick={handleAdd}
              disabled={loading || !addName.trim()}
              sx={{ bgcolor: 'primary.main', color: 'white', borderRadius: 1, '&:hover': { bgcolor: 'primary.dark' }, '&:disabled': { bgcolor: 'action.disabledBackground' } }}
            >
              {loading ? <CircularProgress size={14} color="inherit" /> : <CheckIcon sx={{ fontSize: 16 }} />}
            </IconButton>
            <IconButton size="small" onClick={() => { setShowAddForm(false); setAddName(''); setAddEmail(''); }}>
              <CloseIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        </Box>
      ) : (
        <IconButton
          size="small"
          onClick={() => setShowAddForm(true)}
          sx={{ color: 'primary.main', border: '1px dashed', borderColor: 'primary.light', borderRadius: 1, px: 1.5, gap: 0.5, fontSize: '0.78rem' }}
        >
          <AddIcon sx={{ fontSize: 16 }} />
          <Typography sx={{ fontSize: '0.78rem', color: 'primary.main' }}>Add contact</Typography>
        </IconButton>
      )}
    </Box>
  );
};

export default ContactsSection;
