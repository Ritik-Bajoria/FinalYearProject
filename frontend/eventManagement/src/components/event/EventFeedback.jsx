import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Rating, TextField, Button, 
  List, ListItem, Avatar, Divider, Paper,
  CircularProgress, Alert, Chip, Stack
} from '@mui/material';
import { 
  Feedback, Person, CalendarToday, 
  ThumbUp, ThumbDown, SentimentSatisfiedAlt,
  SentimentDissatisfied, SentimentVeryDissatisfied
} from '@mui/icons-material';

const EventFeedback = ({ eventId, showNotification }) => {
  const [feedbackList, setFeedbackList] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  // In a real implementation, you would use the useEventApi hook
  // const { loading, error, getEventFeedback, submitFeedback } = useEventApi();

  useEffect(() => {
    const fetchFeedback = async () => {
      try {
        setLoading(true);
        setError(null);
        // const feedbackData = await getEventFeedback(eventId);
        // setFeedbackList(feedbackData);
        
        // Mock data for demonstration
        setTimeout(() => {
          setFeedbackList([
            {
              id: 1,
              user: { full_name: 'Alex Johnson', avatar_url: '' },
              rating: 5,
              comment: 'This event was amazing! Great organization and content.',
              submitted_at: new Date(Date.now() - 86400000).toISOString()
            },
            {
              id: 2,
              user: { full_name: 'Sam Wilson', avatar_url: '' },
              rating: 4,
              comment: 'Really enjoyed the speakers. Venue could have been better.',
              submitted_at: new Date(Date.now() - 172800000).toISOString()
            }
          ]);
          setLoading(false);
        }, 800);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to fetch feedback');
        showNotification('Failed to fetch feedback', 'error');
        setLoading(false);
      }
    };
    fetchFeedback();
  }, [eventId]);

  const handleSubmitFeedback = async () => {
    if (rating === 0) return;
    
    try {
      setLoading(true);
      // In a real app, you would use:
      // await submitFeedback(eventId, rating, comment);
      // const updatedFeedback = await getEventFeedback(eventId);
      // setFeedbackList(updatedFeedback);
      
      // Mock submission
      setTimeout(() => {
        const newFeedback = {
          id: Date.now(),
          user: { full_name: 'You', avatar_url: '' },
          rating,
          comment,
          submitted_at: new Date().toISOString()
        };
        setFeedbackList([newFeedback, ...feedbackList]);
        setRating(0);
        setComment('');
        setHasSubmitted(true);
        setLoading(false);
        showNotification('Feedback submitted successfully!', 'success');
      }, 500);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit feedback');
      showNotification('Failed to submit feedback', 'error');
      setLoading(false);
    }
  };

  const getRatingLabel = (value) => {
    switch(value) {
      case 1: return 'Very Dissatisfied';
      case 2: return 'Dissatisfied';
      case 3: return 'Neutral';
      case 4: return 'Satisfied';
      case 5: return 'Very Satisfied';
      default: return '';
    }
  };

  const getRatingIcon = (value) => {
    switch(value) {
      case 1: return <SentimentVeryDissatisfied color="error" />;
      case 2: return <SentimentDissatisfied color="warning" />;
      case 3: return <SentimentSatisfiedAlt color="info" />;
      case 4: return <ThumbUp color="primary" />;
      case 5: return <ThumbUp color="success" />;
      default: return null;
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Box display="flex" alignItems="center" mb={3}>
        <Feedback color="primary" sx={{ mr: 1, fontSize: 32 }} />
        <Typography variant="h5" component="h2">
          Event Feedback
        </Typography>
      </Box>

      {!hasSubmitted && (
        <Paper elevation={2} sx={{ mb: 4, p: 3 }}>
          <Typography variant="h6" gutterBottom>
            Share Your Experience
          </Typography>
          <Box mb={2}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              How would you rate this event?
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Rating
                value={rating}
                onChange={(_, newValue) => setRating(newValue)}
                size="large"
                icon={getRatingIcon(rating)}
                emptyIcon={<SentimentSatisfiedAlt />}
              />
              {rating > 0 && (
                <Chip 
                  label={getRatingLabel(rating)} 
                  variant="outlined"
                  icon={getRatingIcon(rating)}
                />
              )}
            </Box>
          </Box>
          
          <TextField
            fullWidth
            multiline
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Tell us more about your experience..."
            variant="outlined"
            sx={{ mb: 2 }}
          />
          
          <Button
            variant="contained"
            onClick={handleSubmitFeedback}
            disabled={rating === 0 || loading}
            startIcon={<Feedback />}
          >
            {loading ? 'Submitting...' : 'Submit Feedback'}
          </Button>
        </Paper>
      )}

      <Typography variant="h6" gutterBottom>
        Participant Feedback
      </Typography>
      
      {loading && feedbackList.length === 0 ? (
        <Box display="flex" justifyContent="center" my={4}>
          <CircularProgress />
        </Box>
      ) : error && feedbackList.length === 0 ? (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      ) : feedbackList.length === 0 ? (
        <Paper sx={{ p: 3, textAlign: 'center' }}>
          <Feedback sx={{ fontSize: 60, color: 'text.secondary', mb: 1 }} />
          <Typography variant="h6">No Feedback Yet</Typography>
          <Typography color="text.secondary">
            Be the first to share your thoughts about this event
          </Typography>
        </Paper>
      ) : (
        <List disablePadding>
          {feedbackList.map((feedback) => (
            <React.Fragment key={feedback.id}>
              <ListItem alignItems="flex-start" sx={{ py: 2 }}>
                <Avatar sx={{ mr: 2, bgcolor: 'primary.main' }}>
                  {feedback.user.full_name.charAt(0)}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight="medium">
                      {feedback.user.full_name}
                    </Typography>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CalendarToday fontSize="small" color="action" />
                      <Typography variant="caption" color="text.secondary">
                        {new Date(feedback.submitted_at).toLocaleDateString()}
                      </Typography>
                    </Stack>
                  </Box>
                  
                  <Box display="flex" alignItems="center" my={1}>
                    <Rating 
                      value={feedback.rating} 
                      readOnly 
                      icon={getRatingIcon(feedback.rating)}
                      emptyIcon={<SentimentSatisfiedAlt />}
                    />
                    <Typography variant="caption" color="text.secondary" ml={1}>
                      {getRatingLabel(feedback.rating)}
                    </Typography>
                  </Box>
                  
                  {feedback.comment && (
                    <Typography variant="body1" paragraph sx={{ whiteSpace: 'pre-line' }}>
                      {feedback.comment}
                    </Typography>
                  )}
                </Box>
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}
    </Paper>
  );
};

export default EventFeedback;