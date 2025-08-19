import React, { useState } from 'react';
import { Box, Typography, Card, CardContent, Button, Divider, Dialog, DialogTitle, DialogContent, DialogContentText, DialogActions, TextField } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import ClubDetailsForm from '../CLubDetailsForm';

const ClubDetailsTab = ({ club, members, isLeader, showNotification, refetch, updateClubDetails, deleteClub, leaveClub }) => {
    const [openDetailsForm, setOpenDetailsForm] = useState(false);
    const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
    const [deleteConfirmationText, setDeleteConfirmationText] = useState('');

    const handleDeleteClub = async () => {
        try {
            await deleteClub(club.club_id);
            showNotification('Club deleted successfully', 'success');
            setDeleteConfirmOpen(false);
            setDeleteConfirmationText('');
        } catch (error) {
            showNotification(error.message || 'Failed to delete club', 'error');
        }
    };

    return (
        <Box>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h5">Club Details</Typography>
                {isLeader && (
                    <Button
                        variant="outlined"
                        startIcon={<EditIcon />}
                        onClick={() => setOpenDetailsForm(true)}
                    >
                        Edit Details
                    </Button>
                )}
            </Box>

            <Card>
                <CardContent>
                    <Box sx={{ display: 'flex', mb: 3 }}>
                        <Box sx={{ width: 200, height: 200, mr: 3 }}>
                            {club.image_url ? (
                                <img 
                                    src={club.image_url
                                        ? `http://127.0.0.1:7000/${club.image_url.replace(/\\/g, '/')}`
                                        : 'http://127.0.0.1:7000/static/fallback/fallback.jpg'
                                    } 
                                    alt={club.name}
                                    style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 4 }}
                                />
                            ) : (
                                <Box sx={{ 
                                    width: '100%', 
                                    height: '100%', 
                                    bgcolor: '#E3F2FD',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    borderRadius: 1
                                }}>
                                    <PeopleIcon sx={{ fontSize: 60, color: '#90CAF9' }} />
                                </Box>
                            )}
                        </Box>
                        <Box sx={{ flexGrow: 1 }}>
                            <Typography variant="h6" gutterBottom>{club.name}</Typography>
                            <Typography variant="body1" paragraph>{club.description}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Category:</strong> {club.category}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                <strong>Established:</strong> {new Date(club.established_date).toLocaleDateString()}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" paragraph>
                                <strong>Members:</strong> {club.member_count}
                            </Typography>
                        </Box>
                    </Box>

                    <Divider sx={{ my: 2 }} />

                    <Typography variant="subtitle1" gutterBottom>Club Information</Typography>
                    <Typography variant="body1" paragraph>
                        {club.club_details || 'No additional information provided.'}
                    </Typography>

                    {isLeader && (
                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                            <Button
                                variant="contained"
                                color="error"
                                startIcon={<DeleteIcon />}
                                onClick={() => setDeleteConfirmOpen(true)}
                            >
                                Delete Club
                            </Button>
                        </Box>
                    )}

                    {!isLeader && (
                        <Button
                            variant="contained"
                            color="error"
                            onClick={leaveClub}
                            sx={{ mt: 2 }}
                        >
                            Leave Club
                        </Button>
                    )}
                </CardContent>
            </Card>

            <ClubDetailsForm
                open={openDetailsForm}
                onClose={() => setOpenDetailsForm(false)}
                onSubmit={updateClubDetails}
                club={club}
            />

            <Dialog
                open={deleteConfirmOpen}
                onClose={() => setDeleteConfirmOpen(false)}
            >
                <DialogTitle>Delete Club</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Are you sure you want to permanently delete this club? This action cannot be undone.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        margin="dense"
                        label="Type 'DELETE' to confirm"
                        fullWidth
                        variant="standard"
                        sx={{ mt: 2 }}
                        value={deleteConfirmationText}
                        onChange={(e) => setDeleteConfirmationText(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
                    <Button 
                        onClick={handleDeleteClub}
                        color="error"
                        variant="contained"
                        disabled={deleteConfirmationText !== "DELETE"}
                    >
                        Delete Club
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default ClubDetailsTab;