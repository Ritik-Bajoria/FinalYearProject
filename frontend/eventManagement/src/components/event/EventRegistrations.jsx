import React, { useState, useEffect } from 'react';
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
import axios from 'axios';

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
  const [pagination, setPagination] = useState({
    page: 1,
    perPage: 10,
    total: 0
  });

  const fetchRegistrations = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        page: pagination.page,
        per_page: pagination.perPage,
        search: searchTerm,
        status: statusFilter !== 'all' ? statusFilter : undefined
      };
      
      const response = await axios.get(`/api/events/${eventId}/registrations`, {
        params,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setRegistrations(response.data.registrations);
      setPagination(prev => ({
        ...prev,
        total: response.data.total_count
      }));
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch registrations');
      showNotification('Failed to fetch registrations', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, [eventId, pagination.page, pagination.perPage, searchTerm, statusFilter]);

  const handleStatusUpdate = async () => {
    try {
      await axios.put(
        `/api/events/${eventId}/registrations/${editingRegistration.registration_id}`,
        { status: selectedStatus },
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      showNotification('Registration status updated successfully', 'success');
      setOpenStatusDialog(false);
      setEditingRegistration(null);
      fetchRegistrations();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to update registration', 'error');
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
                          <Avatar src={registration.user.avatar_url}>
                            {registration.user.full_name.charAt(0)}
                          </Avatar>
                          <Box>
                            <Typography>{registration.user.full_name}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {registration.user.email}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        {new Date(registration.registration_date).toLocaleDateString()}
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
              Attendee: {editingRegistration?.user.full_name}
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
    </Card>
  );
};

export default EventRegistrations;