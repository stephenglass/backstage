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
import { render, fireEvent } from '@testing-library/react';
import { AdjustablePanelWidthButton } from './AdjustablePanelWidthButton';
import { ThemeProvider, createTheme } from '@material-ui/core/styles';

const theme = createTheme();

function renderWithTheme(ui: React.ReactElement) {
  return render(<ThemeProvider theme={theme}>{ui}</ThemeProvider>);
}

describe('AdjustablePanelWidthButton', () => {
  it('renders with default background', () => {
    const { getByTestId } = renderWithTheme(<AdjustablePanelWidthButton />);
    const button = getByTestId('template-editor-resize-handle');
    expect(button).toBeInTheDocument();
    // Should have default background color
    expect(button).toHaveStyle(`background: ${theme.palette.action.selected}`);
  });

  it('sets background to active color while dragging', () => {
    const { getByTestId } = renderWithTheme(<AdjustablePanelWidthButton />);
    const button = getByTestId('template-editor-resize-handle');
    fireEvent.mouseDown(button);
    expect(button).toHaveStyle(`background: ${theme.palette.action.active}`);
    // Simulate mouseup to end dragging
    fireEvent.mouseUp(window);
    expect(button).toHaveStyle(`background: ${theme.palette.action.selected}`);
  });

  it('calls onMouseDown prop if provided', () => {
    const onMouseDown = jest.fn();
    const { getByTestId } = renderWithTheme(
      <AdjustablePanelWidthButton onMouseDown={onMouseDown} />,
    );
    const button = getByTestId('template-editor-resize-handle');
    fireEvent.mouseDown(button);
    expect(onMouseDown).toHaveBeenCalled();
  });
});
