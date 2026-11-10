import { HttpException, HttpStatus, Injectable } from '@nestjs/common';

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 8;

type Bucket = {
  count: number;
  resetAt: number;
};

@Injectable()
export class LoginRateLimit {
  private readonly hits = new Map<string, Bucket>();

  assert(key: string) {
    this.prune();
    const bucket = this.hits.get(key);
    if (bucket && bucket.count >= MAX_ATTEMPTS && bucket.resetAt > Date.now()) {
      throw new HttpException('Забагато спроб входу. Спробуйте пізніше.', HttpStatus.TOO_MANY_REQUESTS);
    }
  }

  fail(key: string) {
    const now = Date.now();
    const current = this.hits.get(key);
    if (!current || current.resetAt <= now) {
      this.hits.set(key, { count: 1, resetAt: now + WINDOW_MS });
      return;
    }
    current.count += 1;
  }

  success(key: string) {
    this.hits.delete(key);
  }

  private prune() {
    const now = Date.now();
    if (this.hits.size < 500) {
      return;
    }
    for (const [key, bucket] of this.hits) {
      if (bucket.resetAt <= now) {
        this.hits.delete(key);
      }
    }
  }
}
