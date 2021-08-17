import {
  Arg,
  Args,
  Mutation,
  Query,
  Root,
  Resolver,
  FieldResolver,
  ObjectType,
  Field,
  Int,
  ArgsType,
  Info,
  Ctx
} from 'type-graphql';
import graphqlFields from 'graphql-fields';
import { Inject } from 'typedi';
import { Min } from 'class-validator';
import { Fields, StandardDeleteResponse, UserId, PageInfo, RawFields, NestedFields, BaseContext } from 'warthog';

import {
  AccountCreateInput,
  AccountCreateManyArgs,
  AccountUpdateArgs,
  AccountWhereArgs,
  AccountWhereInput,
  AccountWhereUniqueInput,
  AccountOrderByEnum
} from '../../warthog';

import { Account } from './account.model';
import { AccountService } from './account.service';

import { Pool } from '../pool/pool.model';
import { PoolService } from '../pool/pool.service';
import { TradeTransfer } from '../trade-transfer/trade-transfer.model';
import { TradeTransferService } from '../trade-transfer/trade-transfer.service';
import { SwapAction } from '../swap-action/swap-action.model';
import { SwapActionService } from '../swap-action/swap-action.service';
import { getConnection, getRepository, In, Not } from 'typeorm';
import _ from 'lodash';

@ObjectType()
export class AccountEdge {
  @Field(() => Account, { nullable: false })
  node!: Account;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class AccountConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [AccountEdge], { nullable: false })
  edges!: AccountEdge[];

  @Field(() => PageInfo, { nullable: false })
  pageInfo!: PageInfo;
}

@ArgsType()
export class ConnectionPageInputOptions {
  @Field(() => Int, { nullable: true })
  @Min(0)
  first?: number;

  @Field(() => String, { nullable: true })
  after?: string; // V3: TODO: should we make a RelayCursor scalar?

  @Field(() => Int, { nullable: true })
  @Min(0)
  last?: number;

  @Field(() => String, { nullable: true })
  before?: string;
}

@ArgsType()
export class AccountConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => AccountWhereInput, { nullable: true })
  where?: AccountWhereInput;

  @Field(() => AccountOrderByEnum, { nullable: true })
  orderBy?: [AccountOrderByEnum];
}

@Resolver(Account)
export class AccountResolver {
  constructor(@Inject('AccountService') public readonly service: AccountService) {}

  @Query(() => [Account])
  async accounts(
    @Args() { where, orderBy, limit, offset }: AccountWhereArgs,
    @Fields() fields: string[]
  ): Promise<Account[]> {
    return this.service.find<AccountWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => Account, { nullable: true })
  async accountByUniqueInput(
    @Arg('where') where: AccountWhereUniqueInput,
    @Fields() fields: string[]
  ): Promise<Account | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => AccountConnection)
  async accountsConnection(
    @Args() { where, orderBy, ...pageOptions }: AccountConnectionWhereArgs,
    @Info() info: any
  ): Promise<AccountConnection> {
    const rawFields = graphqlFields(info, {}, { excludedFields: ['__typename'] });

    let result: any = {
      totalCount: 0,
      edges: [],
      pageInfo: {
        hasNextPage: false,
        hasPreviousPage: false
      }
    };
    // If the related database table does not have any records then an error is thrown to the client
    // by warthog
    try {
      result = await this.service.findConnection<AccountWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<AccountConnection>;
  }

  @FieldResolver(() => Pool)
  async createdPools(@Root() r: Account, @Ctx() ctx: BaseContext): Promise<Pool[] | null> {
    return ctx.dataLoader.loaders.Account.createdPools.load(r);
  }

  @FieldResolver(() => TradeTransfer)
  async tradeTransferOut(@Root() r: Account, @Ctx() ctx: BaseContext): Promise<TradeTransfer[] | null> {
    return ctx.dataLoader.loaders.Account.tradeTransferOut.load(r);
  }

  @FieldResolver(() => TradeTransfer)
  async tradeTransferIn(@Root() r: Account, @Ctx() ctx: BaseContext): Promise<TradeTransfer[] | null> {
    return ctx.dataLoader.loaders.Account.tradeTransferIn.load(r);
  }

  @FieldResolver(() => SwapAction)
  async swapactionaccount(@Root() r: Account, @Ctx() ctx: BaseContext): Promise<SwapAction[] | null> {
    return ctx.dataLoader.loaders.Account.swapactionaccount.load(r);
  }
}
