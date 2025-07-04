/*
 * Copyright 2025 The Backstage Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { act, renderHook } from '@testing-library/react';
import { useAdjustablePanelWidth } from './useAdjustablePanelWidth';

// Helper to mock getBoundingClientRect
function mockRect(width: number) {
  return {
    left: 0,
    width,
    top: 0,
    right: width,
    bottom: 0,
    height: 0,
    x: 0,
    y: 0,
    toJSON: () => '',
  } as DOMRect;
}

describe('useAdjustablePanelWidth', () => {
  it('should initialize with the given percent', () => {
    const { result } = renderHook(() =>
      useAdjustablePanelWidth({
        initialPercent: 40,
        minPx: 100,
        maxPercent: 80,
      }),
    );
    expect(result.current.panelWidth).toBe(40);
  });

  it('should update width on drag within bounds', () => {
    const { result } = renderHook(() =>
      useAdjustablePanelWidth({
        initialPercent: 50,
        minPx: 100,
        maxPercent: 80,
      }),
    );
    const mockDiv = document.createElement('div');
    jest
      .spyOn(mockDiv, 'getBoundingClientRect')
      .mockReturnValue(mockRect(1000));
    Object.defineProperty(result.current.containerRef, 'current', {
      value: mockDiv,
      writable: true,
    });
    act(() => {
      result.current.handleMouseDown({
        preventDefault: () => {},
        clientX: 600,
      } as any);
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 600, buttons: 1 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(result.current.panelWidth).toBeCloseTo(60, 1);
  });

  it('should clamp width to minPx', () => {
    const { result } = renderHook(() =>
      useAdjustablePanelWidth({
        initialPercent: 50,
        minPx: 200,
        maxPercent: 80,
      }),
    );
    const mockDiv = document.createElement('div');
    jest
      .spyOn(mockDiv, 'getBoundingClientRect')
      .mockReturnValue(mockRect(1000));
    Object.defineProperty(result.current.containerRef, 'current', {
      value: mockDiv,
      writable: true,
    });
    act(() => {
      result.current.handleMouseDown({
        preventDefault: () => {},
        clientX: 0,
      } as any);
      window.dispatchEvent(
        new MouseEvent('mousemove', { clientX: 0, buttons: 1 }),
      );
      window.dispatchEvent(new MouseEvent('mouseup'));
    });
    expect(result.current.panelWidth).toBeCloseTo(20, 1);
  });

  it('should clamp width to maxPercent', () => {
    const { result } = renderHook(() =>
      useAdjustablePanelWidth({
        initialPercent: 50,
        minPx: 100,
        maxPercent: 60,
      }),
    );
    const mockDiv = document.createElement('div');
    jest
      .spyOn(mockDiv, 'getBoundingClientRect')
      .mockReturnValue(mockRect(1000));
    Object.defineProperty(result.current.containerRef, 'current', {
      value: mockDiv,
      writable: true,
    });
    act(() => {
      result.current.handleResizeKeyDown({
        key: 'ArrowRight',
        preventDefault: () => {},
      } as any);
    });
    expect(result.current.panelWidth).toBeLessThanOrEqual(60);
  });

  it('should decrease width with left arrow', () => {
    const { result } = renderHook(() =>
      useAdjustablePanelWidth({
        initialPercent: 50,
        minPx: 100,
        maxPercent: 80,
      }),
    );
    const mockDiv = document.createElement('div');
    jest
      .spyOn(mockDiv, 'getBoundingClientRect')
      .mockReturnValue(mockRect(1000));
    Object.defineProperty(result.current.containerRef, 'current', {
      value: mockDiv,
      writable: true,
    });
    act(() => {
      result.current.handleResizeKeyDown({
        key: 'ArrowLeft',
        preventDefault: () => {},
      } as any);
    });
    expect(result.current.panelWidth).toBeLessThan(50);
  });
});
