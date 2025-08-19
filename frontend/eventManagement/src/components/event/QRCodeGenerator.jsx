import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, 
  Grid, CircularProgress, Dialog, DialogContent,
  IconButton, Snackbar, Alert
} from '@mui/material';
import { QrCode, Close } from '@mui/icons-material';
import { QRCodeCanvas } from 'qrcode.react'; // Changed import
import axios from 'axios';

const QRCodeGenerator = ({ eventId, showNotification }) => {
  const [qrData, setQrData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const fetchQRCodeData = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`/api/events/${eventId}/qr-code`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      setQrData(response.data.qr_data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate QR code');
      showNotification('Failed to generate QR code', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    if (!qrData) {
      fetchQRCodeData();
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const downloadQRCode = () => {
    const canvas = document.getElementById('qr-code-canvas');
    if (canvas) {
      const pngUrl = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.href = pngUrl;
      downloadLink.download = `event-${eventId}-qr-code.png`;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    }
  };

  return (
    <Card sx={{ p: 2 }}>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Event Check-in QR Code
        </Typography>
        <Typography variant="body1" paragraph>
          Generate a QR code that can be scanned by event organizers to check you in to the event.
        </Typography>
        
        {loading && (
          <Box display="flex" justifyContent="center" my={3}>
            <CircularProgress />
          </Box>
        )}
        
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        
        <Button
          variant="contained"
          color="primary"
          startIcon={<QrCode />}
          onClick={handleOpenDialog}
          disabled={loading}
        >
          {qrData ? 'View QR Code' : 'Generate QR Code'}
        </Button>
        
        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <Box display="flex" justifyContent="space-between" alignItems="center" p={2}>
            <Typography variant="h6">Your Event QR Code</Typography>
            <IconButton onClick={handleCloseDialog}>
              <Close />
            </IconButton>
          </Box>
          <DialogContent>
            <Box display="flex" flexDirection="column" alignItems="center">
              {qrData && (
                <>
                  <Box p={2} border={1} borderColor="divider" borderRadius={1} mb={2}>
                    <QRCodeCanvas // Changed component name
                      id="qr-code-canvas"
                      value={qrData} 
                      size={256}
                      level="H"
                      includeMargin={true}
                    />
                  </Box>
                  <Button 
                    variant="outlined" 
                    onClick={downloadQRCode}
                    sx={{ mb: 2 }}
                  >
                    Download QR Code
                  </Button>
                  <Typography variant="body2" color="textSecondary">
                    Show this QR code to event staff for check-in
                  </Typography>
                </>
              )}
            </Box>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default QRCodeGenerator;