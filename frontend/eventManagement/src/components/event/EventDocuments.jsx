import React, { useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    ListItemSecondaryAction,
    IconButton,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Alert,
    CircularProgress,
    Chip
} from '@mui/material';
import {
    AttachFile as AttachFileIcon,
    CloudUpload as UploadIcon,
    Download as DownloadIcon,
    Description as DocumentIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    InsertDriveFile as FileIcon
} from '@mui/icons-material';
import useEventApi from '../hooks/useEventApi';

const EventDocuments = ({ eventId, userRole, showNotification }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(false);
    const [uploadDialog, setUploadDialog] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    
    const { uploadEventDocument } = useEventApi();

    useEffect(() => {
        fetchDocuments();
    }, [eventId]);

    const fetchDocuments = async () => {
        setLoading(true);
        try {
            // This would be implemented in the backend to get event documents
            // For now, we'll use mock data
            const mockDocuments = [
                {
                    document_id: 1,
                    file_name: 'Event_Guidelines.pdf',
                    file_path: '/uploads/events/1/Event_Guidelines.pdf',
                    uploaded_by: 1,
                    uploaded_at: new Date().toISOString(),
                    file_size: 1024000,
                    file_type: 'application/pdf'
                },
                {
                    document_id: 2,
                    file_name: 'Schedule.docx',
                    file_path: '/uploads/events/1/Schedule.docx',
                    uploaded_by: 1,
                    uploaded_at: new Date().toISOString(),
                    file_size: 512000,
                    file_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
                }
            ];
            setDocuments(mockDocuments);
        } catch (error) {
            showNotification('Failed to load documents', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file) {
            // Check file size (max 10MB)
            if (file.size > 10 * 1024 * 1024) {
                showNotification('File size must be less than 10MB', 'error');
                return;
            }
            setSelectedFile(file);
            setUploadDialog(true);
        }
    };

    const handleUpload = async () => {
        if (!selectedFile) return;

        setUploading(true);
        try {
            await uploadEventDocument(eventId, selectedFile);
            setUploadDialog(false);
            setSelectedFile(null);
            fetchDocuments(); // Refresh documents list
            showNotification('Document uploaded successfully', 'success');
        } catch (error) {
            showNotification('Failed to upload document', 'error');
        } finally {
            setUploading(false);
        }
    };

    const handleDownload = (document) => {
        // Create a download link
        const link = document.createElement('a');
        link.href = `${import.meta.env.VITE_API_BASE_URL}/uploads${document.file_path}`;
        link.download = document.file_name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getFileIcon = (fileType) => {
        if (fileType?.includes('pdf')) return <PdfIcon color="error" />;
        if (fileType?.includes('image')) return <ImageIcon color="primary" />;
        if (fileType?.includes('document') || fileType?.includes('word')) return <DocumentIcon color="info" />;
        return <FileIcon />;
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString([], {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6">Event Documents</Typography>
                {userRole === 'organizer' && (
                    <Button
                        variant="contained"
                        startIcon={<UploadIcon />}
                        component="label"
                    >
                        Upload Document
                        <input
                            type="file"
                            hidden
                            onChange={handleFileSelect}
                            accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.jpg,.jpeg,.png,.gif"
                        />
                    </Button>
                )}
            </Box>

            {userRole !== 'organizer' && (
                <Alert severity="info" sx={{ mb: 2 }}>
                    Only organizers can upload documents. You can download available documents below.
                </Alert>
            )}

            <Paper sx={{ border: 1, borderColor: 'divider' }}>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : documents.length === 0 ? (
                    <Box sx={{ textAlign: 'center', p: 4 }}>
                        <AttachFileIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                            No documents available
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {userRole === 'organizer' 
                                ? 'Upload documents to share with participants'
                                : 'Documents will appear here when organizers upload them'
                            }
                        </Typography>
                    </Box>
                ) : (
                    <List>
                        {documents.map((document, index) => (
                            <ListItem
                                key={document.document_id}
                                divider={index < documents.length - 1}
                            >
                                <ListItemIcon>
                                    {getFileIcon(document.file_type)}
                                </ListItemIcon>
                                <ListItemText
                                    primary={
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="subtitle1">
                                                {document.file_name}
                                            </Typography>
                                            <Chip
                                                label={formatFileSize(document.file_size)}
                                                size="small"
                                                variant="outlined"
                                            />
                                        </Box>
                                    }
                                    secondary={`Uploaded on ${formatDate(document.uploaded_at)}`}
                                />
                                <ListItemSecondaryAction>
                                    <IconButton
                                        edge="end"
                                        onClick={() => handleDownload(document)}
                                        title="Download"
                                    >
                                        <DownloadIcon />
                                    </IconButton>
                                </ListItemSecondaryAction>
                            </ListItem>
                        ))}
                    </List>
                )}
            </Paper>

            {/* Upload Confirmation Dialog */}
            <Dialog open={uploadDialog} onClose={() => setUploadDialog(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Upload Document</DialogTitle>
                <DialogContent>
                    {selectedFile && (
                        <Box>
                            <Typography variant="subtitle1" gutterBottom>
                                File: {selectedFile.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                                Size: {formatFileSize(selectedFile.size)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                This document will be available to all event participants for download.
                            </Typography>
                        </Box>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setUploadDialog(false)} disabled={uploading}>
                        Cancel
                    </Button>
                    <Button
                        onClick={handleUpload}
                        variant="contained"
                        disabled={uploading}
                        startIcon={uploading ? <CircularProgress size={20} /> : <UploadIcon />}
                    >
                        {uploading ? 'Uploading...' : 'Upload'}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default EventDocuments;