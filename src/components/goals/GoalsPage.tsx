import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  LinearProgress,
  TextField,
  IconButton,
  InputAdornment,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SavingsIcon from '@mui/icons-material/Savings';
import EditIcon from '@mui/icons-material/Edit';
import { useGoals, Goal } from '../../hooks/useGoals';
import { useFxRates } from '../../hooks/useFxRates';

const EMOJI_OPTIONS = ['🎯', '🏠', '✈️', '💻', '🚗', '💰', '📱', '🎓', '💍', '🏋️'];

const emptyForm = () => ({ name: '', emoji: '🎯', targetAmount: '', currentAmount: '', targetDate: '' });

function daysRemaining(targetDate: string): number | null {
  if (!targetDate) return null;
  const diff = new Date(targetDate).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

const GoalsPage: React.FC = () => {
  const { goals, addGoal, updateCurrent, deleteGoal } = useGoals();
  const { symbol, convert } = useFxRates();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyForm());
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');

  const handleAdd = () => {
    const target = parseFloat(form.targetAmount);
    const current = parseFloat(form.currentAmount) || 0;
    if (!form.name.trim() || isNaN(target) || target <= 0) return;
    addGoal({
      name: form.name.trim(),
      emoji: form.emoji,
      targetAmount: target,
      currentAmount: current,
      targetDate: form.targetDate || undefined,
    });
    setForm(emptyForm());
    setShowForm(false);
  };

  const handleEditSave = (goal: Goal) => {
    const val = parseFloat(editAmount);
    if (!isNaN(val) && val >= 0) updateCurrent(goal.id, val);
    setEditingId(null);
    setEditAmount('');
  };

  if (goals.length === 0 && !showForm) {
    return (
      <Box sx={{ maxWidth: 500, mx: 'auto' }}>
        <Box sx={{ textAlign: 'center', py: 10 }}>
          <SavingsIcon sx={{ fontSize: 56, color: 'text.disabled', opacity: 0.4 }} />
          <Typography variant="h6" color="text.secondary" mt={2} fontWeight={600}>
            No goals yet
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={0.5} mb={3}>
            Add your first savings goal
          </Typography>
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setShowForm(true)}>
            Add Goal
          </Button>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 500, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight={700}>Savings Goals</Typography>
        {!showForm && (
          <Button size="small" startIcon={<AddIcon />} onClick={() => setShowForm(true)}
            sx={{ color: 'primary.main', fontSize: '0.78rem' }}>
            Add Goal
          </Button>
        )}
      </Box>

      {/* Add form */}
      {showForm && (
        <Card sx={{ mb: 2, border: '1px solid rgba(129,140,248,0.25)', background: 'rgba(30,41,59,0.8)' }}>
          <CardContent sx={{ p: 2 }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.72rem', letterSpacing: '0.04em', textTransform: 'uppercase', display: 'block', mb: 1.5 }}>
              New Goal
            </Typography>

            {/* Emoji picker */}
            <Box sx={{ display: 'flex', gap: 0.75, flexWrap: 'wrap', mb: 1.5 }}>
              {EMOJI_OPTIONS.map((e) => (
                <Box key={e} onClick={() => setForm((f) => ({ ...f, emoji: e }))}
                  sx={{ fontSize: '1.2rem', cursor: 'pointer', p: 0.5, borderRadius: 1, bgcolor: form.emoji === e ? 'rgba(129,140,248,0.2)' : 'transparent', border: '1px solid', borderColor: form.emoji === e ? 'rgba(129,140,248,0.4)' : 'transparent' }}>
                  {e}
                </Box>
              ))}
            </Box>

            <TextField
              label="Goal name"
              size="small"
              fullWidth
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              sx={{ mb: 1.5 }}
              placeholder="e.g. Emergency Fund"
            />
            <Box sx={{ display: 'flex', gap: 1, mb: 1.5 }}>
              <TextField
                label="Target (HKD)"
                type="number"
                size="small"
                fullWidth
                value={form.targetAmount}
                onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
                inputProps={{ min: 0 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>$</Typography></InputAdornment> }}
              />
              <TextField
                label="Current (HKD)"
                type="number"
                size="small"
                fullWidth
                value={form.currentAmount}
                onChange={(e) => setForm((f) => ({ ...f, currentAmount: e.target.value }))}
                inputProps={{ min: 0 }}
                InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.78rem', color: 'text.disabled' }}>$</Typography></InputAdornment> }}
              />
            </Box>
            <TextField
              label="Deadline (optional)"
              type="date"
              size="small"
              fullWidth
              value={form.targetDate}
              onChange={(e) => setForm((f) => ({ ...f, targetDate: e.target.value }))}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 1.5 }}
            />
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button size="small" onClick={() => { setShowForm(false); setForm(emptyForm()); }} sx={{ color: 'text.secondary' }}>
                Cancel
              </Button>
              <Button size="small" variant="contained" onClick={handleAdd} disabled={!form.name.trim() || !form.targetAmount} sx={{ flex: 1 }}>
                Save Goal
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {/* Goals list */}
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {goals.map((goal) => {
          const pct = Math.min((goal.currentAmount / goal.targetAmount) * 100, 100);
          const done = goal.currentAmount >= goal.targetAmount;
          const days = daysRemaining(goal.targetDate || '');
          const overdue = days !== null && days < 0;

          return (
            <Card key={goal.id} sx={{
              border: `1px solid ${done ? 'rgba(52,211,153,0.3)' : 'rgba(148,163,184,0.1)'}`,
              background: done ? 'rgba(52,211,153,0.05)' : 'rgba(30,41,59,0.5)',
            }}>
              <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography sx={{ fontSize: '1.4rem' }}>{goal.emoji || '🎯'}</Typography>
                    <Box>
                      <Typography fontWeight={700} sx={{ fontSize: '0.9rem', lineHeight: 1.2 }}>
                        {goal.name}
                      </Typography>
                      {done ? (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25 }}>
                          <CheckCircleIcon sx={{ fontSize: 13, color: '#34d399' }} />
                          <Typography sx={{ fontSize: '0.7rem', color: '#34d399', fontWeight: 700 }}>Goal reached!</Typography>
                        </Box>
                      ) : days !== null && (
                        <Typography sx={{ fontSize: '0.68rem', color: overdue ? '#fb7185' : 'text.disabled', mt: 0.25 }}>
                          {overdue ? `${Math.abs(days)}d overdue` : `${days}d left`}
                        </Typography>
                      )}
                    </Box>
                  </Box>
                  <IconButton size="small" onClick={() => deleteGoal(goal.id)} sx={{ color: 'rgba(148,163,184,0.3)', '&:hover': { color: '#fb7185' }, p: 0.5 }}>
                    <DeleteIcon sx={{ fontSize: 16 }} />
                  </IconButton>
                </Box>

                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
                  {editingId === goal.id ? (
                    <TextField
                      size="small"
                      type="number"
                      autoFocus
                      value={editAmount}
                      onChange={(e) => setEditAmount(e.target.value)}
                      onBlur={() => handleEditSave(goal)}
                      onKeyDown={(e) => { if (e.key === 'Enter') handleEditSave(goal); if (e.key === 'Escape') { setEditingId(null); setEditAmount(''); } }}
                      inputProps={{ min: 0 }}
                      sx={{ width: 130, '& .MuiInputBase-input': { fontSize: '0.85rem', py: 0.5 } }}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.75rem', color: 'text.disabled' }}>$</Typography></InputAdornment> }}
                    />
                  ) : (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, cursor: 'pointer' }} onClick={() => { setEditingId(goal.id); setEditAmount(String(goal.currentAmount)); }}>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 700, color: done ? '#34d399' : 'text.primary' }}>
                        {symbol}{convert(goal.currentAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                      </Typography>
                      <EditIcon sx={{ fontSize: 12, color: 'text.disabled' }} />
                    </Box>
                  )}
                  <Typography sx={{ fontSize: '0.78rem', color: 'text.secondary' }}>
                    of {symbol}{convert(goal.targetAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                  </Typography>
                </Box>

                <LinearProgress
                  variant="determinate"
                  value={pct}
                  sx={{
                    height: 6,
                    borderRadius: 3,
                    bgcolor: 'rgba(148,163,184,0.1)',
                    '& .MuiLinearProgress-bar': {
                      borderRadius: 3,
                      bgcolor: done ? '#34d399' : pct >= 75 ? '#818cf8' : '#38bdf8',
                    },
                  }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.5 }}>
                  <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled' }}>
                    {Math.round(pct)}% complete
                  </Typography>
                  {!done && (
                    <Typography sx={{ fontSize: '0.65rem', color: 'text.disabled', fontVariantNumeric: 'tabular-nums' }}>
                      {symbol}{convert(goal.targetAmount - goal.currentAmount).toLocaleString(undefined, { maximumFractionDigits: 0 })} to go
                    </Typography>
                  )}
                </Box>
              </CardContent>
            </Card>
          );
        })}
      </Box>
    </Box>
  );
};

export default GoalsPage;
