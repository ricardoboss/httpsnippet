import { describe, expect, it } from '@jest/globals';

import { reducer } from './reducer.js';

describe('reducer', () => {
  it('should convert array object pair to key-value object', () => {
    const query = [
      { name: 'key', value: 'value' },
      { name: 'foo', value: 'bar' },
    ];

    const result = query.reduce(reducer, {});

    expect(result).toMatchObject({ key: 'value', foo: 'bar' });
  });

  it('should convert multi-dimensional arrays to key=[array] object', () => {
    const query = [
      { name: 'key', value: 'value' },
      { name: 'foo', value: 'bar1' },
      { name: 'foo', value: 'bar2' },
      { name: 'foo', value: 'bar3' },
    ];

    const result = query.reduce(reducer, {});

    expect(result).toMatchObject({ key: 'value', foo: ['bar1', 'bar2', 'bar3'] });
  });
});
