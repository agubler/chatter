import { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Snackbar from '@mui/material/Snackbar';
import { VariableSizeList } from 'react-window';
import { customAlphabet } from 'nanoid/non-secure';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { CopyToClipboard } from 'react-copy-to-clipboard';

import UsernameDialog from './components/UsernameDialog';
import ChatWindow, { Message } from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import UserList from './components/UserList';

import { createClient, RealtimeChannel } from '@supabase/supabase-js';

const createIdentifier = customAlphabet('ABCDEFGHIJKLMNOP123456789', 6);

const drawerWidth = 240;

const isDevelopment = import.meta.env.DEV;

/** create the supabase client using the env variables */
const supabase = createClient(import.meta.env.VITE_SUPABASE_URL, import.meta.env.VITE_SUPABASE_ANON_KEY);

const Main = styled('main')(({ theme }) => ({
	position: 'relative',
	flexGrow: 1,
	display: 'flex',
	flexDirection: 'column',
	height: '100%',
	justifyContent: 'flex-end',
	paddingTop: theme.spacing(9),
	marginLeft: 0
}));

const AppBar = styled(MuiAppBar)(({ theme }) => ({
	transition: theme.transitions.create(['margin', 'width'], {
		easing: theme.transitions.easing.sharp,
		duration: theme.transitions.duration.leavingScreen
	}),
	width: `calc(100% - ${drawerWidth}px)`,
	marginLeft: `${drawerWidth}px`
}));

function App() {
	const [roomCodeCopied, setRoomCodeCopied] = useState(false);
	const [messages, setMessages] = useState<Message[]>([]);
	const [username, setUsername] = useState<string>(isDevelopment ? `Test User ${createIdentifier()}` : '');
	const [users, setUsers] = useState<string[]>([]);
	const [channel, setChannel] = useState<RealtimeChannel>();
	const [searchParams] = useSearchParams();
	const roomCode = searchParams.get('room');
	const chatWindowRef = useRef<VariableSizeList<Message[]>>(null);
	const nav = useNavigate();

	/** if there is no room code, create one and redirect */
	useEffect(() => {
		if (!roomCode) {
			nav({ pathname: '/', search: `?room=${createIdentifier()}` });
		}
	}, [roomCode]);

	/** scroll to the last chat message */
	useEffect(() => {
		chatWindowRef.current?.scrollToItem(messages.length, 'end');
	}, [messages.length]);

	/** Setup supabase realtime chat channel and subscription */
	useEffect(() => {
		/** only create the channel if we have a roomCode and username */
		if (roomCode && username) {
			/**
			 * Create the supabase channel for the roomCode, configured
			 * so the channel receives its own messages
			 */
			const channel = supabase.channel(`room:${roomCode}`, {
				config: {
					broadcast: {
						self: true
					}
				}
			});

			/**
			 * Step 1:
			 *
			 * Listen to the "presence" synchronization event to set the online users,
			 * this is updated whenever presence state changes.
			 */
			channel.on('presence', { event: 'sync' }, () => {
				/** Get the presence state from the channel, keyed by realtime identifier */
				const presenceState = channel.presenceState();

				/** transform the presence */
				const users = Object.keys(presenceState)
					.map((presenceId) => {
						const presences = presenceState[presenceId] as unknown as { username: string }[];
						return presences.map((presence) => presence.username);
					})
					.flat();
				/** sort and set the users */
				setUsers(users.sort());
			});

			/**
			 * Listen to broadcast message with a `message` event
			 */
			channel.on('broadcast', { event: 'message' }, ({ payload }) => {
				setMessages((messages) => [...messages, payload]);
			});

			/**
			 * Step 2:
			 *
			 * Track channel for username when the channel has successfully been
			 * subscribed to. This updates the managed presence state in the supabase
			 * realtime services and passes the username.
			 */
			channel.subscribe((status) => {
				if (status === 'SUBSCRIBED') {
					channel.track({ username });
				}
			});

			/**
			 * Set the channel in the state
			 */
			setChannel(channel);

			/**
			 * Return a clean-up function that unsubscribes from the channel
			 * and clears the channel state
			 */
			return () => {
				channel.unsubscribe();
				setChannel(undefined);
			};
		}
	}, [roomCode, username]);

	/** do not render anything without a room code */
	if (!roomCode) {
		return null;
	}

	/** prompt for a username */
	if (!username) {
		return <UsernameDialog open onUsername={setUsername} />;
	}

	return (
		<Box sx={{ display: 'flex', height: '100vh' }}>
			<CssBaseline />
			<Snackbar
				anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
				open={roomCodeCopied}
				autoHideDuration={2000}
				onClose={() => {
					setRoomCodeCopied(false);
				}}
				message="Chat Room Invite URL Copied"
			/>
			<AppBar position="fixed">
				<Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Typography variant="h6" noWrap component="div">
						Welcome to Chatter
					</Typography>
					<CopyToClipboard
						text={window.location.href}
						onCopy={() => {
							setRoomCodeCopied(true);
						}}
					>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								'&:hover': { color: 'lightgray' },
								cursor: 'pointer'
							}}
						>
							<Typography variant="h6" noWrap component="div">
								Room Code: {roomCode}
							</Typography>
							<Typography noWrap component="div" variant="body2">
								(click to copy invite url)
							</Typography>
						</Box>
					</CopyToClipboard>
					<Typography variant="h6" noWrap component="div">
						{username}
					</Typography>
				</Toolbar>
			</AppBar>
			<UserList width={drawerWidth} users={users} />
			<Main>
				<ChatWindow messages={messages} ref={chatWindowRef} />
				<MessageInput
					onMessage={(message) => {
						/**
						 * Send the user message to the supabase channel
						 */
						channel?.send({
							type: 'broadcast',
							event: 'message',
							payload: {
								id: createIdentifier(),
								message,
								username,
								type: 'chat'
							}
						});
					}}
				/>
			</Main>
		</Box>
	);
}

export default App;
