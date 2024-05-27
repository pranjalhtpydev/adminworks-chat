import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getAuth, RecaptchaVerifier, signInWithPhoneNumber, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-auth.js";
import { getDatabase, ref, set, get, push, onChildAdded, update } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// Your Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyBr8DFXT9jK53PSmbhqf2CbsQdyHTp9GXc",
    authDomain: "adminwork-af748.firebaseapp.com",
    databaseURL: "https://adminwork-af748-default-rtdb.firebaseio.com",
    projectId: "adminwork-af748",
    storageBucket: "adminwork-af748.appspot.com",
    messagingSenderId: "771867273912",
    appId: "1:771867273912:web:1febfdcc26648c1fff224d",
    measurementId: "G-C8QC2D0BB0"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);

const phoneNumberInput = document.getElementById('phone-number');
const sendOtpButton = document.getElementById('send-otp');
const otpInput = document.getElementById('otp');
const verifyOtpButton = document.getElementById('verify-otp');
const authSection = document.getElementById('auth-section');

const groupSection = document.getElementById('group-section');
const createGroupBtn = document.getElementById('create-group-btn');
const joinGroupBtn = document.getElementById('join-group-btn');
const showJoinedGroupsBtn = document.getElementById('show-joined-groups-btn');
const joinedGroupsMenu = document.getElementById('joined-groups-menu');
const createGroupDiv = document.getElementById('create-group');
const joinGroupDiv = document.getElementById('join-group');
const createGroupSubmit = document.getElementById('create-group-submit');
const joinGroupSubmit = document.getElementById('join-group-submit');
const signoutBtn = document.getElementById('signout-btn');
const signoutChatBtn = document.getElementById('signout-chat-btn');

const groupNameInput = document.getElementById('group-name');
const groupIdInput = document.getElementById('group-id');
const groupPasswordInput = document.getElementById('group-password');
const searchGroupIdInput = document.getElementById('search-group-id');
const joinGroupPasswordInput = document.getElementById('join-group-password');

const chatSection = document.getElementById('chat-section');
const messagesDiv = document.getElementById('messages');
const messageInput = document.getElementById('message-input');
const sendMessageButton = document.getElementById('send-message');
const settingsBtn = document.getElementById('settings-btn');
const settingsDiv = document.getElementById('settings');
const usernameInput = document.getElementById('username-input');
const saveUsernameBtn = document.getElementById('save-username');
const backToGroupsBtn = document.getElementById('back-to-groups-btn');

let currentUser, currentGroup, currentUsername;

// Auto login
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadCurrentUser();
        authSection.style.display = 'none';
        groupSection.style.display = 'block';
    } else {
        authSection.style.display = 'block';
        groupSection.style.display = 'none';
        chatSection.style.display = 'none';
    }
});

// Authentication with OTP
sendOtpButton.addEventListener('click', () => {
    const phoneNumber = phoneNumberInput.value;
    const appVerifier = new RecaptchaVerifier('send-otp', {
        'size': 'invisible',
        'callback': (response) => {
            // reCAPTCHA solved, allow send OTP
        }
    }, auth);
    signInWithPhoneNumber(auth, phoneNumber, appVerifier)
        .then((confirmationResult) => {
            window.confirmationResult = confirmationResult;
            otpInput.style.display = 'block';
            verifyOtpButton.style.display = 'block';
        }).catch((error) => console.error("Error during signInWithPhoneNumber", error));
});

verifyOtpButton.addEventListener('click', () => {
    const otp = otpInput.value;
    window.confirmationResult.confirm(otp).then((result) => {
        currentUser = result.user;
        authSection.style.display = 'none';
        groupSection.style.display = 'block';
    }).catch((error) => console.error("Error during confirmationResult.confirm", error));
});

// Group creation and joining
// Group creation and joining
createGroupBtn.addEventListener('click', () => {
    createGroupDiv.style.display = 'block';
    joinGroupDiv.style.display = 'none';
});

joinGroupBtn.addEventListener('click', () => {
    joinGroupDiv.style.display = 'block';
    createGroupDiv.style.display = 'none';
});

createGroupSubmit.addEventListener('click', () => {
    const groupName = groupNameInput.value;
    const groupId = groupIdInput.value;
    const groupPassword = groupPasswordInput.value;

    set(ref(db, 'groups/' + groupId), {
        name: groupName,
        password: groupPassword
    }).then(() => {
        currentGroup = groupId;
        set(ref(db, 'users/' + currentUser.uid + '/joinedGroups/' + groupId), groupName);
        groupSection.style.display = 'none';
        chatSection.style.display = 'block';
    }).catch((error) => console.error("Error during group creation", error));
});

joinGroupSubmit.addEventListener('click', () => {
    const groupId = searchGroupIdInput.value;
    const groupPassword = joinGroupPasswordInput.value;

    get(ref(db, 'groups/' + groupId)).then((snapshot) => {
        if (snapshot.exists()) {
            const group = snapshot.val();
            if (group.password === groupPassword) {
                currentGroup = groupId;
                set(ref(db, 'users/' + currentUser.uid + '/joinedGroups/' + groupId), group.name);
                groupSection.style.display = 'none';
                chatSection.style.display = 'block';
            } else {
                alert('Incorrect password');
            }
        } else {
            alert('Group not found');
        }
    }).catch((error) => console.error("Error during group join", error));
});

// Sign out
signoutBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        currentUser = null;
        authSection.style.display = 'block';
        groupSection.style.display = 'none';
        chatSection.style.display = 'none';
    }).catch((error) => console.error("Error during sign out", error));
});

signoutChatBtn.addEventListener('click', () => {
    signOut(auth).then(() => {
        currentUser = null;
        authSection.style.display = 'block';
        groupSection.style.display = 'none';
        chatSection.style.display = 'none';
    }).catch((error) => console.error("Error during sign out", error));
});

// Messaging
sendMessageButton.addEventListener('click', () => {
    const message = messageInput.value;
    if (message.trim() !== '') {
        push(ref(db, 'messages/' + currentGroup), {
            user: currentUsername || 'Anonymous',
            message: message,
            timestamp: Date.now()
        });
        messageInput.value = '';
    }
});

const loadMessages = () => {
    onChildAdded(ref(db, 'messages/' + currentGroup), (snapshot) => {
        const message = snapshot.val();
        const messageElement = document.createElement('div');
        messageElement.innerText = `${message.user}: ${message.message}`;
        messagesDiv.appendChild(messageElement);
        messagesDiv.scrollTop = messagesDiv.scrollHeight; // Scroll to the bottom
    });
};

// Load messages when chat section becomes visible
const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target.style.display === 'block') {
            loadMessages();
        }
    });
});

observer.observe(chatSection, { attributes: true });

// Load current username
const loadCurrentUser = () => {
    get(ref(db, 'users/' + currentUser.uid)).then((snapshot) => {
        if (snapshot.exists()) {
            currentUsername = snapshot.val().username;
            usernameInput.value = currentUsername;
        }
    }).catch((error) => console.error("Error loading current user data", error));
};

// Run when the chat section is displayed to load the username
const chatObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.target.style.display === 'block') {
            loadCurrentUser();
        }
    });
});

chatObserver.observe(chatSection, { attributes: true });

// Update username
saveUsernameBtn.addEventListener('click', () => {
    const newUsername = usernameInput.value;
    if (newUsername.trim() !== '') {
        update(ref(db, 'users/' + currentUser.uid), {
            username: newUsername
        }).then(() => {
            currentUsername = newUsername;
            alert('Username updated successfully');
        }).catch((error) => console.error("Error updating username", error));
    }
});

// Back to group section
backToGroupsBtn.addEventListener('click', () => {
    chatSection.style.display = 'none';
    groupSection.style.display = 'block';
});

// Show joined groups
showJoinedGroupsBtn.addEventListener('click', () => {
    if (joinedGroupsMenu.style.display === 'none') {
        loadJoinedGroups();
        joinedGroupsMenu.style.display = 'block';
    } else {
        joinedGroupsMenu.style.display = 'none';
    }
});

const loadJoinedGroups = () => {
    get(ref(db, 'users/' + currentUser.uid + '/joinedGroups')).then((snapshot) => {
        if (snapshot.exists()) {
            const groups = snapshot.val();
            joinedGroupsMenu.innerHTML = ''; // Clear existing menu items
            Object.keys(groups).forEach((groupId) => {
                const menuItem = document.createElement('div');
                menuItem.textContent = groups[groupId];
                menuItem.addEventListener('click', () => {
                    currentGroup = groupId;
                    groupSection.style.display = 'none';
                    chatSection.style.display = 'block';
                    loadMessages();
                });
                joinedGroupsMenu.appendChild(menuItem);
            });
        }
    }).catch((error) => console.error("Error loading joined groups", error));
};

// Auto login (included from the previous part)
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUser = user;
        loadCurrentUser();
        authSection.style.display = 'none';
        groupSection.style.display = 'block';
    } else {
        authSection.style.display = 'block';
        groupSection.style.display = 'none';
        chatSection.style.display = 'none';
    }
});