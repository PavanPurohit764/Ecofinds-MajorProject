import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { FiSend, FiUser, FiInfo, FiPlus, FiSettings, FiLogOut, FiEdit2 } from 'react-icons/fi'; // Assumed icon library already used
import apiClient from '../api/axios';

const ChatPage = () => {
    const { user } = useAuth();
    const {
        chats,
        activeChat,
        setActiveChat,
        messages,
        loadingChats,
        loadingMessages,
        sendMessage,
        typingUsers,
        accessChat,
        createGroupChat,
        renameGroup,
        addToGroup,
        removeFromGroup
    } = useChat();

    const location = useLocation();
    const [messageInput, setMessageInput] = useState('');

    // Group UI states
    const [showGroupModal, setShowGroupModal] = useState(false);
    const [groupName, setGroupName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [searchError, setSearchError] = useState(null);

    // Group Settings states
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [newChatName, setNewChatName] = useState('');

    useEffect(() => {
        const queryParams = new URLSearchParams(location.search);
        const sellerId = queryParams.get('seller');
        const userId = queryParams.get('userId');
        const targetId = userId || sellerId;

        if (targetId) {
            // Once the page loads, automatically try to create or load the chat
            accessChat(targetId).then((chat) => {
                if (chat) setActiveChat(chat);
            });
        }
    }, [location.search, accessChat, setActiveChat]);

    // Handle User Search for Group
    useEffect(() => {
        const delayDebounceFn = setTimeout(() => {
            if (searchQuery.trim().length > 1) {
                handleSearch(searchQuery);
            } else {
                setSearchResults([]);
            }
        }, 500);

        return () => clearTimeout(delayDebounceFn);
    }, [searchQuery]);

    const handleSearch = async (query) => {
        setLoadingSearch(true);
        setSearchError(null);
        try {
            console.log(`[FRONTEND] Searching for: ${query}`);
            const { data } = await apiClient.get(`/users/search?q=${query}`);
            console.log('[FRONTEND] Search Response:', data);
            
            // Success response format: { success: true, message: "...", data: { users: [...] } }
            const usersFound = data.data?.users || [];
            setSearchResults(usersFound);
            
            if (usersFound.length === 0) {
                console.warn(`[FRONTEND] No users found for query: ${query}`);
            }
        } catch (error) {
            console.error('Search failed:', error);
            setSearchError(error.response?.data?.message || 'Failed to search users. Please try again.');
        } finally {
            setLoadingSearch(false);
        }
    };

    const handleCreateGroup = async () => {
        if (!groupName || selectedUsers.length < 2) return;
        const userIds = selectedUsers.map(u => u._id);
        const newGroup = await createGroupChat(groupName, userIds);
        if (newGroup) {
            setActiveChat(newGroup);
            setShowGroupModal(false);
            setGroupName('');
            setSelectedUsers([]);
        }
    };

    const handleToggleUserSelection = (userToAdd) => {
        if (selectedUsers.find(u => u._id === userToAdd._id)) {
            setSelectedUsers(selectedUsers.filter(u => u._id !== userToAdd._id));
        } else {
            setSelectedUsers([...selectedUsers, userToAdd]);
        }
    };

    const handleStartIndividualChat = async (userId) => {
        const chat = await accessChat(userId);
        if (chat) {
            setActiveChat(chat);
            setShowGroupModal(false);
            setSearchQuery('');
            setSearchResults([]);
        }
    };

    const handleRenameGroup = async () => {
        if (!newChatName.trim()) return;
        const updated = await renameGroup(activeChat._id, newChatName);
        if (updated) setShowSettingsModal(false);
    };

    const handleLeaveGroup = async () => {
        if (!window.confirm('Are you sure you want to leave this group?')) return;
        await removeFromGroup(activeChat._id, user._id);
        setActiveChat(null);
        setShowSettingsModal(false);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!messageInput.trim() || !activeChat) return;

        try {
            await sendMessage(messageInput);
            setMessageInput('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const getChatPartner = (chatUsers) => {
        if (!chatUsers || !user) return null;
        return chatUsers.find(u => u._id !== user._id) || chatUsers[0];
    };

    return (
        <>
            <div className="flex bg-gray-50 max-w-7xl mx-auto h-[calc(100vh-64px)] overflow-hidden rounded-lg shadow-sm border border-gray-200 mt-0 lg:mt-6 mb-6">

                {/* Sidebar: Chat List */}
                <div className={`w-full md:w-1/3 bg-white border-r border-gray-200 flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
                        <h2 className="text-xl font-bold text-gray-800">Messages</h2>
                        <button
                            onClick={() => setShowGroupModal(true)}
                            className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors shadow-sm"
                            title="New Group Chat"
                        >
                            <FiPlus size={20} />
                        </button>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {loadingChats ? (
                            <div className="p-4 flex justify-center">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                            </div>
                        ) : chats.length === 0 ? (
                            <div className="p-8 text-center text-gray-500">
                                <FiInfo className="mx-auto h-8 w-8 mb-2 opacity-50" />
                                <p>No conversations yet.</p>
                                <p className="text-sm mt-1">Start a chat from a product page!</p>
                            </div>
                        ) : (
                            <ul className="divide-y divide-gray-100">
                                {chats.map((chat) => {
                                    const partner = getChatPartner(chat.users);
                                    const isActive = activeChat?._id === chat._id;

                                    return (
                                        <li
                                            key={chat._id}
                                            onClick={() => setActiveChat(chat)}
                                            className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${isActive ? 'bg-green-50/50 border-l-4 border-green-500' : 'border-l-4 border-transparent'}`}
                                        >
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                                                    {partner?.profileImage ? (
                                                        <img src={partner.profileImage} alt={partner.name} className="w-full h-full object-cover" />
                                                    ) : (
                                                        <FiUser className="h-6 w-6 text-gray-500" />
                                                    )}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex justify-between items-baseline text-sm">
                                                        <h3 className="font-semibold text-gray-900 truncate">
                                                            {chat.isGroupChat ? chat.chatName : (partner?.name || 'Unknown User')}
                                                        </h3>
                                                    </div>
                                                    <p className="text-sm text-gray-500 truncate mt-1">
                                                        {chat.latestMessage ? chat.latestMessage.content :
                                                            (typingUsers[chat._id] ? (
                                                                <span className="text-green-600 italic text-xs">typing...</span>
                                                            ) : "Start chatting!")}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>
                </div>

                {/* Main Area: Chat Window */}
                <div className={`flex-1 flex flex-col bg-gray-50 ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
                    {!activeChat ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                            <FiUser className="w-16 h-16 mb-4 text-gray-300" />
                            <p className="text-lg">Select a conversation to start chatting</p>
                        </div>
                    ) : (
                        <>
                            {/* Header */}
                            <div className="p-4 bg-white border-b border-gray-200 flex items-center space-x-3 shadow-sm z-10">
                                <button
                                    className="md:hidden p-2 -ml-2 text-gray-500 hover:bg-gray-100 rounded-full focus:outline-none"
                                    onClick={() => setActiveChat(null)}
                                >
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" /></svg>
                                </button>

                                {/* Partner Info */}
                                {(() => {
                                    const partner = getChatPartner(activeChat.users);
                                    return (
                                        <>
                                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                                                {partner?.profileImage ? (
                                                    <img src={partner.profileImage} alt={partner.name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <FiUser className="h-5 w-5 text-gray-500" />
                                                )}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-800 leading-tight">
                                                    {activeChat.isGroupChat ? activeChat.chatName : (partner?.name || 'Unknown User')}
                                                </h3>
                                                {typingUsers[activeChat._id] && (
                                                    <span className="text-xs text-green-600 italic">typing...</span>
                                                )}
                                            </div>
                                        </>
                                    );
                                })()}

                                {activeChat.isGroupChat && (
                                    <button
                                        onClick={() => {
                                            setNewChatName(activeChat.chatName);
                                            setShowSettingsModal(true);
                                        }}
                                        className="p-2 text-gray-400 hover:text-gray-600 transition-colors ml-auto"
                                    >
                                        <FiSettings size={20} />
                                    </button>
                                )}
                            </div>

                            {/* Messages Area */}
                            <div className="flex-1 p-4 overflow-y-auto bg-gray-50 flex flex-col space-y-4">
                                {loadingMessages ? (
                                    <div className="flex items-center justify-center h-full">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                                    </div>
                                ) : !Array.isArray(messages) ? (
                                    <div className="flex items-center justify-center h-full text-red-400 text-sm">
                                        Error loading messages.
                                    </div>
                                ) : messages.length === 0 ? (
                                    <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                        Send a message to start the conversation!
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isMine = msg.sender._id === user._id || msg.sender === user._id; // Accommodate populated and unpopulated sender
                                        return (
                                            <div key={msg._id || index} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                                <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMine ? 'bg-[#782355] text-white rounded-tr-sm' : 'bg-white text-gray-800 border border-gray-100 rounded-tl-sm'
                                                    }`}>
                                                    <p className="text-sm break-words whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={`text-[10px] text-right mt-1 ${isMine ? 'text-pink-200' : 'text-gray-400'}`}>
                                                        {new Date(msg.createdAt || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Input Area */}
                            <div className="p-4 bg-white border-t border-gray-200">
                                <form onSubmit={handleSendMessage} className="flex items-end space-x-2">
                                    <div className="flex-1 bg-gray-100 rounded-2xl overflow-hidden focus-within:ring-2 focus-within:ring-green-500 focus-within:border-transparent transition-all">
                                        <textarea
                                            value={messageInput}
                                            onChange={(e) => setMessageInput(e.target.value)}
                                            placeholder="Type a message..."
                                            className="w-full bg-transparent p-3 outline-none resize-none max-h-32 text-sm text-gray-800"
                                            rows="1"
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    handleSendMessage(e);
                                                }
                                            }}
                                        />
                                    </div>
                                    <button
                                        type="submit"
                                        disabled={!messageInput.trim()}
                                        className="p-3 bg-[#782355] text-white rounded-full hover:bg-pink-800 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm mb-0.5"
                                    >
                                        <FiSend size={18} />
                                    </button>
                                </form>
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* Create Group Modal */}
            {showGroupModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800 focus:outline-none">Create Group Chat</h3>
                            <button onClick={() => setShowGroupModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Group Name</label>
                                <input
                                    type="text"
                                    placeholder="Enter group name"
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    value={groupName}
                                    onChange={(e) => setGroupName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Add Members (min 2)</label>
                                <input
                                    type="text"
                                    placeholder="Search users..."
                                    className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {loadingSearch && <div className="mt-2 text-xs text-gray-500 italic">Searching...</div>}

                                <div className="mt-2 max-h-40 overflow-y-auto space-y-1">
                                    {loadingSearch && (
                                        <div className="flex items-center justify-center py-4 text-xs text-gray-500 italic">
                                            <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-green-600 mr-2"></div>
                                            Searching...
                                        </div>
                                    )}
                                    
                                    {searchError && (
                                        <div className="text-center py-2 text-xs text-red-500 bg-red-50 rounded-lg">
                                            {searchError}
                                        </div>
                                    )}

                                    {!loadingSearch && !searchError && searchQuery.trim().length > 1 && searchResults.length === 0 && (
                                        <div className="text-center py-4 text-xs text-gray-500 italic">
                                            No users found for "{searchQuery}"
                                        </div>
                                    )}

                                    {searchResults.map(u => (
                                        <div
                                            key={u._id}
                                            className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg group"
                                        >
                                            <div className="flex items-center space-x-2 flex-1 cursor-pointer" onClick={() => handleStartIndividualChat(u._id)}>
                                                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                    {u.avatar || u.profileImage ? <img src={u.avatar || u.profileImage} alt={u.name} className="w-full h-full object-cover" /> : <FiUser size={14} />}
                                                </div>
                                                <div>
                                                    <div className="text-sm font-medium">{u.name}</div>
                                                    <div className="text-[10px] text-gray-500">@{u.username}</div>
                                                </div>
                                            </div>
                                            <div 
                                                onClick={() => handleToggleUserSelection(u)}
                                                className={`w-5 h-5 rounded-full border flex items-center justify-center cursor-pointer ${selectedUsers.find(sel => sel._id === u._id) ? 'bg-green-500 border-green-500 text-white' : 'border-gray-300'}`}
                                            >
                                                {selectedUsers.find(sel => sel._id === u._id) && <span>&check;</span>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2 mt-2">
                                {selectedUsers.map(u => (
                                    <span key={u._id} className="inline-flex items-center px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                        {u.name}
                                        <button onClick={() => handleToggleUserSelection(u)} className="ml-1.5 focus:outline-none">&times;</button>
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end space-x-3">
                            <button
                                onClick={() => setShowGroupModal(false)}
                                className="px-4 py-2 text-gray-600 font-medium hover:text-gray-800 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleCreateGroup}
                                disabled={!groupName || selectedUsers.length < 2}
                                className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md"
                            >
                                Create Group
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Group Settings Modal */}
            {showSettingsModal && activeChat && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-800">Group Settings</h3>
                            <button onClick={() => setShowSettingsModal(false)} className="text-gray-400 hover:text-gray-600">&times;</button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Rename Group</label>
                                <div className="flex space-x-2">
                                    <input
                                        type="text"
                                        className="flex-1 px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none transition-all"
                                        value={newChatName}
                                        onChange={(e) => setNewChatName(e.target.value)}
                                    />
                                    <button
                                        onClick={handleRenameGroup}
                                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        <FiEdit2 />
                                    </button>
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Members</label>
                                <div className="max-h-40 overflow-y-auto space-y-2">
                                    {activeChat.users.map(u => (
                                        <div key={u._id} className="flex items-center space-x-2 text-sm">
                                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                                {u.profileImage ? <img src={u.profileImage} alt={u.name} className="w-full h-full object-cover" /> : <FiUser size={14} />}
                                            </div>
                                            <span className="flex-1 truncate">{u.name} {u._id === user._id && '(You)'}</span>
                                            {activeChat.groupAdmin?._id === user._id && u._id !== user._id && (
                                                <button
                                                    onClick={() => removeFromGroup(activeChat._id, u._id)}
                                                    className="text-red-500 hover:text-red-700 text-xs"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-gray-100">
                                <button
                                    onClick={handleLeaveGroup}
                                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors font-bold"
                                >
                                    <FiLogOut />
                                    <span>Leave Group</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ChatPage;
