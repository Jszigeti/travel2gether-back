import { SetMetadata } from '@nestjs/common';

export const isPublic = 'isPublic';
export const Public = () => SetMetadata(process.env.IS_PUBLIC_KEY, true);
