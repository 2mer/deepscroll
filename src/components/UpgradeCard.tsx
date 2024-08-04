import { Card, Text } from '@mantine/core';
import { useHotkeys } from '@mantine/hooks';

function UpgradeCard({
	upgrade,
	onClick,
	index,
}: {
	upgrade: any;
	onClick?: () => void;
	index: number;
}) {
	useHotkeys([[String(index + 1), () => onClick?.()]]);

	return (
		<Card
			withBorder
			className='cursor-pointer hover:ring hover:ring-blue-400 hover:ring-10 hover:scale-110'
			onClick={onClick}
		>
			<div className='flex flex-col gap-5 items-center justify-between flex-1'>
				<div className='flex justify-center items-center flex-1'>
					<img src={upgrade.image} />
				</div>
				<div className='flex flex-col gap-2 items-center'>
					<Text variant='gradient' size='xl' fw={900}>
						{upgrade.id.toUpperCase()}
					</Text>
					{upgrade.description && (
						<Text size='md' fw={900}>
							{upgrade.description.toUpperCase()}
						</Text>
					)}
				</div>
			</div>
		</Card>
	);
}

export default UpgradeCard;
