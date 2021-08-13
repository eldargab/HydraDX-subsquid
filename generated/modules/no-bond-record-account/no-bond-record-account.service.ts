import { Service, Inject } from 'typedi';
import { Repository } from 'typeorm';
import { InjectRepository } from 'typeorm-typedi-extensions';
import { WhereInput } from 'warthog';
import { WarthogBaseService } from '../../server/WarthogBaseService';

import { NoBondRecordAccount } from './no-bond-record-account.model';

import { NoBondRecordAccountWhereArgs, NoBondRecordAccountWhereInput } from '../../warthog';

@Service('NoBondRecordAccountService')
export class NoBondRecordAccountService extends WarthogBaseService<NoBondRecordAccount> {
  constructor(@InjectRepository(NoBondRecordAccount) protected readonly repository: Repository<NoBondRecordAccount>) {
    super(NoBondRecordAccount, repository);
  }

  async find<W extends WhereInput>(
    where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<NoBondRecordAccount[]> {
    return this.findWithRelations<W>(where, orderBy, limit, offset, fields);
  }

  async findWithRelations<W extends WhereInput>(
    _where?: any,
    orderBy?: string | string[],
    limit?: number,
    offset?: number,
    fields?: string[]
  ): Promise<NoBondRecordAccount[]> {
    const where = <NoBondRecordAccountWhereInput>(_where || {});

    let mainQuery = this.buildFindQueryWithParams(<any>where, orderBy, undefined, fields, 'main').take(undefined); // remove LIMIT

    let parameters = mainQuery.getParameters();

    mainQuery = mainQuery.setParameters(parameters);

    return mainQuery
      .take(limit || 50)
      .skip(offset || 0)
      .getMany();
  }
}