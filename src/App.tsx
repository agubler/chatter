import * as React from 'react';
import { styled } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Drawer from '@mui/material/Drawer';
import CssBaseline from '@mui/material/CssBaseline';
import MuiAppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import List from '@mui/material/List';
import Typography from '@mui/material/Typography';
import Divider from '@mui/material/Divider';
import IconButton from '@mui/material/IconButton';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Paper from '@mui/material/Paper';
import Button from '@mui/material/Button';
import InputBase from '@mui/material/InputBase';
import DirectionsIcon from '@mui/icons-material/Send';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import DialogContentText from '@mui/material/DialogContentText';

import { ListChildComponentProps, FixedSizeList } from 'react-window';
import AutoSizer from 'react-virtualized-auto-sizer';
import { customAlphabet } from 'nanoid/non-secure';
import { useSearchParams, useNavigate } from 'react-router-dom';
import useLocalStorageState from 'use-local-storage-state';
import {
	REALTIME_LISTEN_TYPES,
	REALTIME_PRESENCE_LISTEN_EVENTS,
	REALTIME_SUBSCRIBE_STATES,
	RealtimeChannel,
	createClient
} from '@supabase/supabase-js';

const createChatCode = customAlphabet('ABCDEFGHIJKLMNOP123456789', 6);

const apiUrl = 'http://127.0.0.1:54321';
const anonKey =
	'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';

const client = createClient(apiUrl, anonKey, {
	realtime: { params: { eventsPerSecond: 20000 } }
});

const drawerWidth = 240;

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

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	// necessary for content to be below app bar
	...theme.mixins.toolbar,
	justifyContent: 'space-between'
}));

function User({ name }: { name: string }) {
	return (
		<ListItem key={name}>
			<ListItemText primary={name} />
		</ListItem>
	);
}

function MessageInput({ onMessage }: { onMessage: any }) {
	const [input, setInput] = React.useState('');
	return (
		<Paper
			component="form"
			sx={{
				p: '2px 4px',
				display: 'flex',
				alignItems: 'center',
				alignSelf: 'flex-end',
				width: '100%'
			}}
		>
			<InputBase
				sx={{ ml: 1, flex: 1 }}
				placeholder="Chat here"
				multiline
				maxRows={10}
				value={input}
				onChange={(value) => {
					setInput(value.target.value);
				}}
				onKeyDown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						if (input) {
							setInput('');
							onMessage(input);
						}
						event.preventDefault();
						return false;
					}
				}}
			/>
			<IconButton
				color="primary"
				sx={{ p: '10px', alignSelf: 'flex-end' }}
				onClick={() => {
					if (input) {
						setInput('');
						onMessage(input);
					}
				}}
			>
				<DirectionsIcon />
			</IconButton>
		</Paper>
	);
}

function Row(props: ListChildComponentProps) {
	const { index, style, data } = props;
	const { message, username } = data[index];
	return (
		<ListItem style={style} key={index} component="div" disablePadding>
			<ListItemText
				sx={{ paddingLeft: '12px' }}
				primary={
					<>
						<Typography
							component="span"
							fontWeight="bold"
						>{`${username}: `}</Typography>
						<Typography component="span">{message}</Typography>
					</>
				}
			/>
		</ListItem>
	);
}

function App() {
	// const theme = useTheme();
	const [channel, setChannel] = React.useState<RealtimeChannel>();
	const [messages, setMessages] = React.useState<{ message: string; username: string }[]>([]);
	const [usernameInput, setUsernameInput] = React.useState('');
	const [users, setUsers] = React.useState<string[]>([]);
	const [searchParams] = useSearchParams();
	const [roomCode] = React.useState(searchParams.get('room'));
	const listRef = React.useRef<any>();
	const [username, setUsername] = useLocalStorageState<string>(`${roomCode}-chat-username`);
	const nav = useNavigate();

	React.useEffect(() => {
		if (!roomCode) {
			nav({ pathname: '/', search: `?room=${createChatCode()}` });
		}
	}, [roomCode]);

	React.useEffect(() => {
		if (roomCode && username) {
			const channel = client.channel(`room:${roomCode}`, {
				config: {
					broadcast: {
						self: true
					},
					presence: {
						key: username
					}
				}
			});
			channel.on(
				REALTIME_LISTEN_TYPES.PRESENCE,
				{ event: REALTIME_PRESENCE_LISTEN_EVENTS.SYNC },
				() => {
					console.log('Online users: ', channel.presenceState());
					setUsers(Object.keys(channel.presenceState()));
				}
			);
			channel.subscribe(async (status) => {
				if (status === REALTIME_SUBSCRIBE_STATES.SUBSCRIBED) {
					channel.track({});
				}
			});
			channel.on(
				REALTIME_LISTEN_TYPES.BROADCAST,
				{ event: 'message' },
				({ payload }) => {
					setMessages((messages) => [...messages, payload]);
				}
			);
			setChannel(channel);
			return () => {
				setChannel(undefined);
				channel.unsubscribe();
			};
		}
	}, [roomCode, username]);

	React.useEffect(() => {
		listRef.current?.scrollToItem(messages.length);
	}, [messages.length]);

	if (!roomCode) {
		return null;
	}

	return (
		<Box sx={{ display: 'flex', height: '100vh' }}>
			<CssBaseline />
			<Dialog open={!username}>
				<DialogTitle>Chatter Username</DialogTitle>
				<DialogContent>
					<DialogContentText>
						To join this chat room please enter your username?
					</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						id="username"
						label="Username"
						type="username"
						fullWidth
						variant="standard"
						value={usernameInput}
						onChange={(event) => {
							setUsernameInput(event.target.value);
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							if (usernameInput) {
								setUsername(usernameInput);
							}
						}}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
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
			<Drawer
				sx={{
					width: drawerWidth,
					flexShrink: 0,
					'& .MuiDrawer-paper': {
						width: drawerWidth,
						boxSizing: 'border-box'
					}
				}}
				variant="permanent"
				anchor="left"
			>
				<DrawerHeader>Chatterers</DrawerHeader>
				<Divider />
				<List>
					{users.map((user) => (
						<User key={user} name={user} />
					))}
				</List>
			</Drawer>
			<Main>
				<div style={{ height: '100%' }}>
					<AutoSizer>
						{({ height, width }) => {
							return (
								<FixedSizeList
									ref={listRef}
									height={Math.min(
										height,
										32 * messages.length
									)}
									width={width}
									itemSize={32}
									itemCount={messages.length}
									itemData={messages}
									initialScrollOffset={
										100000000
									}
								>
									{Row}
								</FixedSizeList>
							);
						}}
					</AutoSizer>
				</div>
				<div>
					<MessageInput
						onMessage={(message: string) => {
							channel?.send({
								type: 'broadcast',
								event: 'message',
								payload: {
									message,
									username
								}
							});
						}}
					/>
				</div>
			</Main>
		</Box>
	);
}

export default App;
