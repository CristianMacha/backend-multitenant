import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { EntityNotFoundException } from '@shared/exceptions';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { ContactReadModel, toContactReadModel } from '../contact.read-model';
import { GetContactByIdQuery } from './get-contact-by-id.query';

@QueryHandler(GetContactByIdQuery)
export class GetContactByIdHandler implements IQueryHandler<GetContactByIdQuery> {
  constructor(private readonly prisma: PrismaService) {}

  async execute(query: GetContactByIdQuery): Promise<ContactReadModel> {
    const contact = await this.prisma.contact.findFirst({
      where: { id: query.id, tenantId: query.tenantId, deletedAt: null },
    });

    if (!contact) throw new EntityNotFoundException('Contact', query.id);

    return toContactReadModel(contact);
  }
}
