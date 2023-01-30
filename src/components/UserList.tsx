import * as React from 'react';
import Drawer from '@mui/material/Drawer';
import { styled } from '@mui/material/styles';
import Divider from '@mui/material/Divider';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';

const DrawerHeader = styled('div')(({ theme }) => ({
	display: 'flex',
	alignItems: 'center',
	padding: theme.spacing(0, 1),
	justifyContent: 'space-between',
	...theme.mixins.toolbar
}));

interface UserListProps {
	width: number;
	users: string[];
}

export default function UserList(props: UserListProps) {
	const { width, users } = props;
	return (
		<Drawer
			sx={{
				width,
				flexShrink: 0,
				'& .MuiDrawer-paper': {
					width,
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
					<ListItem key={user}>
						<ListItemText primary={user} />
					</ListItem>
				))}
			</List>
		</Drawer>
	);
}
