import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TenantId, UserId } from '@shared/domain/types';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import {
  GetMyIdentityQuery,
  MyIdentityReadModel,
} from './get-my-identity.query';

@QueryHandler(GetMyIdentityQuery)
export class GetMyIdentityHandler implements IQueryHandler<GetMyIdentityQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetMyIdentityQuery): Promise<MyIdentityReadModel> {
    const { user } = query;

    const found = await this.prisma.user.findFirst({
      where: {
        id: UserId(user.userId),
        tenantId: TenantId(user.tenantId),
        deletedAt: null,
      },
      select: { firstName: true, lastName: true },
    });

    if (!found) throw new EntityNotFoundException('User', user.userId);

    const fullName = `${found.firstName} ${found.lastName}`.trim();

    return {
      userId: user.userId,
      firebaseUid: user.firebaseUid,
      email: user.email,
      firstName: found.firstName,
      lastName: found.lastName,
      fullName,
      tenantId: user.tenantId,
      roles: user.roles,
      permissions: user.permissions,
      isPlatformAdmin: user.isPlatformAdmin,
    };
  }
}
