import React, { useState, useEffect } from 'react';
import {
    Box,
    Tabs,
    Tab,
    CircularProgress,
    Typography,
    Button,
    Snackbar,
    Alert,
    Avatar,
    Chip
} from '@mui/material';

// Icons
import StarIcon from '@mui/icons-material/Star';
import EventIcon from '@mui/icons-material/Event';
import ChatIcon from '@mui/icons-material/Chat';
import SettingsIcon from '@mui/icons-material/Settings';
import PeopleIcon from '@mui/icons-material/People';

// Hooks
import useClubApi from '../../../hooks/useClubApi';

// Tabs
import ClubEventsTab from './ClubEventsTab';
import ClubChatTab from './ClubChatTab';
import ClubManagementTab from './ClubManagementTab';
import ClubDetailsTab from './CLubDetailsTab';
import ClubMembersTab from './ClubMembersTab';


const MyClubTab = ({ user }) => {
    const [activeSubTab, setActiveSubTab] = useState('events');
    const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

    const {
        club,
        events,
        pastEvents,
        members,
        messages,
        pendingRequests,
        loading,
        error,
        refetch,
        sendMessage,
        leaveClub,
        createEvent,
        updateClubDetails,
        deleteClub,
        approveMember,
        rejectMember,
        removeMember,
        changeLeader,
        getPendingRequests
    } = useClubApi(user.user_id);
    
    const isLeader = club?.leader_id === user.user_id;
    const showNotification = (message, severity) => {
        setNotification({ open: true, message, severity });
    };

    const handleCloseNotification = () => {
        setNotification(prev => ({ ...prev, open: false }));
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error">Error loading club data: {error}</Typography>
                <Button variant="contained" onClick={refetch} sx={{ ml: 2 }}>
                    Retry
                </Button>
            </Box>
        );
    }

    if (!club) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="h6">You are not currently a member of any club.</Typography>
                <Typography variant="body1" sx={{ mt: 2 }}>
                    Visit the Club Dashboard to join or create a club.
                </Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 2 }}>
            <Snackbar
                open={notification.open}
                autoHideDuration={6000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
                    {notification.message}
                </Alert>
            </Snackbar>

            {/* Club Header */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                <Avatar
                    alt={club.name}
                    src={`http://127.0.0.1:7000/${club.logo_url.replace(/\\/g, '/')}`}
                    sx={{ width: 56, height: 56, mr: 2, bgcolor: '#FFC107' }}
                />
                <Box>
                    <Typography variant="h4">{club.name}</Typography>
                    <Typography variant="subtitle1" color="text.secondary">
                        {club.category} • {club.member_count} members
                    </Typography>
                </Box>
                {isLeader && (
                    <Chip label="Leader" color="primary" icon={<StarIcon />} sx={{ ml: 2 }} />
                )}
            </Box>

            {/* Main Tabs */}
            <Tabs
                value={activeSubTab}
                onChange={(_, newValue) => setActiveSubTab(newValue)}
                sx={{ mb: 3 }}
                variant="scrollable"
                scrollButtons="auto"
            >
                <Tab label="Events" value="events" icon={<EventIcon />} />
                <Tab label="Chat" value="chat" icon={<ChatIcon />} />
                {isLeader ? (
                    <Tab label="Management" value="management" icon={<SettingsIcon />} />
                ) : (
                    <Tab label="Members" value="members" icon={<PeopleIcon />} />
                )}
                <Tab label="Details" value="details" icon={<SettingsIcon />} />
            </Tabs>

            {/* Tab Content */}
            {activeSubTab === 'events' && (
                <ClubEventsTab
                    club={club}
                    events={events}
                    pastEvents={pastEvents}
                    isLeader={isLeader}
                    showNotification={showNotification}
                    refetch={refetch}
                />
            )}

            {activeSubTab === 'chat' && (
                <ClubChatTab
                    club={club}
                    messages={messages}
                    isLeader={isLeader}
                    showNotification={showNotification}
                    sendMessage={sendMessage}
                    refetch={refetch}
                    currentUser={user}
                />
            )}

            {activeSubTab === 'management' && isLeader && (
                <ClubManagementTab
                    club={club}
                    members={members}
                    pendingRequests={pendingRequests}
                    showNotification={showNotification}
                    refetch={refetch}
                    getPendingRequests={getPendingRequests}
                    approveMember={approveMember}
                    rejectMember={rejectMember}
                    removeMember={removeMember}
                    changeLeader={changeLeader}
                />
            )}

            {activeSubTab === 'members' && (
                <ClubMembersTab members={members} club={club} />
            )}

            {activeSubTab === 'details' && (
                <ClubDetailsTab
                    club={club}
                    members={members}
                    isLeader={isLeader}
                    showNotification={showNotification}
                    refetch={refetch}
                    updateClubDetails={updateClubDetails}
                    deleteClub={deleteClub}
                    leaveClub={leaveClub}
                    currentUser={user}
                />
            )}
        </Box>
    );
};

export default MyClubTab;
