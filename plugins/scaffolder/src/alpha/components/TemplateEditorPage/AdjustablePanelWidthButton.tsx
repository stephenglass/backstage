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
import Button from '@material-ui/core/Button';
import { makeStyles, useTheme } from '@material-ui/core/styles';
import { useState, useCallback, useRef, useEffect, MouseEvent } from 'react';

const useStyles = makeStyles(theme => ({
  root: {
    minWidth: 0,
    width: 4,
    cursor: 'col-resize',
    background: theme.palette.action.selected,
    zIndex: 2,
    height: '100%',
    userSelect: 'none',
    outline: 'none',
    border: 'none',
    padding: 0,
    transition: 'background 0.2s',
    '& hover, & focus': {
      background: theme.palette.action.active,
    },
  },
}));

export function AdjustablePanelWidthButton(
  props: React.ComponentProps<typeof Button>,
) {
  const classes = useStyles();
  const theme = useTheme();
  const [isDragging, setIsDragging] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { onMouseDown, style, ...rest } = props;

  // Set cursor on body only while dragging
  useEffect(() => {
    if (!isDragging) return () => {};
    const originalCursor = document.body.style.cursor;
    document.body.style.cursor = 'col-resize';
    const handleMouseUp = () => setIsDragging(false);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      document.body.style.cursor = originalCursor;
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      setIsDragging(true);
      if (typeof onMouseDown === 'function') {
        onMouseDown(event);
      }
    },
    [onMouseDown],
  );

  return (
    <Button
      {...rest}
      ref={buttonRef}
      className={classes.root}
      aria-label="Resize editor panels"
      data-testid="template-editor-resize-handle"
      tabIndex={0}
      style={{
        ...style,
        background: isDragging
          ? theme.palette.action.active
          : theme.palette.action.selected,
      }}
      onMouseDown={handleMouseDown}
    />
  );
}
