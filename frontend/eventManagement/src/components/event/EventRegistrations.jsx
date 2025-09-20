import React, { useState, useEffect, useCallback } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, 
  Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Paper, Chip, 
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, MenuItem, Select, FormControl, InputLabel,
  CircularProgress, Snackbar, Alert, Avatar, IconButton
} from '@mui/material';
import { 
  People, Search, CheckCircle, Cancel,
  ArrowBack, ArrowForward, FilterList, Close
} from '@mui/icons-material';

const statusOptions = [
  { value: 'pending', label: 'Pending', color: 'default' },
  { value: 'approved', label: 'Approved', color: 'success' },
  { value: 'waitlisted', label: 'Waitlisted', color: 'warning' },
  { value: 'rejected', label: 'Rejected', color: 'error' }
];

const EventRegistrations = ({ eventId, showNotification }) => {
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [editingRegistration, setEditingRegistration] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('');
  const [openStatusDialog, setOpenStatusDialog] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0
  });

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
      return data; // Return the full response, not just data.data
    } catch (err) {
      throw err;
    }
  }, [API_BASE_URL]);

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: pagination.page,
        per_page: pagination.perPage,
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter !== 'all' && { status: statusFilter })
      });

      const response = await apiCall(`/events/${eventId}/registrations?${params}`);
      
      // Fix: Extract data from the correct structure
      const registrationData = response.data || [];
      setRegistrations(registrationData);
      
      // Fix: Set total based on actual data length or a total_count if provided
      setPagination(prev => ({
        ...prev,
        total: response.total_count || registrationData.length
      }));
    } catch (err) {
      setError(err.message || 'Failed to fetch registrations');
      handleNotification(err.message || 'Failed to fetch registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchRegistrations();
    }
  }, [eventId, pagination.page, pagination.perPage, searchTerm, statusFilter]);

  const handleStatusUpdate = async () => {
    try {
      await apiCall(
        `/events/${eventId}/registrations/${editingRegistration.registration_id}`,
        {
          method: 'PUT',
          body: { status: selectedStatus }
        }
      );
      
      handleNotification('Registration status updated successfully', 'success');
      setOpenStatusDialog(false);
      setEditingRegistration(null);
      fetchRegistrations();
    } catch (err) {
      handleNotification(err.message || 'Failed to update registration', 'error');
    }
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({
      ...prev,
      page: newPage
    }));
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const handleStatusFilterChange = (e) => {
    setStatusFilter(e.target.value);
    setPagination(prev => ({ ...prev, page: 1 }));
  };

  const openEditDialog = (registration) => {
    setEditingRegistration(registration);
    setSelectedStatus(registration.status);
    setOpenStatusDialog(true);
  };

  const getStatusColor = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.color : 'default';
  };

  const getStatusLabel = (status) => {
    const option = statusOptions.find(opt => opt.value === status);
    return option ? option.label : status;
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h5" component="h2">
            Event Registrations
          </Typography>
          <Box display="flex" alignItems="center" gap={2}>
            <TextField
              size="small"
              placeholder="Search attendees..."
              InputProps={{
                startAdornment: <Search fontSize="small" color="action" sx={{ mr: 1 }} />
              }}
              value={searchTerm}
              onChange={handleSearch}
            />
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={handleStatusFilterChange}
                label="Status"
              >
                <MenuItem value="all">All Statuses</MenuItem>
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </Box>

        {loading && !registrations.length ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : error && !registrations.length ? (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        ) : registrations.length === 0 ? (
          <Box textAlign="center" py={4}>
            <People sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
            <Typography variant="h6" gutterBottom>
              No Registrations Yet
            </Typography>
            <Typography color="text.secondary">
              {searchTerm || statusFilter !== 'all' 
                ? 'No matching registrations found' 
                : 'No one has registered for this event yet'}
            </Typography>
          </Box>
        ) : (
          <>
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Attendee</TableCell>
                    <TableCell>Registration Date</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {registrations.map((registration) => (
                    <TableRow key={registration.registration_id}>
                      <TableCell>
                        <Box display="flex" alignItems="center" gap={2}>
                          <Avatar>
                            {registration.user_name?.charAt(0) || 'U'}
                          </Avatar>
                          <Box>
                            <Typography>{registration.user_name || 'Unknown User'}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {registration.user_email || 'No email'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {registration.registration_date 
                          ? new Date(registration.registration_date).toLocaleDateString()
                          : 'N/A'
                        }
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusLabel(registration.status)} 
                          color={getStatusColor(registration.status)} 
                          size="small"
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          size="small"
                          variant="outlined"
                          onClick={() => openEditDialog(registration)}
                        >
                          Update Status
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            <Box display="flex" justifyContent="space-between" alignItems="center" mt={2}>
              <Typography variant="body2" color="text.secondary">
                Showing {(pagination.page - 1) * pagination.perPage + 1}-
                {Math.min(pagination.page * pagination.perPage, pagination.total)} of {pagination.total}
              </Typography>
              <Box>
                <Button
                  startIcon={<ArrowBack />}
                  disabled={pagination.page === 1}
                  onClick={() => handlePageChange(pagination.page - 1)}
                  sx={{ mr: 1 }}
                >
                  Previous
                </Button>
                <Button
                  endIcon={<ArrowForward />}
                  disabled={pagination.page * pagination.perPage >= pagination.total}
                  onClick={() => handlePageChange(pagination.page + 1)}
                >
                  Next
                </Button>
              </Box>
            </Box>
          </>
        )}
      </CardContent>

      {/* Status Update Dialog */}
      <Dialog open={openStatusDialog} onClose={() => setOpenStatusDialog(false)}>
        <DialogTitle>
          Update Registration Status
          <IconButton
            aria-label="close"
            onClick={() => setOpenStatusDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 1, minWidth: 300 }}>
            <Typography variant="subtitle1" gutterBottom>
              Attendee: {editingRegistration?.user_name || 'Unknown User'}
            </Typography>
            <FormControl fullWidth margin="normal">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                label="Status"
              >
                {statusOptions.map(option => (
                  <MenuItem key={option.value} value={option.value}>
                    <Box display="flex" alignItems="center" gap={1}>
                      {option.value === 'approved' && <CheckCircle fontSize="small" color="success" />}
                      {option.value === 'rejected' && <Cancel fontSize="small" color="error" />}
                      {option.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenStatusDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleStatusUpdate} 
            variant="contained" 
            color="primary"
          >
            Update
          </Button>
        </DialogActions>
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
    </Card>
  );
};

export default EventRegistrations;