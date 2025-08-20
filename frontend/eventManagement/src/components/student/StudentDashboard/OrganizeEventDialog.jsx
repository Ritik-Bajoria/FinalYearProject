import React, { useState, useEffect, useCallback } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  CircularProgress,
  Typography,
  Grid,
  Checkbox,
  FormControlLabel,
  Box,
  Avatar,
  IconButton
} from '@mui/material';
import { format, isBefore, isAfter, isToday, isValid } from 'date-fns';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';

const OrganizeEventDialog = ({ open, onClose, onSubmit, clubId, currentUserId }) => {
  const [eventData, setEventData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    end_date: '',
    venue: '',
    category: '',
    visibility: 'Public',
    capacity: 100,
    created_by: currentUserId,
    club_id: clubId,
    duration_minutes: '',
    target_audience: 'Students',
    is_recurring: false,
    is_certified: false,
    qr_check_in_enabled: true,
    registration_end_date: '',
    estimated_budget: 0,
    image: null,
    imagePreview: null
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  const [touched, setTouched] = useState({});

  useEffect(() => {
    if (open) {
      setEventData({
        title: '',
        description: '',
        date: '',
        time: '',
        end_date: '',
        venue: '',
        category: '',
        visibility: 'Public',
        capacity: 100,
        created_by: currentUserId,
        club_id: clubId,
        duration_minutes: '',
        target_audience: 'Students',
        is_recurring: false,
        is_certified: false,
        qr_check_in_enabled: true,
        registration_end_date: '',
        estimated_budget: 0,
        image: null,
        imagePreview: null
      });
      setErrors({});
      setTouched({});
      setSubmitError(null);
    }
  }, [open, currentUserId, clubId]);

  const handleBlur = (field) => {
    setTouched(prev => ({ ...prev, [field]: true }));
    validateField(field, eventData[field]);
  };

  const validateField = useCallback((field, value) => {
    let error = '';
    const now = new Date();

    switch (field) {
      case 'title':
        if (!value) error = 'Title is required';
        else if (/^\d+$/.test(value)) error = 'Title cannot be numbers only';
        else if (value.length > 255) error = 'Title must be 255 characters or less';
        break;
      case 'date':
        if (!value) error = 'Event date is required';
        else {
          const date = new Date(value);
          if (!isValid(date)) error = 'Invalid date format';
          else if (isBefore(date, new Date(now.setHours(0, 0, 0, 0)))) {
            error = 'Event date must be today or in the future';
          }
        }
        break;
      case 'time':
        if (!value) error = 'Event time is required';
        else if (eventData.date) {
          const eventDateTime = new Date(`${eventData.date}T${value}`);
          if (isBefore(eventDateTime, now) && isToday(new Date(eventData.date))) {
            error = 'Event time must be in the future';
          }
        }
        break;
      case 'end_date':
        if (value) {
          const endDate = new Date(value);
          const startDate = new Date(eventData.date);
          if (!isValid(endDate)) error = 'Invalid date format';
          else if (isBefore(endDate, startDate)) {
            error = 'End date must be same as or after start date';
          }
        }
        break;
      case 'venue':
        if (!value) error = 'Venue is required';
        else if (value.length > 255) error = 'Venue must be 255 characters or less';
        break;
      case 'duration_minutes':
        if (!value) error = 'Duration is required';
        else if (isNaN(value) || parseInt(value) <= 0) error = 'Duration must be a positive number';
        break;
      case 'registration_end_date':
        if (value) {
          const regEndDate = new Date(value);
          if (!isValid(regEndDate)) error = 'Invalid date/time format';
          else if (isBefore(regEndDate, now)) error = 'Registration end must be in the future';
          else if (eventData.end_date) {
            const endDate = new Date(eventData.end_date);
            if (isAfter(regEndDate, endDate)) {
              error = 'Registration must end before event ends';
            }
          }
        }
        break;
      case 'capacity':
        if (value && (isNaN(value) || parseInt(value) <= 0)) {
          error = 'Capacity must be a positive number';
        }
        break;
      case 'estimated_budget':
        if (value && (isNaN(value) || parseFloat(value) < 0)) {
          error = 'Budget must be a positive number';
        }
        break;
      case 'image':
        if (value && value.size > 5 * 1024 * 1024) {
          error = 'Image must be less than 5MB';
        }
        break;
      default:
        break;
    }

    setErrors(prev => ({ ...prev, [field]: error }));
    return !error;
  }, [eventData.date, eventData.end_date]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const newValue = type === 'checkbox' ? checked : value;

    setEventData(prev => ({ ...prev, [name]: newValue }));

    if (touched[name]) {
      validateField(name, newValue);
    }

    if (submitError) setSubmitError(null);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors(prev => ({ ...prev, image: 'Image must be less than 5MB' }));
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setEventData(prev => ({
          ...prev,
          image: file,
          imagePreview: reader.result
        }));
        setErrors(prev => ({ ...prev, image: '' }));
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setEventData(prev => ({
      ...prev,
      image: null,
      imagePreview: null
    }));
    setErrors(prev => ({ ...prev, image: '' }));
  };

  const validateForm = useCallback(() => {
    const requiredFields = ['title', 'date', 'time', 'venue', 'duration_minutes'];
    let isValid = true;
    const newErrors = {};

    requiredFields.forEach(field => {
      if (!validateField(field, eventData[field])) {
        isValid = false;
        newErrors[field] = errors[field] || `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    if (eventData.image && errors.image) {
      isValid = false;
      newErrors.image = errors.image;
    }

    setErrors(newErrors);
    return isValid;
  }, [eventData, errors, validateField]);

  const handleSubmit = async () => {
    setTouched({
      title: true,
      date: true,
      time: true,
      venue: true,
      duration_minutes: true,
      image: true
    });

    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      // Create a clean object without imagePreview
      const { imagePreview, ...cleanEventData } = eventData;

      // Add additional fields
      const submitData = {
        ...cleanEventData,
        approval_status: 'pending',
        event_status: 'upcoming'
      };

      console.log('Submitting event data:', submitData);
      await onSubmit(submitData);
      onClose();
    } catch (error) {
      console.error('Event creation failed:', error);
      setSubmitError(error.message || 'Failed to create event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const categories = ['Academic', 'Social', 'Sports', 'Cultural', 'Workshop', 'Other'];
  const visibilityOptions = ['Public', 'Private', 'Members Only'];
  const targetAudienceOptions = ['Students', 'Faculty', 'All', 'Club Members'];

  return (
    <Dialog open={open} onClose={!isSubmitting ? onClose : null} maxWidth="md" fullWidth>
      <DialogTitle>Organize New Event</DialogTitle>
      <DialogContent>
        {submitError && (
          <Typography color="error" variant="body2" gutterBottom>
            {submitError}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', my: 2 }}>
          <input
            accept="image/*"
            style={{ display: 'none' }}
            id="event-image-upload"
            type="file"
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
          <label htmlFor="event-image-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUploadIcon />}
              disabled={isSubmitting}
            >
              Upload Event Image
            </Button>
          </label>
          {errors.image && (
            <Typography color="error" variant="caption">
              {errors.image}
            </Typography>
          )}
          {eventData.imagePreview && (
            <Box sx={{ mt: 2, position: 'relative' }}>
              <Avatar
                src={eventData.imagePreview}
                variant="rounded"
                sx={{ width: 200, height: 120 }}
              />
              <IconButton
                size="small"
                color="error"
                onClick={removeImage}
                sx={{ position: 'absolute', top: 0, right: 0 }}
                disabled={isSubmitting}
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          )}
        </Box>

        <Grid>
          <Grid item xs={12}>
            <TextField
              fullWidth
              margin="dense"
              name="title"
              label="Event Title"
              value={eventData.title}
              onChange={handleChange}
              onBlur={() => handleBlur('title')}
              error={!!errors.title}
              helperText={errors.title || ' '}
              required
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="date"
              label="Event Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={eventData.date}
              onChange={handleChange}
              onBlur={() => handleBlur('date')}
              error={!!errors.date}
              helperText={errors.date || ' '}
              required
              disabled={isSubmitting}
              inputProps={{ min: format(new Date(), 'yyyy-MM-dd') }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="time"
              label="Event Time"
              type="time"
              InputLabelProps={{ shrink: true }}
              value={eventData.time}
              onChange={handleChange}
              onBlur={() => handleBlur('time')}
              error={!!errors.time}
              helperText={errors.time || ' '}
              required
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="end_date"
              label="End Date (optional)"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={eventData.end_date}
              onChange={handleChange}
              onBlur={() => handleBlur('end_date')}
              error={!!errors.end_date}
              helperText={errors.end_date || ' '}
              disabled={isSubmitting || !eventData.date}
              inputProps={{
                min: eventData.date || format(new Date(), 'yyyy-MM-dd')
              }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="duration_minutes"
              label="Duration (minutes)"
              type="number"
              value={eventData.duration_minutes}
              onChange={handleChange}
              onBlur={() => handleBlur('duration_minutes')}
              error={!!errors.duration_minutes}
              helperText={errors.duration_minutes || ' '}
              required
              disabled={isSubmitting}
              inputProps={{ min: 1 }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="registration_end_date"
              label="Registration Deadline"
              type="datetime-local"
              InputLabelProps={{ shrink: true }}
              value={eventData.registration_end_date}
              onChange={handleChange}
              onBlur={() => handleBlur('registration_end_date')}
              error={!!errors.registration_end_date}
              helperText={errors.registration_end_date || 'Must be before event ends'}
              disabled={isSubmitting}
              inputProps={{ min: format(new Date(), 'yyyy-MM-dd\'T\'HH:mm') }}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="venue"
              label="Venue"
              value={eventData.venue}
              onChange={handleChange}
              onBlur={() => handleBlur('venue')}
              error={!!errors.venue}
              helperText={errors.venue || ' '}
              required
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense" disabled={isSubmitting}>
              <InputLabel>Category</InputLabel>
              <Select
                name="category"
                value={eventData.category}
                onChange={handleChange}
                label="Category"
              >
                {categories.map(category => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense" disabled={isSubmitting}>
              <InputLabel>Visibility</InputLabel>
              <Select
                name="visibility"
                value={eventData.visibility}
                onChange={handleChange}
                label="Visibility"
              >
                {visibilityOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <FormControl fullWidth margin="dense" disabled={isSubmitting}>
              <InputLabel>Target Audience</InputLabel>
              <Select
                name="target_audience"
                value={eventData.target_audience}
                onChange={handleChange}
                label="Target Audience"
              >
                {targetAudienceOptions.map(option => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="capacity"
              label="Capacity"
              type="number"
              value={eventData.capacity}
              onChange={handleChange}
              onBlur={() => handleBlur('capacity')}
              error={!!errors.capacity}
              helperText={errors.capacity || ' '}
              inputProps={{ min: 1 }}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              margin="dense"
              name="estimated_budget"
              label="Estimated Budget ($)"
              type="number"
              value={eventData.estimated_budget}
              onChange={handleChange}
              onBlur={() => handleBlur('estimated_budget')}
              error={!!errors.estimated_budget}
              helperText={errors.estimated_budget || ' '}
              inputProps={{ min: 0, step: 0.01 }}
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  name="is_recurring"
                  checked={eventData.is_recurring}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Recurring Event"
              disabled={isSubmitting}
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  name="is_certified"
                  checked={eventData.is_certified}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Certified Event"
              disabled={isSubmitting}
            />
          </Grid>

          {/* <Grid item xs={12} sm={4}>
            <FormControlLabel
              control={
                <Checkbox
                  name="qr_check_in_enabled"
                  checked={eventData.qr_check_in_enabled}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label="Enable QR Check-in"
              disabled={isSubmitting}
            />
          </Grid> */}

          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              margin="dense"
              name="description"
              label="Description"
              value={eventData.description}
              onChange={handleChange}
              disabled={isSubmitting}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="primary"
          disabled={isSubmitting}
          endIcon={isSubmitting ? <CircularProgress size={24} /> : null}
        >
          {isSubmitting ? 'Creating...' : 'Create Event'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OrganizeEventDialog;