// eslint-disable-next-line import/no-extraneous-dependencies
import { createClient, RedisArgument, SetOptions } from 'redis';

import { logger } from '@/utils/logger';

export class RedisDB {
  private client: any = null;

  constructor() {
    this.ConnectRedis();
  }

  public async ConnectRedis() {
    if (!this.client) {
      this.client = await createClient() // Kết nối Redis
        .on('error', (err) => {
          logger.error('Redis Client Error', err);
        })
        .connect();
    }
    return this.client;
  }
  public async setKey(
    key: RedisArgument,
    value: number | RedisArgument,
    options?: SetOptions | undefined,
  ) {
    const client = await this.ConnectRedis();
    return client.set(key, value, options);
  }
  public async getKey(key: RedisArgument) {
    const client = await this.ConnectRedis();
    return client.get(key);
  }
  public async getKeys(pattern: RedisArgument) {
    const client = await this.ConnectRedis();
    return client.keys(pattern);
  }
  public async getTTL(key: RedisArgument) {
    const client = await this.ConnectRedis();
    return client.ttl(key);
  }
  public async deleteKey(key: RedisArgument) {
    const client = await this.ConnectRedis();
    return client.del(key);
  }
  public async disconnect() {
    return this.client.destroy();
  }
}
