/*
 * Copyright 2024 The Backstage Authors
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

import { PropsWithChildren, forwardRef } from 'react';
import { WithStyles, withStyles } from '@material-ui/core/styles';

export const TemplateEditorLayout = withStyles(
  theme => ({
    root: {
      height: '100%',
      gridArea: 'pageContent',
      display: 'grid',
      gridTemplateAreas: `
        "toolbar"
        "browser"
        "mainPanels"
        "results"
      `,
      [theme.breakpoints.up('md')]: {
        gridTemplateAreas: `
          "toolbar toolbar toolbar"
          "browser mainPanels mainPanels"
          "results results results"
        `,
        gridTemplateColumns: '1fr 5fr',
        gridTemplateRows: 'auto 1fr auto',
      },
    },
  }),
  { name: 'ScaffolderTemplateEditorLayout' },
)(({ children, classes }: PropsWithChildren<WithStyles>) => (
  <main className={classes.root}>{children}</main>
));

export const TemplateEditorLayoutToolbar = withStyles(
  {
    root: {
      gridArea: 'toolbar',
    },
  },
  { name: 'ScaffolderTemplateEditorLayoutToolbar' },
)(({ children, classes }: PropsWithChildren<WithStyles>) => (
  <section className={classes.root}>{children}</section>
));

export const TemplateEditorLayoutBrowser = withStyles(
  theme => ({
    root: {
      gridArea: 'browser',
      overflow: 'auto',
      [theme.breakpoints.up('md')]: {
        borderRight: `1px solid ${theme.palette.divider}`,
      },
    },
  }),
  { name: 'ScaffolderTemplateEditorLayoutBrowser' },
)(({ children, classes }: PropsWithChildren<WithStyles>) => (
  <section className={classes.root}>{children}</section>
));

export const TemplateEditorLayoutMainPanels = withStyles(
  {
    root: {
      gridArea: 'mainPanels',
      display: 'flex',
      flexDirection: 'row',
      width: '100%',
      height: '100%',
      position: 'relative',
      minHeight: 0, // allow children to shrink
    },
  },
  { name: 'ScaffolderTemplateEditorLayoutMainPanels' },
)(
  forwardRef<HTMLDivElement, PropsWithChildren<WithStyles>>(
    ({ children, classes }, ref) => (
      <div className={classes.root} ref={ref}>
        {children}
      </div>
    ),
  ),
);

export const TemplateEditorLayoutFiles = withStyles(
  {
    root: {
      height: '100%',
      overflow: 'auto',
      minWidth: 200,
      maxWidth: '80%',
      flexGrow: 0,
      flexShrink: 0,
      paddingRight: 8,
      // flexBasis and width will be set inline by parent
    },
  },
  { name: 'ScaffolderTemplateEditorLayoutFiles' },
)(
  ({
    children,
    classes,
    style,
  }: PropsWithChildren<WithStyles> & { style?: React.CSSProperties }) => (
    <section className={classes.root} style={style}>
      {children}
    </section>
  ),
);

export const TemplateEditorLayoutPreview = withStyles(
  theme => ({
    root: {
      height: '100%',
      position: 'relative',
      backgroundColor: theme.palette.background.default,
      minWidth: 200,
      flex: 1,
      paddingLeft: 8, // Add space between divider and preview
      [theme.breakpoints.up('md')]: {
        borderLeft: `1px solid ${theme.palette.divider}`,
      },
    },
    scroll: {
      height: '100%',
      padding: theme.spacing(1),
      [theme.breakpoints.up('md')]: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'auto',
      },
    },
  }),
  { name: 'ScaffolderTemplateEditorLayoutPreview' },
)(({ children, classes }: PropsWithChildren<WithStyles>) => (
  <section className={classes.root}>
    <div className={classes.scroll}>{children}</div>
  </section>
));

export const TemplateEditorLayoutConsole = withStyles(
  {
    root: {
      gridArea: 'results',
    },
  },
  { name: 'ScaffolderTemplateEditorLayoutConsole' },
)(({ children, classes }: PropsWithChildren<WithStyles>) => (
  <section className={classes.root}>{children}</section>
));
