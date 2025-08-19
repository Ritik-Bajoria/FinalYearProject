import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, 
  Grid, List, ListItem, ListItemText, Divider,
  Chip, Dialog, DialogTitle, DialogContent, 
  DialogActions, TextField, Snackbar, Alert,
  CircularProgress, IconButton, Paper
} from '@mui/material';
import { 
  Add, Close, VolunteerActivism, Edit, Delete,
  CheckCircle, People, Work
} from '@mui/icons-material';
import axios from 'axios';

const VolunteerPostings = ({ eventId, showNotification }) => {
  const [postings, setPostings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openForm, setOpenForm] = useState(false);
  const [editingPosting, setEditingPosting] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    positions_available: 1
  });

  const fetchVolunteerPostings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/events/${eventId}/volunteer-postings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setPostings(response.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to fetch volunteer postings');
      showNotification('Failed to fetch volunteer postings', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVolunteerPostings();
  }, [eventId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'positions_available' ? parseInt(value) : value
    });
  };

  const handleSubmit = async () => {
    try {
      if (editingPosting) {
        await axios.put(
          `/api/events/${eventId}/volunteer-postings/${editingPosting.posting_id}`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        showNotification('Volunteer posting updated successfully', 'success');
      } else {
        await axios.post(
          `/api/events/${eventId}/volunteer-postings`,
          formData,
          {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
          }
        );
        showNotification('Volunteer posting created successfully', 'success');
      }
      setOpenForm(false);
      setEditingPosting(null);
      fetchVolunteerPostings();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to save volunteer posting', 'error');
    }
  };

  const handleEdit = (posting) => {
    setEditingPosting(posting);
    setFormData({
      title: posting.title,
      description: posting.description,
      requirements: posting.requirements,
      positions_available: posting.positions_available
    });
    setOpenForm(true);
  };

  const handleDelete = async () => {
    try {
      await axios.delete(
        `/api/events/${eventId}/volunteer-postings/${confirmDelete.posting_id}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      showNotification('Volunteer posting deleted successfully', 'success');
      setConfirmDelete(null);
      fetchVolunteerPostings();
    } catch (err) {
      showNotification(err.response?.data?.error || 'Failed to delete volunteer posting', 'error');
    }
  };

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" component="h2">
          Volunteer Opportunities
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => {
            setFormData({
              title: '',
              description: '',
              requirements: '',
              positions_available: 1
            });
            setEditingPosting(null);
            setOpenForm(true);
          }}
        >
          New Posting
        </Button>
      </Box>

      {loading && !postings.length ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error && !postings.length ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : postings.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <VolunteerActivism sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6" gutterBottom>
            No Volunteer Postings Yet
          </Typography>
          <Typography color="text.secondary">
            Create a volunteer posting to recruit volunteers for your event
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {postings.map((posting) => (
            <Grid item xs={12} md={6} key={posting.posting_id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                    <Typography variant="h6" gutterBottom>
                      {posting.title}
                    </Typography>
                    <Box>
                      <IconButton 
                        size="small" 
                        onClick={() => handleEdit(posting)}
                        color="primary"
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                      <IconButton 
                        size="small" 
                        onClick={() => setConfirmDelete(posting)}
                        color="error"
                      >
                        <Delete fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  
                  <Box display="flex" alignItems="center" mb={1}>
                    <People fontSize="small" color="action" sx={{ mr: 1 }} />
                    <Typography variant="body2" color="text.secondary">
                      {posting.positions_available} position{posting.positions_available !== 1 ? 's' : ''} available
                    </Typography>
                  </Box>
                  
                  <Typography variant="body1" paragraph>
                    {posting.description}
                  </Typography>
                  
                  {posting.requirements && (
                    <>
                      <Typography variant="subtitle2" gutterBottom>
                        Requirements:
                      </Typography>
                      <Typography variant="body2" paragraph>
                        {posting.requirements}
                      </Typography>
                    </>
                  )}
                  
                  <Box mt={2}>
                    <Chip 
                      icon={<Work fontSize="small" />}
                      label="Volunteer Position"
                      size="small"
                      color="secondary"
                    />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Add/Edit Form Dialog */}
      <Dialog open={openForm} onClose={() => setOpenForm(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {editingPosting ? 'Edit Volunteer Posting' : 'Create Volunteer Posting'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" sx={{ pt: 1 }}>
            <TextField
              fullWidth
              label="Title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={4}
              required
            />
            <TextField
              fullWidth
              label="Requirements (optional)"
              name="requirements"
              value={formData.requirements}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={2}
            />
            <TextField
              fullWidth
              label="Positions Available"
              name="positions_available"
              type="number"
              value={formData.positions_available}
              onChange={handleInputChange}
              margin="normal"
              inputProps={{ min: 1 }}
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenForm(false)}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="primary"
            startIcon={editingPosting ? <Edit /> : <Add />}
          >
            {editingPosting ? 'Update' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the volunteer posting "{confirmDelete?.title}"?
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDelete(null)}>Cancel</Button>
          <Button 
            onClick={handleDelete} 
            variant="contained" 
            color="error"
            startIcon={<Delete />}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default VolunteerPostings;