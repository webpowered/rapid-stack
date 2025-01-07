import { isbot } from "isbot";
import { renderToReadableStream } from "react-dom/server";
import { ServerRouter, type EntryContext } from "react-router";

export const streamTimeout = 5_000;

export default async function handleRequest(
	request: Request,
	status: number,
	headers: Headers,
	context: EntryContext,
) {
	let shellRendered = false;
	const userAgent = request.headers.get("user-agent");
	const isBot = isbot(userAgent) || context.isSpaMode;

	const stream = await renderToReadableStream(
		<ServerRouter context={context} url={request.url}  />,
		{
			onError(error: unknown) {
				// biome-ignore lint/style/noParameterAssign: this is specific for react router error handling
				status = 500;

				if (shellRendered) {
					console.error(error);
				}
			},
		},
	);

	shellRendered = true;

	if (isBot) {
		await stream.allReady;
	}

	headers.set("Content-Type", "text/html");

	return new Response(stream, {
		headers: headers,
		status: status,
	});
}
