import {hello} from '../src/index';

describe('test hello', () => {
    it('should return hello world', () => {
      expect(hello()).toBe('Hello world!');
    });
  });