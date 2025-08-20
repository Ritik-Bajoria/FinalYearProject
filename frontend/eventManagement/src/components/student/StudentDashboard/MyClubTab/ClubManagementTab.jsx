import React, { useState } from 'react';
import { 
  Box, 
  Tabs, 
  Tab, 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Avatar, 
  Chip, 
  Badge, 
  Button, 
  Menu, 
  MenuItem, 
  IconButton 
} from '@mui/material';
import { 
  People as PeopleIcon, 
  Settings as SettingsIcon, 
  Star as StarIcon, 
  PersonRemove as PersonRemoveIcon, 
  MoreVert as MoreVertIcon 
} from '@mui/icons-material';

const ClubManagementTab = ({
    club,
    members,
    pendingRequests,
    showNotification,
    refetch,
    getPendingRequests,
    approveMember,
    rejectMember,
    removeMember,
    changeLeader
}) => {
    const [activeTab, setActiveTab] = useState('members');
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMember, setSelectedMember] = useState(null);

    const handleMenuOpen = (event, member) => {
        setAnchorEl(event.currentTarget);
        setSelectedMember(member);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedMember(null);
    };

    const handleMemberAction = async (action, memberId) => {
        try {
            if (action === 'remove') {
                await removeMember(club.club_id, memberId);
                showNotification('Member removed successfully', 'success');
            } else if (action === 'make_leader') {
                await changeLeader(club.club_id, memberId);
                showNotification('New leader appointed successfully', 'success');
            }
            handleMenuClose();
            await refetch();
        } catch (error) {
            showNotification(error.message || 'Action failed', 'error');
        }
    };
    
    const handleRequestAction = async (action, userId) => {
        try {
            if (action === 'approve') {
                await approveMember(club.club_id, userId);
                console.log("club_id", club.club_id);
                showNotification('Request approved successfully', 'success');
                console.log("club_id", club.club_id);
            } else if (action === 'reject') {
                await rejectMember(club.club_id, userId);
                showNotification('Request rejected', 'success');
            }
              await refetch();
            pendingRequests = await getPendingRequests(club.club_id);
        } catch (error) {
            showNotification(error.message || 'Action failed', 'error');
        }
    };

    return (
        <Box>
            <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} sx={{ mb: 2 }}>
                <Tab label="Members" value="members" />
                <Tab 
                    label={
                        <Badge badgeContent={pendingRequests.length} color="error">
                            Requests
                        </Badge>
                    } 
                    value="requests" 
                />
            </Tabs>

            {activeTab === 'members' && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Club Members</Typography>
                    <List>
                        {members.map(member => (
                            <ListItem 
                                key={member.user_id}
                                secondaryAction={
                                    member.user_id !== club.leader_id && (
                                        <IconButton edge="end" onClick={(e) => handleMenuOpen(e, member)}>
                                            <MoreVertIcon />
                                        </IconButton>
                                    )
                                }
                            >
                                <Avatar
                                    alt={member.full_name}
                                    src={`http://127.0.0.1:7000/${member.profile_picture}`}
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

                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleMenuClose}
                    >
                        <MenuItem 
                            onClick={() => handleMemberAction('make_leader', selectedMember.user_id)}
                            sx={{ color: 'primary.main' }}
                        >
                            <StarIcon sx={{ mr: 1 }} /> Make Leader
                        </MenuItem>
                        <MenuItem 
                            onClick={() => handleMemberAction('remove', selectedMember.user_id)}
                            sx={{ color: 'error.main' }}
                        >
                            <PersonRemoveIcon sx={{ mr: 1 }} /> Remove Member
                        </MenuItem>
                    </Menu>
                </Box>
            )}

            {activeTab === 'requests' && (
                <Box>
                    <Typography variant="h6" sx={{ mb: 2 }}>Pending Join Requests</Typography>
                    {pendingRequests.length === 0 ? (
                        <Typography sx={{ color: 'text.secondary' }}>No pending join requests</Typography>
                    ) : (
                        <List>
                            {pendingRequests.map(request => (
                                <ListItem 
                                    key={request.user_id}
                                    secondaryAction={
                                        <Box>
                                            <Button
                                                variant="contained"
                                                size="small"
                                                color="success"
                                                sx={{ mr: 1 }}
                                                onClick={() => handleRequestAction('approve', request.user_id)}
                                            >
                                                Approve
                                            </Button>
                                            <Button
                                                variant="outlined"
                                                size="small"
                                                color="error"
                                                onClick={() => handleRequestAction('reject', request.user_id)}
                                            >
                                                Reject
                                            </Button>
                                        </Box>
                                    }
                                >
                                    <Avatar
                                        alt={request.full_name}
                                        src={`http://127.0.0.1:7000/${request.profile_picture}`}
                                        sx={{ mr: 2, bgcolor: '#FFC107' }}
                                    />
                                    <ListItemText
                                        primary={request.full_name}
                                        secondary={request.email}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    )}
                </Box>
            )}
        </Box>
    );
};

export default ClubManagementTab;