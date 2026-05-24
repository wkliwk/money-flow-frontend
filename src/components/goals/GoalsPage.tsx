import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardActionArea,
  CardContent,
  LinearProgress,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  IconButton,
  Chip,
  useTheme,
  useMediaQuery,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import SavingsIcon from '@mui/icons-material/Savings';
import dayjs from 'dayjs';
import { useGoals } from '../../hooks/useGoals';
import EmptyState from '../ui/EmptyState';

interface Props {
  convert: (hkd: number) => number;
  symbol: string;
}

const fmt = (n: number, symbol: string) =>
  `${symbol}${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

const GoalsPage: React.FC<Props> = ({ convert, symbol }) => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const { goals, addGoal, updateAmount, deleteGoal } = useGoals();
  const [addOpen, setAddOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [form, setForm] = useState({ name: '', targetAmount: '', deadline: '', category: '' });

  const handleAdd = () => {
    if (!form.name || !form.targetAmount) return;
    addGoal({
      name: form.name,
      targetAmount: Number(form.targetAmount),
      deadline: form.deadline || undefined,
      category: form.category || undefined,
    });
    setForm({ name: '', targetAmount: '', deadline: '', category: '' });
    setAddOpen(false);
  };

  const handleUpdateAmount = () => {
    if (editId && editAmount) {
      updateAmount(editId, Number(editAmount));
      setEditId(null);
      setEditAmount('');
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    const aComplete = a.currentAmount >= a.targetAmount;
    const bComplete = b.currentAmount >= b.targetAmount;
    if (aComplete !== bComplete) return aComplete ? 1 : -1;
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <Box sx={{ pb: 10 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700 }}>
          Savings Goals
        </Typography>
        <Button
          variant="contained"
          size="small"
          startIcon={<AddIcon />}
          onClick={() => setAddOpen(true)}
          sx={{ borderRadius: 2 }}
        >
          Add Goal
        </Button>
      </Box>

      {sortedGoals.length === 0 && (
        <EmptyState
          data-testid="goals-empty-state"
          icon={<SavingsIcon />}
          title="No goals yet"
          body="Set your first goal to start tracking what you're saving for."
          cta={{ label: 'Set your first goal', onClick: () => setAddOpen(true) }}
        />
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fill, minmax(320px, 1fr))', gap: 2 }}>
        {sortedGoals.map((goal) => {
          const pct = Math.min(100, (goal.currentAmount / goal.targetAmount) * 100);
          const isComplete = pct >= 100;
          const daysLeft = goal.deadline ? dayjs(goal.deadline).diff(dayjs(), 'day') : null;

          return (
            <Card
              key={goal.id}
              sx={{
                position: 'relative',
                overflow: 'visible',
                border: isComplete ? `1px solid ${theme.palette.success.main}` : undefined,
                background: isComplete
                  ? `linear-gradient(135deg, ${theme.palette.mode === 'dark' ? 'rgba(52,211,153,0.08)' : 'rgba(16,185,129,0.06)'} 0%, transparent 100%)`
                  : undefined,
              }}
            >
              <CardActionArea
                onClick={() => {
                  setEditId(goal.id);
                  setEditAmount(String(goal.currentAmount));
                }}
              >
                <CardContent sx={{ p: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 1.5 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                        {isComplete && <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />}
                        <Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
                          {goal.name}
                        </Typography>
                      </Box>
                      {goal.category && (
                        <Chip label={goal.category} size="small" sx={{ mt: 0.5, fontSize: '0.68rem', height: 22 }} />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteGoal(goal.id);
                      }}
                      sx={{ color: 'text.secondary', opacity: 0.5, '&:hover': { opacity: 1, color: 'error.main' } }}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>

                  <Box sx={{ mb: 1.5 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                      <Typography variant="h6" sx={{ fontWeight: 700, color: isComplete ? 'success.main' : 'text.primary' }}>
                        {fmt(convert(goal.currentAmount), symbol)}
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'text.secondary', alignSelf: 'flex-end' }}>
                        of {fmt(convert(goal.targetAmount), symbol)}
                      </Typography>
                    </Box>
                    <LinearProgress
                      variant="determinate"
                      value={pct}
                      sx={{
                        height: 8,
                        borderRadius: 4,
                        bgcolor: theme.palette.mode === 'dark' ? 'rgba(148,163,184,0.1)' : 'rgba(100,116,139,0.1)',
                        '& .MuiLinearProgress-bar': {
                          borderRadius: 4,
                          background: isComplete
                            ? `linear-gradient(90deg, ${theme.palette.success.main}, ${theme.palette.success.light})`
                            : `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                        },
                      }}
                    />
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600 }}>
                      {pct.toFixed(0)}% complete
                    </Typography>
                    {daysLeft !== null && !isComplete && (
                      <Typography
                        variant="caption"
                        sx={{
                          color: daysLeft < 0 ? 'error.main' : daysLeft < 30 ? 'warning.main' : 'text.secondary',
                          fontWeight: 600,
                        }}
                      >
                        {daysLeft < 0 ? `${Math.abs(daysLeft)}d overdue` : `${daysLeft}d left`}
                      </Typography>
                    )}
                  </Box>
                </CardContent>
              </CardActionArea>
            </Card>
          );
        })}
      </Box>

      {/* Add Goal Dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} fullWidth maxWidth="xs" fullScreen={isMobile}>
        <DialogTitle sx={{ fontWeight: 700 }}>New Savings Goal</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField
            label="Goal name"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            fullWidth
            autoFocus
          />
          <TextField
            label="Target amount (HKD)"
            type="number"
            value={form.targetAmount}
            onChange={(e) => setForm((f) => ({ ...f, targetAmount: e.target.value }))}
            fullWidth
          />
          <TextField
            label="Deadline (optional)"
            type="date"
            value={form.deadline}
            onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
            fullWidth
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Category (optional)"
            value={form.category}
            onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
            fullWidth
            placeholder="e.g. Vacation, Emergency Fund"
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setAddOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!form.name || !form.targetAmount}>
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Update Amount Dialog */}
      <Dialog
        open={!!editId}
        onClose={() => { setEditId(null); setEditAmount(''); }}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Update Progress</DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          <TextField
            label="Current amount saved (HKD)"
            type="number"
            value={editAmount}
            onChange={(e) => setEditAmount(e.target.value)}
            fullWidth
            autoFocus
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => { setEditId(null); setEditAmount(''); }}>Cancel</Button>
          <Button variant="contained" onClick={handleUpdateAmount} disabled={!editAmount}>
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default GoalsPage;
