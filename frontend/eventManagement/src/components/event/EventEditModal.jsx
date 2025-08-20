import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Chip,
  Stack,
  Box,
  Typography,
  IconButton,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment
} from '@mui/material';
import {
  Close,
  Add,
  Delete,
  Image as ImageIcon,
  Schedule,
  CalendarToday,
  People,
  Category,
  Receipt,
  EventAvailable
} from '@mui/icons-material';

const theme = {
  primary: '#1A237E',
  secondary: '#0D47A1',
  background: '#ECEFF1',
  surface: '#FFFFFF',
  accent: '#FFC107',
  text: '#212121',
  mutedText: '#607D8B'
};

const EventEditModal = ({ 
  open, 
  onClose, 
  event, 
  onSave, 
  loading = false 
}) => {
  const [editData, setEditData] = useState({
    title: event?.title || '',
    description: event?.description || '',
    venue: event?.venue || '',
    event_date: event?.event_date ? new Date(event.event_date).toISOString().split('T')[0] : '',
    event_time: event?.event_date ? new Date(event.event_date).toTimeString().slice(0, 5) : '12:00',
    duration_minutes: event?.duration_minutes || 60,
    target_audience: event?.target_audience || 'All',
    capacity: event?.capacity || 100,
    category: event?.category || '',
    estimated_budget: event?.estimated_budget || 0,
    registration_end_date: event?.registration_end_date ? new Date(event.registration_end_date).toISOString().split('T')[0] : '',
    tags: event?.event_tags ? event.event_tags.map(tag => tag.tag_name) : [],
    newTag: ''
  });

  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(event?.image_url || '');

  const handleInputChange = (field) => (e) => {
    const value = e.target.value;
    setEditData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddTag = () => {
    if (editData.newTag.trim() && !editData.tags.includes(editData.newTag.trim())) {
      setEditData(prev => ({
        ...prev,
        tags: [...prev.tags, prev.newTag.trim()],
        newTag: ''
      }));
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setEditData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview('');
  };

  const handleSubmit = () => {
    const formData = new FormData();
    
    // Append all form data
    Object.keys(editData).forEach(key => {
      if (key !== 'newTag' && key !== 'event_date' && key !== 'event_time') {
        if (key === 'tags') {
          editData.tags.forEach(tag => formData.append('tags', tag));
        } else {
          formData.append(key, editData[key]);
        }
      }
    });

    // Combine date and time
    if (editData.event_date && editData.event_time) {
      const dateTime = new Date(`${editData.event_date}T${editData.event_time}`);
      formData.append('event_date', dateTime.toISOString());
    }

    // Append image file if selected
    if (imageFile) {
      formData.append('image', imageFile);
    }

    onSave(formData);
  };

  const audienceOptions = ['All', 'Students', 'Faculty', 'Staff', 'Public'];
  const categoryOptions = [
    'Workshop', 'Seminar', 'Conference', 'Social', 'Sports',
    'Cultural', 'Technical', 'Academic', 'Networking', 'Other'
  ];

  return (
    <Dialog 
      open={open} 
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
          boxShadow: '0 8px 32px rgba(26, 35, 126, 0.12)'
        }
      }}
    >
      <DialogTitle sx={{ 
        color: theme.primary,
        fontWeight: 600,
        borderBottom: `1px solid ${theme.background}`,
        p: 3,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        Edit Event Details
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Grid container spacing={3}>
          {/* Left Column - Basic Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: theme.primary, mb: 2 }}>
              Basic Information
            </Typography>

            <TextField
              fullWidth
              label="Event Title"
              value={editData.title}
              onChange={handleInputChange('title')}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              multiline
              rows={3}
              label="Description"
              value={editData.description}
              onChange={handleInputChange('description')}
              sx={{ mb: 2 }}
            />

            <TextField
              fullWidth
              label="Venue"
              value={editData.venue}
              onChange={handleInputChange('venue')}
              sx={{ mb: 2 }}
            />

            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={editData.category}
                label="Category"
                onChange={handleInputChange('category')}
              >
                {categoryOptions.map(category => (
                  <MenuItem key={category} value={category}>
                    {category}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Date"
                  type="date"
                  value={editData.event_date}
                  onChange={handleInputChange('event_date')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="Time"
                  type="time"
                  value={editData.event_time}
                  onChange={handleInputChange('event_time')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <TextField
              fullWidth
              label="Duration (minutes)"
              type="number"
              value={editData.duration_minutes}
              onChange={handleInputChange('duration_minutes')}
              sx={{ mb: 2 }}
            />
          </Grid>

          {/* Right Column - Additional Info */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" sx={{ color: theme.primary, mb: 2 }}>
              Additional Information
            </Typography>

            {/* Image Upload */}
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Event Image
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <input
                  accept="image/*"
                  style={{ display: 'none' }}
                  id="event-image-upload"
                  type="file"
                  onChange={handleImageChange}
                />
                <label htmlFor="event-image-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    startIcon={<ImageIcon />}
                    size="small"
                  >
                    Upload Image
                  </Button>
                </label>
                {imagePreview && (
                  <Button
                    variant="outlined"
                    color="error"
                    size="small"
                    onClick={handleRemoveImage}
                    startIcon={<Delete />}
                  >
                    Remove
                  </Button>
                )}
              </Box>
              {imagePreview && (
                <Box sx={{ mt: 1 }}>
                  <img
                    src={imagePreview}
                    alt="Event preview"
                    style={{
                      width: '100%',
                      height: '120px',
                      objectFit: 'cover',
                      borderRadius: '8px'
                    }}
                  />
                </Box>
              )}
            </Box>

            {/* Budget */}
            <TextField
              fullWidth
              label="Estimated Budget"
              type="number"
              value={editData.estimated_budget}
              onChange={handleInputChange('estimated_budget')}
              InputProps={{
                startAdornment: <InputAdornment position="start">$</InputAdornment>,
              }}
              sx={{ mb: 2 }}
            />

            {/* Registration End Date */}
            <TextField
              fullWidth
              label="Registration End Date"
              type="date"
              value={editData.registration_end_date}
              onChange={handleInputChange('registration_end_date')}
              InputLabelProps={{ shrink: true }}
              sx={{ mb: 2 }}
            />

            {/* Target Audience */}
            <FormControl fullWidth sx={{ mb: 2 }}>
              <InputLabel>Target Audience</InputLabel>
              <Select
                value={editData.target_audience}
                label="Target Audience"
                onChange={handleInputChange('target_audience')}
              >
                {audienceOptions.map(audience => (
                  <MenuItem key={audience} value={audience}>
                    {audience}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {/* Capacity */}
            <TextField
              fullWidth
              label="Capacity"
              type="number"
              value={editData.capacity}
              onChange={handleInputChange('capacity')}
              sx={{ mb: 2 }}
            />

            {/* Tags */}
            <Box>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Event Tags
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
                <TextField
                  size="small"
                  placeholder="Add tag..."
                  value={editData.newTag}
                  onChange={(e) => setEditData(prev => ({ ...prev, newTag: e.target.value }))}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleAddTag();
                    }
                  }}
                />
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleAddTag}
                  startIcon={<Add />}
                >
                  Add
                </Button>
              </Box>
              <Stack direction="row" flexWrap="wrap" gap={1}>
                {editData.tags.map(tag => (
                  <Chip
                    key={tag}
                    label={tag}
                    size="small"
                    onDelete={() => handleRemoveTag(tag)}
                    sx={{
                      borderColor: theme.secondary,
                      color: theme.secondary,
                    }}
                  />
                ))}
              </Stack>
            </Box>
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button
          onClick={onClose}
          sx={{
            color: theme.mutedText,
            '&:hover': {
              backgroundColor: 'rgba(96, 125, 139, 0.04)'
            }
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          disabled={loading}
          sx={{
            backgroundColor: theme.primary,
            '&:hover': {
              backgroundColor: theme.secondary
            }
          }}
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default EventEditModal;