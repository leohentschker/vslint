/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

import { createFileRoute } from '@tanstack/react-router'

// Import Routes

import { Route as rootRoute } from './routes/__root'
import { Route as TestsTestImport } from './routes/tests.$test'

// Create Virtual Routes

const IndexLazyImport = createFileRoute('/')()

// Create/Update Routes

const IndexLazyRoute = IndexLazyImport.update({
  path: '/',
  getParentRoute: () => rootRoute,
} as any).lazy(() => import('./routes/index.lazy').then((d) => d.Route))

const TestsTestRoute = TestsTestImport.update({
  path: '/tests/$test',
  getParentRoute: () => rootRoute,
} as any)

// Populate the FileRoutesByPath interface

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexLazyImport
      parentRoute: typeof rootRoute
    }
    '/tests/$test': {
      id: '/tests/$test'
      path: '/tests/$test'
      fullPath: '/tests/$test'
      preLoaderRoute: typeof TestsTestImport
      parentRoute: typeof rootRoute
    }
  }
}

// Create and export the route tree

export interface FileRoutesByFullPath {
  '/': typeof IndexLazyRoute
  '/tests/$test': typeof TestsTestRoute
}

export interface FileRoutesByTo {
  '/': typeof IndexLazyRoute
  '/tests/$test': typeof TestsTestRoute
}

export interface FileRoutesById {
  __root__: typeof rootRoute
  '/': typeof IndexLazyRoute
  '/tests/$test': typeof TestsTestRoute
}

export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths: '/' | '/tests/$test'
  fileRoutesByTo: FileRoutesByTo
  to: '/' | '/tests/$test'
  id: '__root__' | '/' | '/tests/$test'
  fileRoutesById: FileRoutesById
}

export interface RootRouteChildren {
  IndexLazyRoute: typeof IndexLazyRoute
  TestsTestRoute: typeof TestsTestRoute
}

const rootRouteChildren: RootRouteChildren = {
  IndexLazyRoute: IndexLazyRoute,
  TestsTestRoute: TestsTestRoute,
}

export const routeTree = rootRoute
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/",
        "/tests/$test"
      ]
    },
    "/": {
      "filePath": "index.lazy.tsx"
    },
    "/tests/$test": {
      "filePath": "tests.$test.tsx"
    }
  }
}
ROUTE_MANIFEST_END */
