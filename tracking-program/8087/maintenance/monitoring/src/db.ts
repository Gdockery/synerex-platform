// @ts-nocheck - config/local.js exists at runtime
import * as mysql from "mysql"
import * as querystring from "querystring"

import { get, post } from "./web"

import {
	datastores,
	influxUrl,
} from "../../../config/local"

import { isNumber, isString } from "util"

const mysqlConnectString: string =
	datastores["default"]["url"]

let mysqlConnection: mysql.Connection

function query(sql: string) {
	return new Promise((resolve, reject) => {
		if (!mysqlConnection) {
			mysqlConnection = mysql.createConnection(
				mysqlConnectString
			)
			const terminated = (err) => {
				if (err) console.log(err)
				mysqlConnection = null
			}
			mysqlConnection.on("error", terminated)
			mysqlConnection.on("end", terminated)
		}

		mysqlConnection.query(sql, (err, results) => {
			if (err) {
				return reject(err)
			}

			resolve(results)
		})
	})
}

function influxGet(sql: string): Promise<any> {
	return get(
		`${influxUrl}/query?` +
			querystring.encode({
				db: "do",
				q: sql,
			})
	).then((data) => {
		data = JSON.parse(data)
		if (data["error"]) {
			throw data["error"]
		}
		return data
	})
}

function influxPost(
	measurement: string,
	tags: {},
	fields: any,
	timestamp?: number
) {
	let tagsStr: string = Object.entries(tags)
		.map(
			([tagKey, tagValue]) =>
				`${escapeBlank(tagKey)}=${escapeBlank(tagValue)}`
		)
		.join(",")
	if (tagsStr) {
		tagsStr = "," + tagsStr
	}

	let fieldsStr: string
	if (isNumber(fields) || isString(fields)) {
		fieldsStr = "value=" + quoteString(fields)
	} else {
		fieldsStr = Object.entries(fields)
			.map(([key, value]) => {
				return `${escapeBlank(key)}=${quoteString(value)}`
			})
			.join(",")
	}

	let timestampStr = ""
	if (timestamp) {
		timestampStr = " " + timestamp
	}

	return post(
		`${influxUrl}/write?db=do`,
		`${measurement}${tagsStr} ${fieldsStr}${timestampStr}`
	).then(() => {})
}

function escapeBlank(thing: any) {
	if (isString(thing)) {
		return thing.replace(/ /g, "\\ ")
	}
	return thing
}

function quoteString(thing: any) {
	if (isString(thing)) {
		return `"${thing}"`
	}
	return thing
}

export { query, influxGet, influxPost }
