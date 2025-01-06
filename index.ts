import { styleText } from "node:util";
import { serve } from "bun";

const server = serve({
	fetch: () => new Response("Basic Server")
});

console.log(styleText("green", `Server is running on ${server.url}`));
