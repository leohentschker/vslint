import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export const Route = createRootRoute({
	component: () => (
		<div className="h-screen w-screen">
			<div className="max-w-4xl mx-auto w-full flex-1 my-10 flex flex-col gap-4">
				<Outlet />
			</div>
			<TanStackRouterDevtools />
		</div>
	),
});
