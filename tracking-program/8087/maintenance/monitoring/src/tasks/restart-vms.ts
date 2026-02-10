import {
	Task,
	Minute,
	Second,
	Nanosecond,
} from "../tasks"
import { influxGet } from "../db"
import {
	Status,
	restartHost,
} from "./basic-checks"
import { slackMessage } from "../slack"

const UnresponsiveThreshold = 10 * Minute

const task: Task = {
	slug: "restart-vms",
	name: "Restart unresponsive VMs",

	runningInterval: 30 * Second,

	run: (ctx) => {
		return new Promise(async (resolve) => {
			try {
				const now = Date.now()
				const res = await influxGet(
					"select host, value from xeco_health where time > " +
						(now - UnresponsiveThreshold) / Nanosecond
				)

				if (!res.results) throw "No data to process"

				// Parse influx format - TODO move to db function

				const {
					columns,
					values,
				} = res.results?.[0].series?.[0]

				if (!columns) throw "No data to process"

				const idx = {}
				for (let i = 0; i < columns.length; i++) {
					idx[columns[i]] = i
				}

				const ihost = idx["host"]
				const ivalue = idx["value"]

				interface History {
					values: number[]
				}

				const status: { [key: string]: History } = {}

				for (let row of values) {
					if (!status[row[ihost]]) {
						status[row[ihost]] = {
							values: [],
						}
					}

					status[row[ihost]].values.push(row[ivalue])
				}

				// Compute current state

				interface HostStatus {
					unresponsive: boolean
					restartInitiated: number
				}

				interface AllStatus {
					[key: string]: HostStatus
				}

				const previousState = ctx.state.get(
					"hosts"
				) as AllStatus
				const currentState: AllStatus = {}

				for (let [host, { values }] of Object.entries(
					status
				)) {
					currentState[host] = {
						unresponsive:
							values.length > 4 &&
							values.every(
								(value) => value != Status.VM_RESPONSIVE
							) &&
							values.some(
								(value) => value != Status.NO_CONNECTIVITY
							),
						restartInitiated:
							previousState?.[host]?.restartInitiated || 0,
					}
				}

				// Act upon the computed state

				for (let [host, currently] of Object.entries(
					currentState
				)) {
					if (
						currently.unresponsive &&
						currently.restartInitiated < now - 15 * Minute
					) {
						console.log("Trying to restart", host)
						slackMessage(
							`:negative_squared_cross_mark: *${host}* VM unresponsive for the past ${
								UnresponsiveThreshold / Minute
							} minutes.\nTrying to restart the VM ...`
						)
						currently.restartInitiated = now
						await restartHost(host)
					}
					if (
						!currently.unresponsive &&
						currently.restartInitiated > 0
					) {
						slackMessage(
							`:heavy_check_mark: *${host}* VM is responsive again.`
						)
						currently.restartInitiated = 0
					}
				}

				ctx.state.set("hosts", currentState)
			} catch (e) {
				console.log(e)
			}

			resolve()
		})
	},
}

export default task
