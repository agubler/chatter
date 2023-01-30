import { useState, useRef, useEffect } from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { VariableSizeList } from 'react-window';
import { customAlphabet } from 'nanoid/non-secure';
import { useSearchParams, useNavigate } from 'react-router-dom';

import UsernameDialog from './components/UsernameDialog';
import ChatWindow, { Message } from './components/ChatWindow';
import MessageInput from './components/MessageInput';
import UserList from './components/UserList';

const createIdentifier = customAlphabet('ABCDEFGHIJKLMNOP123456789', 6);

const drawerWidth = 240;

const isDevelopment = import.meta.env.DEV;

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
	const [messages, setMessages] = useState<Message[]>([]);
	const [username, setUsername] = useState<string>(isDevelopment ? `Test User ${createIdentifier()}` : '');
	const [users, setUsers] = useState<string[]>([]);
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
			<AppBar position="fixed">
				<Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
					<Typography variant="h6" noWrap component="div">
						Welcome to Chatter
					</Typography>
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
						setMessages((messages) => {
							return [
								...messages,
								{
									message,
									username,
									id: createIdentifier(),
									type: 'chat'
								}
							];
						});
					}}
				/>
			</Main>
		</Box>
	);
}

export default App;
