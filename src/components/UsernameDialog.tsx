import { useState } from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';
import TextField from '@mui/material/TextField';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';

interface UsernameDialogProps {
	open: boolean;
	onUsername: (username: string) => void;
}

export default function UsernameDialog(props: UsernameDialogProps) {
	const { open, onUsername } = props;
	const [value, setValue] = useState('');
	return (
		<Box sx={{ display: 'flex', height: '100vh' }}>
			<CssBaseline />
			<Dialog open={open}>
				<DialogTitle>Chatter Username</DialogTitle>
				<DialogContent>
					<DialogContentText>To join this chat room please enter your username</DialogContentText>
					<TextField
						autoFocus
						margin="dense"
						id="username"
						label="Username"
						type="username"
						fullWidth
						variant="standard"
						value={value}
						onChange={(event) => {
							setValue(event.target.value);
						}}
						onKeyDown={(event) => {
							const value = (event.target as HTMLInputElement).value;
							if (event.key === 'Enter' && value) {
								onUsername(value);
							}
						}}
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							if (value) {
								onUsername(value);
							}
						}}
					>
						Confirm
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
}
