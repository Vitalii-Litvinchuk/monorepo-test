import React from 'react';
import { render } from '@testing-library/react';
import {
  SkeletonBox,
  OrderCardSkeleton,
  OrdersSkeletonList,
  ProductRowSkeleton,
  ProductsSkeletonList,
  OrderDetailSkeleton,
} from './index';

describe('Skeleton Components', () => {
  it('renders SkeletonBox with custom dimensions', () => {
    const { container } = render(<SkeletonBox width={100} height={20} />);
    const box = container.firstChild as HTMLElement;
    expect(box).toBeTruthy();
    expect(box.style.width).toBe('100px');
    expect(box.style.height).toBe('20px');
  });

  it('renders OrderCardSkeleton in full and compact modes', () => {
    const { container: full } = render(<OrderCardSkeleton isCompact={false} />);
    expect(full.firstChild).toBeTruthy();

    const { container: compact } = render(<OrderCardSkeleton isCompact={true} />);
    expect(compact.firstChild).toBeTruthy();
  });

  it('renders OrdersSkeletonList with requested count', () => {
    const { container } = render(<OrdersSkeletonList count={4} />);
    expect(container.firstChild?.childNodes.length).toBe(4);
  });

  it('renders ProductRowSkeleton in optimized-grid and classic-scroll modes', () => {
    const { container: opt } = render(<ProductRowSkeleton viewMode="optimized-grid" />);
    expect(opt.firstChild).toBeTruthy();

    const { container: classic } = render(<ProductRowSkeleton viewMode="classic-scroll" />);
    expect(classic.firstChild).toBeTruthy();
  });

  it('renders ProductsSkeletonList with requested count', () => {
    const { container } = render(<ProductsSkeletonList count={5} />);
    expect(container.firstChild?.childNodes.length).toBe(5);
  });

  it('renders OrderDetailSkeleton', () => {
    const { container } = render(<OrderDetailSkeleton />);
    expect(container.firstChild).toBeTruthy();
  });
});
