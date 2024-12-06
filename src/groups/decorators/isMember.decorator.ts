import { SetMetadata } from '@nestjs/common';

export const IsMember = (groupId: number) => SetMetadata('isMember', groupId);
