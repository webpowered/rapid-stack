import { join } from "node:path";
import { cwd } from "node:process";
import { styleText } from "node:util";
import { file, serve } from "bun";
import { createRequestHandler } from "react-router";

const server = serve({
	fetch: async (request) => {
		const url = new URL(request.url);

		if (url.pathname.startsWith("/assets")) {
			const assetPath = join(cwd(), "build", "client", url.pathname);
			const asset = file(assetPath);

			return new Response(asset);
		}

		const SERVER_ENTRY_PATH = join(cwd(), "build", "server", "index.js");
		const serverEntry = file(SERVER_ENTRY_PATH);

		if (await serverEntry.exists()) {
			const serverEntryModule = await import(SERVER_ENTRY_PATH);
			const requestHandler = createRequestHandler(serverEntryModule);
			return requestHandler(request);
		}

		return new Response("Server entry not found", {
			status: 500,
		});
	},
});

console.log(styleText("green", `Server is running on ${server.url}`));
