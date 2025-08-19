import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Table, TableHead, TableBody,
  TableRow, TableCell, Checkbox, Paper, Button,
  CircularProgress, Alert, Chip, TextField, Stack,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Tooltip, IconButton
} from '@mui/material';
import {
  People, CheckCircle, EventAvailable, Search,
  QrCode, Close, PersonAdd, PersonRemove,
  Download, Print, FilterList
} from '@mui/icons-material';

const EventAttendance = ({ eventId, showNotification }) => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // In a real implementation, you would use the useEventApi hook
  // const { loading, error, getEventAttendance, markAttendance } = useEventApi();

  useEffect(() => {
    const fetchAttendance = async () => {
      try {
        setLoading(true);
        setError(null);
        // const attendanceData = await getEventAttendance(eventId);
        // setAttendance(attendanceData);
        
        // Mock data for demonstration
        setTimeout(() => {
          setAttendance([
            {
              user_id: '1',
              user: { full_name: 'Alex Johnson', email: 'alex@example.com' },
              attended: true,
              check_in_time: new Date(Date.now() - 3600000).toISOString(),
              status: 'present'
            },
            {
              user_id: '2',
              user: { full_name: 'Sam Wilson', email: 'sam@example.com' },
              attended: false,
              check_in_time: null,
              status: 'absent'
            },
            {
              user_id: '3',
              user: { full_name: 'Taylor Smith', email: 'taylor@example.com' },
              attended: true,
              check_in_time: new Date(Date.now() - 7200000).toISOString(),
              status: 'present'
            }
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch attendance');
        showNotification('Failed to fetch attendance', 'error');
        setLoading(false);
      }
    };
    fetchAttendance();
  }, [eventId]);

  const handleToggleAttendance = async (userId) => {
    try {
      setLoading(true);
      // In a real app, you would use:
      // await markAttendance(eventId, userId);
      // const updatedAttendance = await getEventAttendance(eventId);
      // setAttendance(updatedAttendance);
      
      // Mock update
      setTimeout(() => {
        setAttendance(attendance.map(attendee => 
          attendee.user_id === userId 
            ? { 
                ...attendee, 
                attended: !attendee.attended,
                check_in_time: !attendee.attended ? new Date().toISOString() : null,
                status: !attendee.attended ? 'present' : 'absent'
              } 
            : attendee
        ));
        setLoading(false);
        showNotification(
          `Attendance ${!attendance.find(a => a.user_id === userId).attended ? 'marked' : 'unmarked'} successfully`,
          'success'
        );
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update attendance');
      showNotification('Failed to update attendance', 'error');
      setLoading(false);
    }
  };

  const handleBulkCheckIn = () => {
    // In a real app, you would implement bulk check-in functionality
    showNotification('Bulk check-in would be implemented here', 'info');
  };

  const handleExportAttendance = () => {
    // In a real app, you would implement export functionality
    showNotification('Export functionality would be implemented here', 'info');
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
            startIcon={<QrCode />}
            onClick={() => setOpenQRDialog(true)}
          >
            QR Check-in
          </Button>
          <Button
            variant="outlined"
            startIcon={<Download />}
            onClick={handleExportAttendance}
          >
            Export
          </Button>
        </Stack>
      </Box>

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
        <Button
          variant="contained"
          color="primary"
          startIcon={<PersonAdd />}
          onClick={handleBulkCheckIn}
        >
          Bulk Check-in
        </Button>
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
                <TableCell>Attendee</TableCell>
                <TableCell>Email</TableCell>
                <TableCell align="center">Status</TableCell>
                <TableCell>Check-in Time</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAttendance.map((attendee) => (
                <TableRow key={attendee.user_id} hover>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={2}>
                      <Avatar>
                        {attendee.user.full_name.charAt(0)}
                      </Avatar>
                      {attendee.user.full_name}
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

      {/* QR Check-in Dialog */}
      <Dialog open={openQRDialog} onClose={() => setOpenQRDialog(false)} maxWidth="sm">
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            QR Code Check-in
            <IconButton onClick={() => setOpenQRDialog(false)}>
              <Close />
            </IconButton>
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box textAlign="center" p={3}>
            <Typography variant="h6" gutterBottom>
              Scan QR Code to Check-in
            </Typography>
            <Box p={2} border={1} borderColor="divider" borderRadius={1} mb={2}>
              {/* In a real app, you would display the actual QR code */}
              <Box 
                width={256} 
                height={256} 
                bgcolor="#f5f5f5" 
                display="flex" 
                alignItems="center" 
                justifyContent="center"
              >
                <Typography color="text.secondary">QR Code Placeholder</Typography>
              </Box>
            </Box>
            <Typography variant="body2" color="text.secondary">
              Show this QR code to attendees for self check-in
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenQRDialog(false)}>Close</Button>
          <Button 
            variant="contained" 
            startIcon={<Print />}
            onClick={() => showNotification('Print functionality would be implemented here', 'info')}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default EventAttendance;