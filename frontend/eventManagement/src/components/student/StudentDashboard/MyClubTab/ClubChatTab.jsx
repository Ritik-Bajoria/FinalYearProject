import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Crown, 
  MessageCircle, 
  Users, 
  MoreHorizontal,
  Heart,
  ThumbsUp,
  Pin,
  Copy,
  Reply,
  Edit3,
  Trash2,
  Image,
  FileText,
  Search,
  Filter,
  UserPlus
} from 'lucide-react';
import useSocket from '../../../hooks/useSocket';
import './ClubChatTab.css';

const ClubChatTab = ({ club, isLeader, showNotification, refetch, currentUser, messages = [] }) => {
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const typingTimeoutRef = useRef(null);
    const [isRecording, setIsRecording] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [replyTo, setReplyTo] = useState(null);
    const messagesEndRef = useRef(null);
    const textareaRef = useRef(null);
    
    // Initialize socket connection
    const { 
        messages: socketMessages, 
        typingUsers, 
        sendMessage, 
        sendTypingStatus,
        isConnected 
    } = useSocket(club?.club_id, currentUser?.user_id);
    
    // Combine initial messages with socket messages
    const allMessages = [...(messages || []), ...socketMessages];

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !club?.club_id) return;

        setIsSending(true);
        try {
            await sendMessage(newMessage.trim());
            setNewMessage('');
            // Stop typing indicator when message is sent
            sendTypingStatus(false);
            showNotification?.('Message sent!', 'success');
        } catch (error) {
            showNotification?.(error.message || 'Failed to send message', 'error');
        } finally {
            setIsSending(false);
        }
    };

    const handleTyping = (typing) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
        }
        
        sendTypingStatus(typing);
        
        if (typing) {
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingStatus(false);
            }, 3000);
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [allMessages]);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        } else {
            // Send typing indicator when user types (but not when sending)
            handleTyping(true);
        }
    };

    const handleInputChange = (e) => {
        setNewMessage(e.target.value);
        // Send typing indicator when user types
        if (e.target.value.trim()) {
            handleTyping(true);
        } else {
            handleTyping(false);
        }
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInMs = now - date;
        const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
        const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
        const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        if (diffInHours < 24) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        if (diffInDays < 7) return date.toLocaleDateString([], { weekday: 'short', hour: '2-digit', minute: '2-digit' });
        return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
    };



    const filteredMessages = allMessages.filter(msg => 
        !searchQuery || msg.message_text.toLowerCase().includes(searchQuery.toLowerCase()) ||
        msg.sender_name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Filter out current user from typing users (so user doesn't see themselves typing)
    const otherTypingUsers = typingUsers.filter(userId => userId !== currentUser?.user_id);
    const isOthersTyping = otherTypingUsers.length > 0;

    return (
        <div className="club-chat-container">
            {/* Fixed Header */}
            <div className="club-chat-header">
                <div className="club-chat-header-content">
                    <div className="club-chat-header-left">
                        <div className="club-chat-icon-container">
                            <div className="club-chat-icon">
                                <MessageCircle style={{ width: '1.5rem', height: '1.5rem', color: 'white' }} />
                            </div>
                            <div className={`club-chat-status-dot ${isConnected ? 'club-chat-status-connected' : 'club-chat-status-disconnected'}`}></div>
                        </div>
                        <div>
                            <h2 className="club-chat-title">
                                Club Chat
                            </h2>
                            <div className="club-chat-subtitle">
                                <div className="club-chat-connection-info">
                                    <div className={`club-chat-connection-dot ${isConnected ? 'connected' : 'disconnected'}`}></div>
                                    <Users style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                                    <span className="club-chat-member-count">
                                        {isConnected ? (
                                            allMessages.length > 0 ? `${new Set(allMessages.map(m => m.sender_id)).size} active` : 'Connected'
                                        ) : 'Disconnected'}
                                    </span>
                                </div>
                                <div className="club-chat-divider"></div>
                                <span className="club-chat-message-count">
                                    {allMessages.length} messages
                                </span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="club-chat-header-right">
                        {/* Search Button */}
                        <div className="club-chat-search-container">
                            <button 
                                onClick={() => setShowSearch(!showSearch)}
                                className="club-chat-search-btn"
                                title="Search messages"
                            >
                                <Search style={{ width: '1rem', height: '1rem', color: '#64748b' }} />
                            </button>
                        </div>
                        
                        {isLeader && (
                            <div className="club-chat-leader-badge">
                                <Crown style={{ width: '1rem', height: '1rem', color: '#d97706' }} />
                                <span style={{ fontSize: '0.875rem', fontWeight: '600', color: '#92400e' }}>Leader</span>
                            </div>
                        )}
                    </div>
                </div>

                {/* Search Bar */}
                {showSearch && (
                    <div className="club-chat-search-bar">
                        <Search className="club-chat-search-icon" />
                        <input
                            type="text"
                            placeholder="Search messages or members..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="club-chat-search-input"
                        />
                    </div>
                )}
            </div>

            {/* Reply Banner */}
            {replyTo && (
                <div className="club-chat-reply-banner">
                    <div className="club-chat-reply-content">
                        <Reply style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                        <div>
                            <p className="club-chat-reply-text">Replying to {replyTo.sender_name}</p>
                            <p className="club-chat-reply-preview">{replyTo.message_text}</p>
                        </div>
                    </div>
                    <button 
                        onClick={() => setReplyTo(null)}
                        className="club-chat-reply-close"
                    >
                        <MoreHorizontal style={{ width: '1rem', height: '1rem', color: '#2563eb' }} />
                    </button>
                </div>
            )}

            {/* Messages Container - Fixed Height with Scroll */}
            <div 
                className="club-chat-messages"
                style={{ 
                    height: showSearch ? 'calc(100% - 280px)' : 'calc(100% - 240px)',
                    minHeight: '300px'
                }}
            >
                {/* Background Elements */}
                <div className="club-chat-bg-element-1"></div>
                <div className="club-chat-bg-element-2"></div>

                {filteredMessages.length === 0 ? (
                    <div className="club-chat-empty-state">
                        <div className="club-chat-empty-icon">
                            <div className="club-chat-empty-icon-bg">
                                <MessageCircle style={{ width: '2.5rem', height: '2.5rem', color: '#64748b' }} />
                            </div>
                            <div className="club-chat-empty-badge">
                                <span style={{ color: 'white', fontSize: '0.875rem' }}>✨</span>
                            </div>
                        </div>
                        <h3 className="club-chat-empty-title">
                            {searchQuery ? 'No messages found' : 'Welcome to Club Chat!'}
                        </h3>
                        <p className="club-chat-empty-description">
                            {searchQuery 
                                ? `No messages match "${searchQuery}". Try a different search term.`
                                : 'Start meaningful conversations with your club members!'
                            }
                        </p>
                    </div>
                ) : (
                    <div className="club-chat-messages-content">
                        {filteredMessages.map((message, index) => {
                            const isLeaderMessage = message.sender_id === club?.leader_id;
                            const showAvatar = index === 0 || filteredMessages[index - 1].sender_id !== message.sender_id;
                            
                            return (
                                <div key={message.message_id} className="club-chat-message">
                                    <div className="club-chat-message-content">
                                        {/* Avatar */}
                                        <div className="club-chat-avatar">
                                            {showAvatar ? (
                                                <div className={`club-chat-avatar-img ${
                                                    isLeaderMessage 
                                                        ? 'club-chat-avatar-leader' 
                                                        : `club-chat-avatar-${['blue', 'green', 'purple', 'pink', 'indigo', 'yellow', 'red', 'teal', 'cyan', 'emerald'][message.sender_id % 10]}`
                                                }`}>
                                                    {message.sender_avatar ? (
                                                        <img 
                                                            src={message.sender_avatar} 
                                                            alt={message.sender_name}
                                                            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                                                        />
                                                    ) : (
                                                        message.sender_name?.charAt(0)?.toUpperCase() || '?'
                                                    )}
                                                    {isLeaderMessage && (
                                                        <div className="club-chat-avatar-crown">
                                                            <Crown style={{ width: '0.625rem', height: '0.625rem', color: 'white' }} />
                                                        </div>
                                                    )}
                                                </div>
                                            ) : (
                                                <div style={{ width: '2.5rem', height: '2.5rem' }} />
                                            )}
                                        </div>

                                        {/* Message Content */}
                                        <div className="club-chat-message-body">
                                            {showAvatar && (
                                                <div className="club-chat-message-header">
                                                    <span className="club-chat-sender-name">
                                                        {message.sender_name}
                                                    </span>
                                                    {isLeaderMessage && (
                                                        <div className="club-chat-leader-tag">
                                                            <Crown style={{ width: '0.75rem', height: '0.75rem', color: '#d97706' }} />
                                                            <span className="club-chat-leader-tag-text">Leader</span>
                                                        </div>
                                                    )}
                                                    <span className="club-chat-timestamp">
                                                        {formatTimestamp(message.sent_at)}
                                                    </span>
                                                </div>
                                            )}
                                            
                                            <div className={`club-chat-message-text ${isLeaderMessage ? 'leader' : 'member'}`}>
                                                <p style={{ color: '#1e293b', lineHeight: '1.6', wordBreak: 'break-words', fontSize: '0.875rem' }}>
                                                    {message.message_text}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message Actions */}
                                    <div className="club-chat-message-actions">
                                        <div className="club-chat-actions-container">
                                            <button className="club-chat-action-btn copy" title="Copy">
                                                <Copy style={{ width: '0.75rem', height: '0.75rem' }} />
                                            </button>
                                            <button className="club-chat-action-btn pin" title="Pin">
                                                <Pin style={{ width: '0.75rem', height: '0.75rem' }} />
                                            </button>
                                            <button className="club-chat-action-btn more" title="More">
                                                <MoreHorizontal style={{ width: '0.75rem', height: '0.75rem' }} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        <div ref={messagesEndRef} />
                    </div>
                )}
            </div>

            {/* Typing Indicator */}
            {isOthersTyping && (
                <div className="club-chat-typing">
                    <div className="club-chat-typing-content">
                        <div className="club-chat-typing-dots">
                            <div className="club-chat-typing-dot"></div>
                            <div className="club-chat-typing-dot"></div>
                            <div className="club-chat-typing-dot"></div>
                        </div>
                        <span className="club-chat-typing-text">
                            {otherTypingUsers.length === 1 ? 'Someone is typing...' : `${otherTypingUsers.length} people are typing...`}
                        </span>
                    </div>
                </div>
            )}

            {/* Fixed Input Area */}
            <div className="club-chat-input-area">
                <div className="club-chat-input-container">
                    <div className="club-chat-input-wrapper">
                        <textarea
                            ref={textareaRef}
                            value={newMessage}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            placeholder={replyTo ? `Reply to ${replyTo.sender_name}...` : "Share your thoughts..."}
                            disabled={isSending}
                            className="club-chat-textarea"
                            rows={1}
                            onInput={(e) => {
                                e.target.style.height = 'auto';
                                e.target.style.height = Math.min(e.target.scrollHeight, 128) + 'px';
                            }}
                        />
                    </div>
                    
                    {/* Send Button */}
                    <button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || isSending}
                        className={`club-chat-send-btn ${
                            newMessage.trim() && !isSending ? 'active' : 'inactive'
                        }`}
                        title="Send message"
                    >
                        {isSending ? (
                            <div className="club-chat-send-spinner" />
                        ) : (
                            <Send style={{ width: '1.25rem', height: '1.25rem' }} />
                        )}
                    </button>
                </div>
                
                {/* Input Tips */}
                <div className="club-chat-input-tips">
                    <div className="club-chat-tips-text">
                        <span style={{ fontWeight: '500' }}>Enter</span> to send • <span style={{ fontWeight: '500' }}>Shift + Enter</span> for new line
                    </div>
                    {newMessage.length > 0 && (
                        <div className="club-chat-char-count">
                            {newMessage.length} characters
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ClubChatTab;