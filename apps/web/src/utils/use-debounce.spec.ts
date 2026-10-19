import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './use-debounce';

describe('useDebounce hook', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should return initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 300));
    expect(result.current).toBe('hello');
  });

  it('should debounce value change until timer elapses', () => {
    const { result, rerender } = renderHook(
      ({ val, delay }) => useDebounce(val, delay),
      { initialProps: { val: 'initial', delay: 300 } },
    );

    expect(result.current).toBe('initial');

    // Change value
    rerender({ val: 'updated', delay: 300 });
    expect(result.current).toBe('initial');

    // Fast-forward time partly
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('initial');

    // Fast-forward remaining time
    act(() => {
      jest.advanceTimersByTime(150);
    });
    expect(result.current).toBe('updated');
  });
});
