import { sharedState } from './shared-state';

describe('sharedState', () => {
  it('should work', () => {
    expect(sharedState()).toEqual('shared-state');
  });
});
