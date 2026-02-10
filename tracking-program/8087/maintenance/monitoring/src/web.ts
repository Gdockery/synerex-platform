import * as http from "http"
import * as https from "https"
import { parse, UrlWithParsedQuery } from "url"

class HandlerContext {
	req: http.IncomingMessage
	res: http.ServerResponse

	url: UrlWithParsedQuery

	constructor(
		req: http.IncomingMessage,
		res: http.ServerResponse,
		url: UrlWithParsedQuery
	) {
		this.req = req
		this.res = res
		this.url = url
	}

	json(data: any) {
		if (isPromise(data)) {
			data
				.then((result) => json(this.res, result))
				.catch((err) => json(this.res, err))
		} else {
			json(this.res, data)
		}
	}
}

function isPromise(
	val: any
): val is Promise<any> {
	return val && typeof val["then"] === "function"
}

function json(res: http.ServerResponse, data) {
	res.end(JSON.stringify(data, null, 2) + "\n")
}

type Handler = (ctx: HandlerContext) => void

type HandlerCollection = {
	[key: string]: Handler
}

function serve(
	port: number,
	handlers: HandlerCollection
) {
	http
		.createServer((req, res) => {
			const url = parse(req.url, true)

			let handler =
				handlers[url.pathname] ||
				handlers["*"] ||
				(({ res }) => {
					res.end("not found\n")
				})

			handler(new HandlerContext(req, res, url))
		})
		.listen(port)

	console.log("Listening on port", port)
}

function httpResponseHandler(resolve, reject) {
	return (res) => {
		let data = ""

		res.on("data", (chunk) => {
			data += chunk
		})

		res.on("error", (err) => {
			reject(err)
		})

		res.on("end", () => {
			// console.log("ENDing", data)
			resolve(data)
		})
	}
}

function get(url: string) {
	const library =
		parse(url).protocol == "https:" ? https : http

	return new Promise<string>((resolve, reject) => {
		library.get(
			url,
			httpResponseHandler(resolve, reject)
		)
	})
}

function post(url: string, data: string) {
	// console.log("POSTing", url, data)
	const library =
		parse(url).protocol == "https:" ? https : http

	return new Promise<string>((resolve, reject) => {
		const req = library.request(
			url,
			{
				method: "POST",
				headers: {
					"Content-Length": Buffer.byteLength(data),
				},
			},
			httpResponseHandler(resolve, reject)
		)
		req.write(data)
		req.end()
	})
}

export { serve, get, post }
