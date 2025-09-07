import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid, // Added Grid import
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  CircularProgress,
  Chip
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Close as CloseIcon
} from '@mui/icons-material';

const EventBudget = ({ eventId, showNotification }) => {
  const [budgetItems, setBudgetItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: ''
  });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000/api';

  // Centralized API call handler
  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    try {
      const headers = {
        ...(options.body instanceof FormData
          ? {} // don't set content-type for FormData
          : { 'Content-Type': 'application/json' }),
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body instanceof FormData ? options.body : JSON.stringify(options.body),
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
        } catch {
          // ignore non-JSON error body
        }

        // Handle expired/invalid token
        if (response.status === 401 || response.status === 422) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }

        throw new Error(errorMsg);
      }

      const data = await response.json();
      return data.data || data;
    } catch (err) {
      throw err;
    }
  }, [API_BASE_URL]);

  const fetchBudgetItems = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(`/events/${eventId}/budget`);
      // Handle the budget response structure
      if (response.expenses) {
        setBudgetItems(response.expenses);
      } else {
        setBudgetItems([]);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch budget items');
      showNotification(err.message || 'Failed to fetch budget items', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchBudgetItems();
    }
  }, [eventId]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing item
        await apiCall(`/events/${eventId}/budget/expenses/${editingItem.expense_id}`, {
          method: 'PUT',
          body: formData
        });
        showNotification('Budget item updated successfully', 'success');
      } else {
        // Create new item
        await apiCall(`/events/${eventId}/budget/expenses`, {
          method: 'POST',
          body: formData
        });
        showNotification('Budget item added successfully', 'success');
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData({
        description: '',
        amount: ''
      });
      fetchBudgetItems();
    } catch (err) {
      showNotification(err.message || 'Failed to save budget item', 'error');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this budget item?')) return;
    
    try {
      await apiCall(`/events/${eventId}/budget/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      showNotification('Budget item deleted successfully', 'success');
      fetchBudgetItems();
    } catch (err) {
      showNotification(err.message || 'Failed to delete budget item', 'error');
    }
  };

  const openEditDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description,
        amount: item.amount
      });
    } else {
      setEditingItem(null);
      setFormData({
        description: '',
        amount: ''
      });
    }
    setDialogOpen(true);
  };

  const calculateTotals = () => {
    const totalSpent = budgetItems.reduce((sum, item) => sum + parseFloat(item.amount || 0), 0);
    return {
      totalSpent,
      itemCount: budgetItems.length
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return 'success';
      case 'in_progress': return 'warning';
      case 'planned': return 'info';
      case 'cancelled': return 'error';
      default: return 'default';
    }
  };

  const totals = calculateTotals();

  return (
    <Box>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          Event Budget
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => openEditDialog()}
        >
          Add Budget Item
        </Button>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Summary Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Expenses
              </Typography>
              <Typography variant="h4" component="div">
                ${totals.totalSpent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Items
              </Typography>
              <Typography variant="h4" component="div">
                {totals.itemCount}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Items Table */}
      <Card>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : budgetItems.length === 0 ? (
            <Box textAlign="center" py={4}>
              <AttachMoney sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                No Budget Items
              </Typography>
              <Typography color="text.secondary">
                Add budget items to start tracking your event expenses
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Added By</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetItems.map((item) => (
                    <TableRow key={item.expense_id}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {item.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        ${parseFloat(item.amount || 0).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {item.uploaded_by_name || 'Unknown'}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(item)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(item.expense_id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Budget Item' : 'Add Budget Item'}
          <IconButton
            aria-label="close"
            onClick={() => setDialogOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  multiline
                  rows={2}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingItem ? 'Update' : 'Add'} Item
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EventBudget;