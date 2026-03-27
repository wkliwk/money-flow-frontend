import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import CheckIcon from '@mui/icons-material/Check';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonIcon from '@mui/icons-material/Person';
import {
  sendFriendRequest,
  getFriends,
  getPendingRequests,
  acceptFriend,
  rejectFriend,
  removeFriend,
  Friend,
  FriendRequest,
} from '../../services/api';

const FriendsSection: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<FriendRequest[]>([]);
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const refresh = useCallback(async () => {
    try {
      const [f, p] = await Promise.all([getFriends(), getPendingRequests()]);
      setFriends(f);
      setPending(p);
    } catch {
      // Silently fail on initial load — API may not be deployed yet
    }
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const handleSendRequest = async () => {
    if (!email.trim()) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await sendFriendRequest(email.trim());
      setSuccess(`Friend request sent to ${email}`);
      setEmail('');
      refresh();
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Failed to send request');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (id: string) => {
    try {
      await acceptFriend(id);
      refresh();
    } catch {
      setError('Failed to accept request');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectFriend(id);
      refresh();
    } catch {
      setError('Failed to reject request');
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeFriend(id);
      refresh();
    } catch {
      setError('Failed to remove friend');
    }
  };

  return (
    <Box>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 0.5 }}>
        Friends
      </Typography>
      <Typography sx={{ fontSize: '0.72rem', color: 'text.disabled', mb: 1.5 }}>
        Connect with other Money Flow users to share split expenses.
      </Typography>

      {error && <Alert severity="error" sx={{ mb: 1.5, fontSize: '0.78rem' }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 1.5, fontSize: '0.78rem' }} onClose={() => setSuccess('')}>{success}</Alert>}

      {/* Add friend */}
      <Box sx={{ display: 'flex', gap: 0.75, mb: 1.5 }}>
        <TextField
          size="small"
          placeholder="Friend's email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSendRequest(); }}
          sx={{ flex: 1, '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.75 } }}
          disabled={loading}
        />
        <Button
          size="small"
          variant="contained"
          onClick={handleSendRequest}
          disabled={loading || !email.trim()}
          sx={{ minWidth: 40, px: 1 }}
        >
          {loading ? <CircularProgress size={16} /> : <AddIcon sx={{ fontSize: 18 }} />}
        </Button>
      </Box>

      {/* Pending requests */}
      {pending.length > 0 && (
        <Box sx={{ mb: 1.5 }}>
          <Typography variant="caption" sx={{ fontSize: '0.68rem', color: 'warning.main', fontWeight: 600, display: 'block', mb: 0.5 }}>
            {pending.length} pending request{pending.length > 1 ? 's' : ''}
          </Typography>
          <List disablePadding>
            {pending.map((req) => (
              <ListItem key={req.id} disableGutters sx={{ py: 0.5, gap: 0.5 }}>
                <PersonIcon sx={{ fontSize: 16, color: 'text.disabled' }} />
                <ListItemText
                  primary={<Typography sx={{ fontSize: '0.82rem' }}>{req.email}</Typography>}
                />
                <IconButton size="small" onClick={() => handleAccept(req.id)} sx={{ color: 'success.main' }}>
                  <CheckIcon sx={{ fontSize: 16 }} />
                </IconButton>
                <IconButton size="small" onClick={() => handleReject(req.id)} sx={{ color: 'error.main' }}>
                  <CloseIcon sx={{ fontSize: 16 }} />
                </IconButton>
              </ListItem>
            ))}
          </List>
        </Box>
      )}

      {/* Friends list */}
      {friends.length > 0 ? (
        <List disablePadding>
          {friends.map((f) => (
            <ListItem key={f.id} disableGutters sx={{ py: 0.5 }}>
              <Chip
                label={f.email}
                size="small"
                onDelete={() => handleRemove(f.id)}
                deleteIcon={<DeleteIcon sx={{ fontSize: '14px !important' }} />}
                sx={{ fontSize: '0.78rem', height: 28 }}
              />
            </ListItem>
          ))}
        </List>
      ) : (
        <Typography sx={{ fontSize: '0.75rem', color: 'text.disabled', fontStyle: 'italic' }}>
          No friends yet — add someone by email above.
        </Typography>
      )}
    </Box>
  );
};

export default FriendsSection;
