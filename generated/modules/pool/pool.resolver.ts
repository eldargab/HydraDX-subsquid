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
  PoolCreateInput,
  PoolCreateManyArgs,
  PoolUpdateArgs,
  PoolWhereArgs,
  PoolWhereInput,
  PoolWhereUniqueInput,
  PoolOrderByEnum
} from '../../warthog';

import { Pool } from './pool.model';
import { PoolService } from './pool.service';

import { Token } from '../token/token.model';
import { TokenService } from '../token/token.service';
import { SwapAction } from '../swap-action/swap-action.model';
import { SwapActionService } from '../swap-action/swap-action.service';
import { PoolAssetVolume } from '../pool-asset-volume/pool-asset-volume.model';
import { PoolAssetVolumeService } from '../pool-asset-volume/pool-asset-volume.service';
import { getConnection, getRepository, In, Not } from 'typeorm';
import _ from 'lodash';

@ObjectType()
export class PoolEdge {
  @Field(() => Pool, { nullable: false })
  node!: Pool;

  @Field(() => String, { nullable: false })
  cursor!: string;
}

@ObjectType()
export class PoolConnection {
  @Field(() => Int, { nullable: false })
  totalCount!: number;

  @Field(() => [PoolEdge], { nullable: false })
  edges!: PoolEdge[];

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
export class PoolConnectionWhereArgs extends ConnectionPageInputOptions {
  @Field(() => PoolWhereInput, { nullable: true })
  where?: PoolWhereInput;

  @Field(() => PoolOrderByEnum, { nullable: true })
  orderBy?: [PoolOrderByEnum];
}

@Resolver(Pool)
export class PoolResolver {
  constructor(@Inject('PoolService') public readonly service: PoolService) {}

  @Query(() => [Pool])
  async pools(@Args() { where, orderBy, limit, offset }: PoolWhereArgs, @Fields() fields: string[]): Promise<Pool[]> {
    return this.service.find<PoolWhereInput>(where, orderBy, limit, offset, fields);
  }

  @Query(() => Pool, { nullable: true })
  async poolByUniqueInput(@Arg('where') where: PoolWhereUniqueInput, @Fields() fields: string[]): Promise<Pool | null> {
    const result = await this.service.find(where, undefined, 1, 0, fields);
    return result && result.length >= 1 ? result[0] : null;
  }

  @Query(() => PoolConnection)
  async poolsConnection(
    @Args() { where, orderBy, ...pageOptions }: PoolConnectionWhereArgs,
    @Info() info: any
  ): Promise<PoolConnection> {
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
      result = await this.service.findConnection<PoolWhereInput>(where, orderBy, pageOptions, rawFields);
    } catch (err) {
      console.log(err);
      // TODO: should continue to return this on `Error: Items is empty` or throw the error
      if (!(err.message as string).includes('Items is empty')) throw err;
    }

    return result as Promise<PoolConnection>;
  }

  @FieldResolver(() => Token)
  async sharedAsset(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<Token | null> {
    return ctx.dataLoader.loaders.Pool.sharedAsset.load(r);
  }

  @FieldResolver(() => Token)
  async tokenZero(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<Token | null> {
    return ctx.dataLoader.loaders.Pool.tokenZero.load(r);
  }

  @FieldResolver(() => Token)
  async tokenOne(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<Token | null> {
    return ctx.dataLoader.loaders.Pool.tokenOne.load(r);
  }

  @FieldResolver(() => SwapAction)
  async swapActions(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<SwapAction[] | null> {
    return ctx.dataLoader.loaders.Pool.swapActions.load(r);
  }

  @FieldResolver(() => PoolAssetVolume)
  async assetsVolume(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<PoolAssetVolume[] | null> {
    return ctx.dataLoader.loaders.Pool.assetsVolume.load(r);
  }

  @FieldResolver(() => Token)
  async tokenparentPool(@Root() r: Pool, @Ctx() ctx: BaseContext): Promise<Token[] | null> {
    return ctx.dataLoader.loaders.Pool.tokenparentPool.load(r);
  }
}