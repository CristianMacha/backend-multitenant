import { ExecutionContext } from '@nestjs/common';
import { of, firstValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  const interceptor = new ResponseInterceptor();
  const context = {} as ExecutionContext;

  it('wraps payloads in the standard envelope', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(context, { handle: () => of({ id: '1' }) }),
    );

    expect(result).toEqual({
      success: true,
      data: { id: '1' },
      message: 'Operation completed successfully',
    });
  });

  it('normalizes undefined payloads to null', async () => {
    const result = await firstValueFrom(
      interceptor.intercept(context, { handle: () => of(undefined) }),
    );

    expect(result.success).toBe(true);
    expect(result.data).toBeNull();
  });
});
