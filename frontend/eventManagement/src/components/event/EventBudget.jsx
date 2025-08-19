import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Table, TableHead, TableBody, 
  TableRow, TableCell, Paper, Button, TextField,
  CircularProgress, Alert, Divider
} from '@mui/material';
import { 
  Add, AttachMoney, Edit, Delete, 
  Save, Cancel, Receipt 
} from '@mui/icons-material';

const EventBudget = ({ eventId, budget: initialBudget, showNotification }) => {
  const [budget, setBudget] = useState(initialBudget || {
    allocated_amount: 0,
    spent_amount: 0,
    remaining_budget: 0
  });
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({ 
    description: '', 
    amount: '',
    category: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editBudget, setEditBudget] = useState({
    allocated_amount: 0
  });

  useEffect(() => {
    if (initialBudget) {
      setBudget(initialBudget);
      setEditBudget({
        allocated_amount: initialBudget.allocated_amount
      });
    }
  }, [initialBudget]);

  // In a real implementation, you would fetch expenses from the API
  // useEffect(() => {
  //   const fetchExpenses = async () => {
  //     try {
  //       setLoading(true);
  //       const response = await axios.get(`/api/events/${eventId}/expenses`);
  //       setExpenses(response.data);
  //     } catch (err) {
  //       setError(err.response?.data?.error || 'Failed to fetch expenses');
  //       showNotification('Failed to fetch expenses', 'error');
  //     } finally {
  //       setLoading(false);
  //     }
  //   };
  //   fetchExpenses();
  // }, [eventId]);

  const handleAddExpense = () => {
    if (!newExpense.description || !newExpense.amount) return;
    
    try {
      const expense = {
        id: Date.now(),
        description: newExpense.description,
        amount: parseFloat(newExpense.amount),
        category: newExpense.category || 'Other',
        date: new Date().toISOString()
      };
      
      // In a real app, you would send this to the server
      // await axios.post(`/api/events/${eventId}/expenses`, expense);
      
      setExpenses([...expenses, expense]);
      setBudget(prev => ({
        ...prev,
        spent_amount: prev.spent_amount + expense.amount,
        remaining_budget: prev.allocated_amount - (prev.spent_amount + expense.amount)
      }));
      setNewExpense({ description: '', amount: '', category: '' });
      showNotification('Expense added successfully', 'success');
    } catch (err) {
      showNotification('Failed to add expense', 'error');
    }
  };

  const handleDeleteExpense = (expenseId) => {
    try {
      const expenseToDelete = expenses.find(e => e.id === expenseId);
      if (!expenseToDelete) return;
      
      // In a real app, you would send delete request to the server
      // await axios.delete(`/api/events/${eventId}/expenses/${expenseId}`);
      
      setExpenses(expenses.filter(e => e.id !== expenseId));
      setBudget(prev => ({
        ...prev,
        spent_amount: prev.spent_amount - expenseToDelete.amount,
        remaining_budget: prev.allocated_amount - (prev.spent_amount - expenseToDelete.amount)
      }));
      showNotification('Expense deleted successfully', 'success');
    } catch (err) {
      showNotification('Failed to delete expense', 'error');
    }
  };

  const handleSaveBudget = () => {
    try {
      // In a real app, you would send this to the server
      // await axios.put(`/api/events/${eventId}/budget`, editBudget);
      
      setBudget({
        allocated_amount: editBudget.allocated_amount,
        spent_amount: budget.spent_amount,
        remaining_budget: editBudget.allocated_amount - budget.spent_amount
      });
      setEditMode(false);
      showNotification('Budget updated successfully', 'success');
    } catch (err) {
      showNotification('Failed to update budget', 'error');
    }
  };

  const remainingBudget = budget.allocated_amount - budget.spent_amount;

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h6" gutterBottom>
          Event Budget
        </Typography>
        {!editMode ? (
          <Button
            variant="outlined"
            startIcon={<Edit />}
            onClick={() => setEditMode(true)}
          >
            Edit Budget
          </Button>
        ) : (
          <Box display="flex" gap={1}>
            <Button
              variant="outlined"
              startIcon={<Cancel />}
              onClick={() => setEditMode(false)}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSaveBudget}
            >
              Save
            </Button>
          </Box>
        )}
      </Box>

      {loading && !budget ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error && !budget ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : (
        <>
          <Box sx={{ mb: 4, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle1" gutterBottom>
              Budget Summary
            </Typography>
            {editMode ? (
              <Box display="flex" alignItems="center" gap={2}>
                <TextField
                  label="Allocated Budget"
                  type="number"
                  value={editBudget.allocated_amount}
                  onChange={(e) => setEditBudget({
                    allocated_amount: parseFloat(e.target.value) || 0
                  })}
                  InputProps={{
                    startAdornment: <AttachMoney fontSize="small" />,
                  }}
                  fullWidth
                />
              </Box>
            ) : (
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2">Allocated</Typography>
                    <Typography variant="h6" color="primary">
                      ${budget.allocated_amount.toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2">Spent</Typography>
                    <Typography variant="h6">
                      ${budget.spent_amount.toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <Paper sx={{ p: 2, textAlign: 'center' }}>
                    <Typography variant="subtitle2">Remaining</Typography>
                    <Typography 
                      variant="h6" 
                      color={remainingBudget < 0 ? 'error' : 'success'}
                    >
                      ${remainingBudget.toFixed(2)}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            )}
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" gutterBottom>
              Add New Expense
            </Typography>
            <Box display="flex" flexWrap="wrap" gap={2} alignItems="flex-end">
              <TextField
                label="Description"
                value={newExpense.description}
                onChange={(e) => setNewExpense({...newExpense, description: e.target.value})}
                size="small"
                sx={{ flexGrow: 1 }}
              />
              <TextField
                label="Amount"
                type="number"
                value={newExpense.amount}
                onChange={(e) => setNewExpense({...newExpense, amount: e.target.value})}
                size="small"
                InputProps={{
                  startAdornment: <AttachMoney fontSize="small" />,
                }}
              />
              <TextField
                label="Category"
                value={newExpense.category}
                onChange={(e) => setNewExpense({...newExpense, category: e.target.value})}
                size="small"
              />
              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={handleAddExpense}
                disabled={!newExpense.description || !newExpense.amount}
              >
                Add Expense
              </Button>
            </Box>
          </Box>

          <Typography variant="subtitle1" gutterBottom>
            Expense Records
          </Typography>
          {expenses.length === 0 ? (
            <Paper sx={{ p: 3, textAlign: 'center' }}>
              <Receipt sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
              <Typography variant="h6">No Expenses Recorded</Typography>
              <Typography color="text.secondary">
                Add expenses to track your event budget
              </Typography>
            </Paper>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Description</TableCell>
                    <TableCell>Category</TableCell>
                    <TableCell align="right">Amount</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {expenses.map((expense) => (
                    <TableRow key={expense.id}>
                      <TableCell>
                        {new Date(expense.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{expense.description}</TableCell>
                      <TableCell>{expense.category}</TableCell>
                      <TableCell align="right">
                        ${expense.amount.toFixed(2)}
                      </TableCell>
                      <TableCell align="right">
                        <IconButton 
                          size="small" 
                          onClick={() => handleDeleteExpense(expense.id)}
                          color="error"
                        >
                          <Delete fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}
    </Paper>
  );
};

export default EventBudget;