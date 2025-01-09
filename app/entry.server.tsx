import { isbot } from "isbot";
import type { RenderToPipeableStreamOptions } from "react-dom/server";
import { type EntryContext, ServerRouter } from "react-router";

export const streamTimeout = 5_000;

export default async function handleRequest(
	request: Request,
	status: number,
	headers: Headers,
	context: EntryContext,
) {
	let shellRendered = false;
	const userAgent = request.headers.get("user-agent");
	const shouldWaitForAllContent = isbot(userAgent) || context.isSpaMode;

	if ("renderToReadableStream" in (await import("react-dom/server"))) {
		const { renderToReadableStream } = await import("react-dom/server");

		const stream = await renderToReadableStream(
			<ServerRouter context={context} url={request.url} />,
			{
				onError(error) {
					// biome-ignore lint/style/noParameterAssign: this is required for this server to indicate failure
					status = 500;

					if (shellRendered) {
						console.error(error);
					}
				},
			},
		);

		shellRendered = true;

		if (shouldWaitForAllContent) {
			await stream.allReady;
		}

		headers.set("Content-Type", "text/html");

		return new Response(stream, {
			headers,
			status,
		});
	}

	const { PassThrough } = await import("node:stream");
	const { renderToPipeableStream } = await import("react-dom/server");
	const { createReadableStreamFromReadable } = await import(
		"@react-router/node"
	);
	const readyOption: keyof RenderToPipeableStreamOptions =
		(userAgent && isbot(userAgent)) || context.isSpaMode
			? "onAllReady"
			: "onShellReady";

	return new Promise<Response>((resolve, reject) => {
		const { pipe, abort } = renderToPipeableStream(
			<ServerRouter context={context} url={request.url} />,
			{
				[readyOption]: () => {
					shellRendered = true;

					const body = new PassThrough();
					const stream = createReadableStreamFromReadable(body);

					headers.set("Content-Type", "text/html");

					resolve(
						new Response(stream, {
							headers,
							status,
						}),
					);

					pipe(body);
				},
				onShellError(error) {
					reject(error);
				},
				onError(error) {
					// biome-ignore lint/style/noParameterAssign: this is required for this server to indicate failure
					status = 500;

					if (shellRendered) {
						console.error(error);
					}
				},
			},
		);

		setTimeout(abort, streamTimeout + 1000);
	});
}
