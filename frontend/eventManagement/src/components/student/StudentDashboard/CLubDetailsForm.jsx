import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    TextField,
    Button,
    Grid,
    Avatar,
    IconButton,
    Box,
    Typography
} from '@mui/material';
import { Edit as EditIcon, Close as CloseIcon } from '@mui/icons-material';

const ClubDetailsForm = ({ open, onClose, onSubmit, club }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: '',
        club_details: '',
        established_date: '',
        logo_url: null,
        image_url: null
    });
    const [logoPreview, setLogoPreview] = useState('');
    const [imagePreview, setImagePreview] = useState('');

    useEffect(() => {
        if (club) {
            setFormData({
                name: club.name || '',
                description: club.description || '',
                category: club.category || '',
                club_details: club.club_details || '',
                established_date: club.established_date?.split('T')[0] || '',
                logo_url: null,
                image_url: null
            });
            setLogoPreview(club.logo_url || '');
            setImagePreview(club.image_url || '');
        }
    }, [club, open]); // Added open to dependency array to reset when dialog reopens

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        const { name, files } = e.target;
        if (files && files[0]) {
            setFormData(prev => ({ ...prev, [name]: files[0] }));
            
            const reader = new FileReader();
            reader.onload = (event) => {
                if (name === 'logo_url') {
                    setLogoPreview(event.target.result);
                } else {
                    setImagePreview(event.target.result);
                }
            };
            reader.readAsDataURL(files[0]);
        }
    };

    const handleSubmit = () => {
        const data = new FormData();
        
        // Append all fields including files
        Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
                // For files, we append the file object directly
                if (key === 'logo_url' || key === 'image_url') {
                    if (formData[key] instanceof File) {
                        data.append(key, formData[key]);
                    } else if (formData[key] === null && club[key]) {
                        // If no new file was uploaded but there's an existing URL
                        // You might want to handle this case differently
                        data.append(key, club[key]);
                    }
                } else {
                    // For other fields, append as string
                    data.append(key, formData[key]);
                }
            }
        });

        // Ensure established_date is properly formatted
        if (formData.established_date) {
            data.set('established_date', formData.established_date);
        }

        onSubmit(data);
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>
                <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6">Edit Club Details</Typography>
                    <IconButton onClick={onClose}>
                        <CloseIcon />
                    </IconButton>
                </Box>
            </DialogTitle>
            <DialogContent dividers>
                <Grid container spacing={3}>
                    <Grid item xs={12} md={6}>
                        <TextField
                            fullWidth
                            label="Club Name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            margin="normal"
                            required
                        />
                        <TextField
                            fullWidth
                            label="Description"
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                        <TextField
                            fullWidth
                            label="Category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            margin="normal"
                        />
                        <TextField
                            fullWidth
                            label="Established Date"
                            name="established_date"
                            type="date"
                            value={formData.established_date}
                            onChange={handleChange}
                            margin="normal"
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid item xs={12} md={6}>
                        <Box mb={2}>
                            <Typography variant="subtitle1" gutterBottom>
                                Club Logo
                            </Typography>
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    src={logoPreview}
                                    sx={{ width: 80, height: 80, mr: 2 }}
                                />
                                <Button variant="contained" component="label">
                                    Upload Logo
                                    <input
                                        type="file"
                                        name="logo_url"
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            </Box>
                        </Box>
                        <Box mb={2}>
                            <Typography variant="subtitle1" gutterBottom>
                                Club Banner Image
                            </Typography>
                            <Box display="flex" alignItems="center">
                                <Avatar
                                    variant="square"
                                    src={imagePreview}
                                    sx={{ width: 80, height: 80, mr: 2 }}
                                />
                                <Button variant="contained" component="label">
                                    Upload Image
                                    <input
                                        type="file"
                                        name="image_url"
                                        hidden
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </Button>
                            </Box>
                        </Box>
                        <TextField
                            fullWidth
                            label="Additional Club Details"
                            name="club_details"
                            value={formData.club_details}
                            onChange={handleChange}
                            margin="normal"
                            multiline
                            rows={4}
                        />
                    </Grid>
                </Grid>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button 
                    onClick={handleSubmit} 
                    color="primary" 
                    variant="contained"
                    disabled={!formData.name} // Disable if required fields are empty
                >
                    Save Changes
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default ClubDetailsForm;