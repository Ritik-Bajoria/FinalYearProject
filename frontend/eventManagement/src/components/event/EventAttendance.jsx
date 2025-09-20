import React, { useState, useEffect, useCallback } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Paper, Button,
  CircularProgress, Alert, Chip, TextField, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, IconButton, Avatar, TableContainer, Snackbar,
  Checkbox
} from '@mui/material';
import {
  People, CheckCircle, EventAvailable, Search,
  Close, PersonAdd, PersonRemove,
  Download, FilterList
} from '@mui/icons-material';

const EventAttendance = ({ eventId, showNotification }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  const [selectedAttendees, setSelectedAttendees] = useState([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Internal notification handler if showNotification prop is not provided
  const handleNotification = (message, severity = 'info') => {
    if (typeof showNotification === 'function') {
      showNotification(message, severity);
    } else {
      setSnackbar({ open: true, message, severity });
    }
  };


  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:7000/api';

  const apiCall = useCallback(async (endpoint, options = {}) => {
    const token = localStorage.getItem('token');
    try {
      const headers = {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...(options.headers || {}),
      };

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
        body: options.body ? JSON.stringify(options.body) : undefined,
      });

      if (!response.ok) {
        let errorMsg = `HTTP error! status: ${response.status}`;
        try {
          const errorData = await response.json();
          errorMsg = errorData?.error || errorData?.message || errorMsg;
        } catch {
          // ignore non-JSON error body
        }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : data.data || data;
    } catch (err) {
      throw err;
    }
  }, [API_BASE_URL]);

  const fetchAttendance = async () => {
    setLoading(true);
    setError(null);
    try {
      const attendanceData = await apiCall(`/events/${eventId}/attendance`);
      setAttendance(attendanceData);
    } catch (err) {
      setError(err.message || 'Failed to fetch attendance');
      handleNotification(err.message || 'Failed to fetch attendance', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (eventId) {
      fetchAttendance();
    }
  }, [eventId]);

  const handleToggleAttendance = async (userId) => {
    try {
      const attendee = attendance.find(a => a.user_id === userId);
      
      if (attendee.attended) {
        // Unmark attendance
        await apiCall(`/events/${eventId}/attendance/${userId}`, {
          method: 'DELETE'
        });
        handleNotification('Attendance unmarked successfully', 'success');
      } else {
        // Mark attendance
        await apiCall(`/events/${eventId}/attendance`, {
          method: 'POST',
          body: { user_id: userId }
        });
        handleNotification('Attendance marked successfully', 'success');
      }
      
      fetchAttendance();
    } catch (err) {
      handleNotification(err.message || 'Failed to update attendance', 'error');
    }
  };

  const handleBulkMarkPresent = async () => {
    if (selectedAttendees.length === 0) {
      handleNotification('Please select attendees to mark as present', 'warning');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedAttendees
        .filter(userId => {
          const attendee = attendance.find(a => a.user_id === userId);
          return attendee && !attendee.attended;
        })
        .map(userId => 
          apiCall(`/events/${eventId}/attendance`, {
            method: 'POST',
            body: { user_id: userId }
          })
        );

      await Promise.all(promises);
      handleNotification(`Marked ${promises.length} attendees as present`, 'success');
      setSelectedAttendees([]);
      fetchAttendance();
    } catch (err) {
      handleNotification(err.message || 'Failed to mark attendees as present', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkMarkAbsent = async () => {
    if (selectedAttendees.length === 0) {
      handleNotification('Please select attendees to mark as absent', 'warning');
      return;
    }

    setBulkActionLoading(true);
    try {
      const promises = selectedAttendees
        .filter(userId => {
          const attendee = attendance.find(a => a.user_id === userId);
          return attendee && attendee.attended;
        })
        .map(userId => 
          apiCall(`/events/${eventId}/attendance/${userId}`, {
            method: 'DELETE'
          })
        );

      await Promise.all(promises);
      handleNotification(`Marked ${promises.length} attendees as absent`, 'success');
      setSelectedAttendees([]);
      fetchAttendance();
    } catch (err) {
      handleNotification(err.message || 'Failed to mark attendees as absent', 'error');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedAttendees.length === filteredAttendance.length) {
      setSelectedAttendees([]);
    } else {
      setSelectedAttendees(filteredAttendance.map(a => a.user_id));
    }
  };

  const handleSelectAttendee = (userId) => {
    setSelectedAttendees(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleExportAttendance = () => {
    if (attendance.length === 0) {
      handleNotification('No attendance data to export', 'warning');
      return;
    }

    const csvContent = "data:text/csv;charset=utf-8," + 
      "Name,Email,Status,Check-in Time,QR Check-in\n" +
      attendance.map(a => 
        `"${a.user.full_name || 'Unknown'}","${a.user.email || 'N/A'}","${a.attended ? 'Present' : 'Absent'}","${a.check_in_time ? new Date(a.check_in_time).toLocaleString() : 'N/A'}","${a.qr_checked_in ? 'Yes' : 'No'}"`
      ).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `event_${eventId}_attendance_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    handleNotification('Attendance exported successfully', 'success');
  };

  const filteredAttendance = attendance.filter(attendee => {
    const matchesSearch = attendee.user.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         attendee.user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || 
                         (filterStatus === 'present' && attendee.attended) ||
                         (filterStatus === 'absent' && !attendee.attended);
    return matchesSearch && matchesFilter;
  });

  const presentCount = attendance.filter(a => a.attended).length;
  const absentCount = attendance.length - presentCount;

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          <People sx={{ verticalAlign: 'middle', mr: 1 }} />
          Event Attendance
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportAttendance}
            disabled={attendance.length === 0}
          >
            Export
          </Button>
        </Stack>
      </Box>

      {/* Attendance Summary */}
      {attendance.length > 0 && (
        <Box mb={3}>
          <Paper sx={{ p: 2, backgroundColor: '#f5f5f5' }}>
            <Typography variant="h6" gutterBottom>
              Attendance Summary
            </Typography>
            <Stack direction="row" spacing={4}>
              <Box textAlign="center">
                <Typography variant="h4" color="success.main" fontWeight="bold">
                  {presentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Present
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" color="error.main" fontWeight="bold">
                  {absentCount}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Absent
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" color="primary.main" fontWeight="bold">
                  {attendance.length}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total Registered
                </Typography>
              </Box>
              <Box textAlign="center">
                <Typography variant="h4" color="info.main" fontWeight="bold">
                  {attendance.length > 0 ? Math.round((presentCount / attendance.length) * 100) : 0}%
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Attendance Rate
                </Typography>
              </Box>
            </Stack>
          </Paper>
        </Box>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            size="small"
            placeholder="Search attendees..."
            InputProps={{
              startAdornment: <Search fontSize="small" color="action" sx={{ mr: 1 }} />
            }}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={() => setFilterStatus(filterStatus === 'present' ? 'all' : 'present')}
            variant={filterStatus === 'present' ? 'contained' : 'outlined'}
            color={filterStatus === 'present' ? 'primary' : 'inherit'}
          >
            Present ({presentCount})
          </Button>
          <Button
            size="small"
            startIcon={<FilterList />}
            onClick={() => setFilterStatus(filterStatus === 'absent' ? 'all' : 'absent')}
            variant={filterStatus === 'absent' ? 'contained' : 'outlined'}
            color={filterStatus === 'absent' ? 'error' : 'inherit'}
          >
            Absent ({absentCount})
          </Button>
        </Box>
        
        {/* Bulk Actions */}
        {selectedAttendees.length > 0 && (
          <Stack direction="row" spacing={1}>
            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
              {selectedAttendees.length} selected
            </Typography>
            <Button
              size="small"
              variant="contained"
              color="success"
              startIcon={<PersonAdd />}
              onClick={handleBulkMarkPresent}
              disabled={bulkActionLoading}
            >
              Mark Present
            </Button>
            <Button
              size="small"
              variant="contained"
              color="error"
              startIcon={<PersonRemove />}
              onClick={handleBulkMarkAbsent}
              disabled={bulkActionLoading}
            >
              Mark Absent
            </Button>
          </Stack>
        )}
        {/* <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={handleBulkCheckIn}
        >
          Bulk Check-in
        </Button> */}
      </Box>

      {loading && attendance.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error && attendance.length === 0 ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : filteredAttendance.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <People sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">No Attendance Records</Typography>
          <Typography color="text.secondary">
            {searchTerm || filterStatus !== 'all' 
              ? 'No matching attendees found' 
              : 'No attendees have checked in yet'}
          </Typography>
        </Paper>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    indeterminate={selectedAttendees.length > 0 && selectedAttendees.length < filteredAttendance.length}
                    checked={filteredAttendance.length > 0 && selectedAttendees.length === filteredAttendance.length}
                    onChange={handleSelectAll}
                  />
                </TableCell>
                <TableCell>Attendee</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell align="center">Check-in Method</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map((attendee) => (
                <TableRow key={attendee.user_id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedAttendees.includes(attendee.user_id)}
                      onChange={() => handleSelectAttendee(attendee.user_id)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar>
                        {attendee.user.full_name?.charAt(0) || 'U'}
                      </Avatar>
                      {attendee.user.full_name || 'Unknown User'}
                    </Box>
                  </TableCell>
                  <TableCell>{attendee.user.email}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={attendee.attended ? 'Present' : 'Absent'}
                      color={attendee.attended ? 'success' : 'error'}
                      icon={attendee.attended ? <CheckCircle /> : <Close />}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {attendee.check_in_time 
                      ? new Date(attendee.check_in_time).toLocaleString() 
                      : 'Not checked in'}
                  </TableCell>
                  <TableCell align="center">
                    {attendee.attended ? (
                      <Chip
                        label={attendee.qr_checked_in ? 'QR Code' : 'Manual'}
                        size="small"
                        color={attendee.qr_checked_in ? 'primary' : 'default'}
                        variant="outlined"
                      />
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        -
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title={attendee.attended ? 'Mark as absent' : 'Mark as present'}>
                      <IconButton
                        onClick={() => handleToggleAttendance(attendee.user_id)}
                        disabled={loading}
                        color={attendee.attended ? 'error' : 'success'}
                      >
                        {attendee.attended ? <PersonRemove /> : <PersonAdd />}
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

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
    </Paper>
  );
};

export default EventAttendance;