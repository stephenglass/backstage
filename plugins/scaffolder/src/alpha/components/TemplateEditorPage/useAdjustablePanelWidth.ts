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
import { useRef, useState, useCallback } from 'react';

export function useAdjustablePanelWidth(options: {
  initialPercent: number;
  minPx?: number;
  maxPercent?: number;
}) {
  const { initialPercent, minPx = 200, maxPercent = 80 } = options;

  const [panelWidth, setPanelWidth] = useState<number>(initialPercent);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback(
    (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let x = e.clientX - rect.left;
      const min = minPx;
      const max = rect.width - minPx;
      if (x < min) x = min;
      if (x > max) x = max;
      setPanelWidth((x / rect.width) * 100);
    },
    [minPx],
  );

  const handleMouseUp = useCallback(() => {
    window.removeEventListener('mousemove', handleDrag);
    window.removeEventListener('mouseup', handleMouseUp);
  }, [handleDrag]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [handleDrag, handleMouseUp],
  );

  const handleResizeKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLButtonElement>) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      let newWidth = panelWidth;
      if (e.key === 'ArrowLeft') {
        newWidth = Math.max(
          (((rect.width * panelWidth) / 100 - 20) / rect.width) * 100,
          (minPx / rect.width) * 100,
        );
        setPanelWidth(newWidth);
        e.preventDefault();
      } else if (e.key === 'ArrowRight') {
        newWidth = Math.min(
          (((rect.width * panelWidth) / 100 + 20) / rect.width) * 100,
          maxPercent,
        );
        setPanelWidth(newWidth);
        e.preventDefault();
      }
    },
    [panelWidth, minPx, maxPercent],
  );

  return {
    panelWidth,
    containerRef,
    handleMouseDown,
    handleResizeKeyDown,
  };
}
