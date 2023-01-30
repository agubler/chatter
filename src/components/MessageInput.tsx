import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import InputBase from '@mui/material/InputBase';
import Paper from '@mui/material/Paper';
import SendIcon from '@mui/icons-material/Send';

interface MessageInputProps {
	onMessage: (message: string) => void;
}

export default function MessageInput({ onMessage }: MessageInputProps) {
	const [value, setValue] = React.useState('');
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
				rows={1}
				value={value}
				autoFocus
				onChange={(value) => {
					setValue(value.target.value);
				}}
				onKeyDown={(event) => {
					if (event.key === 'Enter' && !event.shiftKey) {
						if (value) {
							setValue('');
							onMessage(value);
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
					if (value) {
						setValue('');
						onMessage(value);
					}
				}}
			>
				<SendIcon />
			</IconButton>
		</Paper>
	);
}
