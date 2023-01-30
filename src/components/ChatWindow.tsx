import { forwardRef } from 'react';
import Box from '@mui/material/Box';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import Typography from '@mui/material/Typography';
import AutoSizer from 'react-virtualized-auto-sizer';
import { VariableSizeList } from 'react-window';

interface ChatMessage {
	id: string;
	username: string;
	message: string;
	type: 'chat';
}

interface PresenceMessage {
	id: string;
	username: string;
	message: 'joined' | 'left';
	type: 'presence';
}

export type Message = ChatMessage | PresenceMessage;

interface ChatWindowProps {
	messages: Message[];
}

export default forwardRef<VariableSizeList<Message[]>, ChatWindowProps>(function ChatWindow(props, ref) {
	const { messages } = props;
	return (
		<Box height="100%">
			<AutoSizer>
				{({ height, width }) => {
					return (
						<VariableSizeList<Message[]>
							ref={ref}
							height={height}
							width={width}
							itemSize={(index) => {
								return messages[index]?.type === 'chat' ? 32 : 24;
							}}
							itemCount={messages.length}
							itemData={messages}
							initialScrollOffset={100000000}
						>
							{(props) => {
								const { index, style, data } = props;
								const { message, type, username, id } = data[index];

								let primary = <></>;

								if (type === 'chat') {
									primary = (
										<>
											<Typography
												component="span"
												fontWeight="bold"
											>{`${username}: `}</Typography>
											<Typography component="span">{message}</Typography>
										</>
									);
								} else {
									primary = (
										<Typography
											component="span"
											fontWeight="bold"
											fontStyle="italic"
											fontSize="12px"
											color="lightgray"
										>{`${username} ${message} the room`}</Typography>
									);
								}

								return (
									<ListItem
										id={id}
										style={style}
										key={id}
										component="div"
										disablePadding
									>
										<ListItemText
											sx={{
												paddingLeft: '12px'
											}}
											primary={primary}
										/>
									</ListItem>
								);
							}}
						</VariableSizeList>
					);
				}}
			</AutoSizer>
		</Box>
	);
});
