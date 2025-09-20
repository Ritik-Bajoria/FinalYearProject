import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Button,
  TextField,
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
  Chip,
  Snackbar,
  LinearProgress
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AttachMoney,
  TrendingUp,
  TrendingDown,
  Close as CloseIcon,
  Receipt as ReceiptIcon,
  AccountBalance as BudgetIcon
} from '@mui/icons-material';

const EventBudget = ({ eventId, showNotification }) => {
  const [budgetData, setBudgetData] = useState({
    budget_id: null,
    allocated_amount: 0,
    total_spent: 0,
    remaining_budget: 0,
    budget_status: 'not_set',
    expenses: []
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [budgetDialogOpen, setBudgetDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    receipt: null
  });
  const [budgetFormData, setBudgetFormData] = useState({
    allocated_amount: ''
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });

  // Internal notification handler if showNotification prop is not provided
  const handleNotification = (message, severity = 'info') => {
    if (typeof showNotification === 'function') {
      showNotification(message, severity);
    } else {
      setSnackbar({ open: true, message, severity });
    }
  };

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

  const fetchBudgetData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiCall(`/events/${eventId}/budget`);
      setBudgetData(response);
      setBudgetFormData({
        allocated_amount: response.allocated_amount || ''
      });
    } catch (err) {
      setError(err.message || 'Failed to fetch budget data');
      handleNotification(err.message || 'Failed to fetch budget data', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchBudgetData();
    }
  }, [eventId]);

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingItem) {
        // Update existing expense
        await apiCall(`/events/${eventId}/budget/expenses/${editingItem.expense_id}`, {
          method: 'PUT',
          body: {
            description: formData.description,
            amount: formData.amount
          }
        });
        handleNotification('Expense updated successfully', 'success');
      } else {
        // Create new expense with FormData for file upload
        const formDataToSend = new FormData();
        formDataToSend.append('description', formData.description);
        formDataToSend.append('amount', formData.amount);
        if (formData.receipt) {
          formDataToSend.append('receipt', formData.receipt);
        }

        await apiCall(`/events/${eventId}/budget/expenses`, {
          method: 'POST',
          body: formDataToSend
        });
        handleNotification('Expense added successfully', 'success');
      }
      
      setDialogOpen(false);
      setEditingItem(null);
      setFormData({
        description: '',
        amount: '',
        receipt: null
      });
      fetchBudgetData();
    } catch (err) {
      handleNotification(err.message || 'Failed to save expense', 'error');
    }
  };

  const handleBudgetSubmit = async (e) => {
    e.preventDefault();
    try {
      await apiCall(`/events/${eventId}/budget`, {
        method: 'PUT',
        body: {
          allocated_amount: budgetFormData.allocated_amount
        }
      });
      handleNotification('Budget allocation updated successfully', 'success');
      setBudgetDialogOpen(false);
      fetchBudgetData();
    } catch (err) {
      handleNotification(err.message || 'Failed to update budget allocation', 'error');
    }
  };

  const handleDelete = async (expenseId) => {
    if (!window.confirm('Are you sure you want to delete this expense?')) return;
    
    try {
      await apiCall(`/events/${eventId}/budget/expenses/${expenseId}`, {
        method: 'DELETE'
      });
      handleNotification('Expense deleted successfully', 'success');
      fetchBudgetData();
    } catch (err) {
      handleNotification(err.message || 'Failed to delete expense', 'error');
    }
  };

  const openEditDialog = (item = null) => {
    if (item) {
      setEditingItem(item);
      setFormData({
        description: item.description,
        amount: item.amount,
        receipt: null
      });
    } else {
      setEditingItem(null);
      setFormData({
        description: '',
        amount: '',
        receipt: null
      });
    }
    setDialogOpen(true);
  };

  const openBudgetDialog = () => {
    setBudgetFormData({
      allocated_amount: budgetData.allocated_amount || ''
    });
    setBudgetDialogOpen(true);
  };

  const getBudgetStatusColor = (status) => {
    switch (status) {
      case 'within_budget': return 'success';
      case 'over_budget': return 'error';
      case 'not_set': return 'warning';
      default: return 'default';
    }
  };

  const getBudgetStatusLabel = (status) => {
    switch (status) {
      case 'within_budget': return 'Within Budget';
      case 'over_budget': return 'Over Budget';
      case 'not_set': return 'Budget Not Set';
      default: return 'Unknown';
    }
  };

  const getBudgetProgress = () => {
    if (budgetData.allocated_amount === 0) return 0;
    return Math.min((budgetData.total_spent / budgetData.allocated_amount) * 100, 100);
  };

  return (
    <Box>
      {/* Header Section */}
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h1">
          <BudgetIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
          Event Budget
        </Typography>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<BudgetIcon />}
            onClick={openBudgetDialog}
          >
            Set Budget
          </Button>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openEditDialog()}
          >
            Add Expense
          </Button>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Budget Overview Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Allocated Budget
              </Typography>
              <Typography variant="h4" component="div" color="primary">
                ${budgetData.allocated_amount.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Total Spent
              </Typography>
              <Typography variant="h4" component="div" color="error">
                ${budgetData.total_spent.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Remaining Budget
              </Typography>
              <Typography 
                variant="h4" 
                component="div" 
                color={budgetData.remaining_budget >= 0 ? "success.main" : "error.main"}
              >
                ${budgetData.remaining_budget.toFixed(2)}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography color="text.secondary" gutterBottom>
                Budget Status
              </Typography>
              <Chip 
                label={getBudgetStatusLabel(budgetData.budget_status)}
                color={getBudgetStatusColor(budgetData.budget_status)}
                sx={{ mt: 1 }}
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Budget Progress */}
      {budgetData.allocated_amount > 0 && (
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              Budget Usage
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
              <Box sx={{ width: '100%', mr: 1 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={getBudgetProgress()} 
                  color={budgetData.budget_status === 'over_budget' ? 'error' : 'primary'}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Box sx={{ minWidth: 35 }}>
                <Typography variant="body2" color="text.secondary">
                  {getBudgetProgress().toFixed(1)}%
                </Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              ${budgetData.total_spent.toFixed(2)} of ${budgetData.allocated_amount.toFixed(2)} used
            </Typography>
          </CardContent>
        </Card>
      )}

      {/* Expenses Table */}
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Expense Details
          </Typography>
          {loading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : budgetData.expenses.length === 0 ? (
            <Box textAlign="center" py={4}>
              <ReceiptIcon sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6" gutterBottom>
                No Expenses Added
              </Typography>
              <Typography color="text.secondary">
                Add expenses to start tracking your event budget
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Description</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell>Date Added</TableCell>
                    <TableCell>Added By</TableCell>
                    <TableCell>Receipt</TableCell>
                    <TableCell align="center">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {budgetData.expenses.map((expense) => (
                    <TableRow key={expense.expense_id}>
                      <TableCell>
                        <Typography fontWeight="medium">
                          {expense.description}
                        </Typography>
                      </TableCell>
                      <TableCell align="right">
                        <Typography fontWeight="bold">
                          ${parseFloat(expense.amount || 0).toFixed(2)}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {expense.created_at ? new Date(expense.created_at).toLocaleDateString() : 'N/A'}
                      </TableCell>
                      <TableCell>
                        {expense.uploaded_by_name || 'Unknown'}
                      </TableCell>
                      <TableCell>
                        {expense.receipt_url ? (
                          <Chip 
                            label="View Receipt" 
                            size="small" 
                            color="primary" 
                            variant="outlined"
                            icon={<ReceiptIcon />}
                            onClick={() => window.open(expense.receipt_url, '_blank')}
                            sx={{ cursor: 'pointer' }}
                          />
                        ) : (
                          <Typography variant="body2" color="text.secondary">
                            No receipt
                          </Typography>
                        )}
                      </TableCell>
                      <TableCell align="center">
                        <IconButton
                          size="small"
                          onClick={() => openEditDialog(expense)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                        <IconButton
                          size="small"
                          onClick={() => handleDelete(expense.expense_id)}
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

      {/* Budget Allocation Dialog */}
      <Dialog open={budgetDialogOpen} onClose={() => setBudgetDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          Set Budget Allocation
          <IconButton
            aria-label="close"
            onClick={() => setBudgetDialogOpen(false)}
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
        <form onSubmit={handleBudgetSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Set the total budget allocation for this event. This will help track expenses and budget usage.
            </Typography>
            <TextField
              fullWidth
              label="Allocated Amount ($)"
              type="number"
              value={budgetFormData.allocated_amount}
              onChange={(e) => setBudgetFormData({ ...budgetFormData, allocated_amount: e.target.value })}
              inputProps={{ min: 0, step: 0.01 }}
              required
              sx={{ mt: 2 }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setBudgetDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Update Budget
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Add/Edit Expense Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingItem ? 'Edit Expense' : 'Add Expense'}
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
        <form onSubmit={handleExpenseSubmit}>
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
                  placeholder="Enter expense description..."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Amount ($)"
                  type="number"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  inputProps={{ min: 0, step: 0.01 }}
                  required
                />
              </Grid>
              {!editingItem && (
                <Grid item xs={12}>
                  <Typography variant="body2" gutterBottom>
                    Receipt (Optional)
                  </Typography>
                  <input
                    type="file"
                    accept="image/*,.pdf"
                    onChange={(e) => setFormData({ ...formData, receipt: e.target.files[0] })}
                    style={{ width: '100%' }}
                  />
                  <Typography variant="caption" color="text.secondary">
                    Supported formats: Images (JPG, PNG) and PDF
                  </Typography>
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              {editingItem ? 'Update' : 'Add'} Expense
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Internal Snackbar for notifications when showNotification prop is not provided */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default EventBudget;