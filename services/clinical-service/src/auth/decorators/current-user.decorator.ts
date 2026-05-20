import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/** Injects the current authenticated user from the JWT payload into route handlers */
export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
