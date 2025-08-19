import React from 'react';
import { Box, Typography, List, ListItem, ListItemText, Avatar, Chip } from '@mui/material';

const ClubMembersTab = ({ members, club }) => {
    return (
        <Box>
            <Typography variant="h5" sx={{ mb: 2 }}>Club Members</Typography>
            <List>
                {members.map(member => (
                    <ListItem key={member.user_id}>
                        <Avatar
                            alt={member.full_name}
                            src={`http://127.0.0.1:7000/${member.profile_picture.replace(/\\/g, '/')}`}
                            sx={{ mr: 2, bgcolor: '#FFC107' }}
                        />
                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                    {member.full_name}
                                    {member.user_id === club.leader_id && (
                                        <Chip label="Leader" size="small" sx={{ ml: 1 }} color="primary" />
                                    )}
                                </Box>
                            }
                            secondary={member.email}
                        />
                    </ListItem>
                ))}
            </List>
        </Box>
    );
};

export default ClubMembersTab;