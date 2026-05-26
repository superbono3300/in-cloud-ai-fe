import { createElement } from 'react'
import type { RouteObject } from 'react-router-dom'
import { ChatPage } from '../views'

export const appRoutes: RouteObject[] = [
	{
		path: '/',
		element: createElement(ChatPage),
	},
]
