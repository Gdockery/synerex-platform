import { influxGet, influxPost } from "./db"

const Millisecond = 1,
	Second = 1000,
	Minute = 60 * 1000,
	Hour = 60 * 60 * 1000,
	Nanosecond = 1e-6

type Milliseconds = number
type Timestamp = number

function timeout(duration) {
	return new Promise((resolve) =>
		setTimeout(resolve, duration)
	)
}

function dayStart(date?: Date): Timestamp {
	return new Date(
		(date || new Date())
			.toISOString()
			.substring(0, 11) + "00:00:00Z"
	).getTime()
}

interface Task {
	slug: string
	name: string
	isRunning?: boolean

	runningInterval: Milliseconds
	startsAt?: Milliseconds

	lastStarted?: Timestamp
	lastEnded?: Timestamp

	nextRun?: Timestamp

	run(ctx: TaskContext): Promise<any>
}

export interface TaskContext {
	task: Task
	state: TaskState
	log: Function
}

const TaskStateStorage = {}

class TaskState {
	constructor(private task: Task) {}

	get(key) {
		if (!TaskStateStorage[this.task.name]) {
			TaskStateStorage[this.task.name] = {}
		}

		return TaskStateStorage[this.task.name][key]
	}

	set(key, value) {
		if (!TaskStateStorage[this.task.name]) {
			TaskStateStorage[this.task.name] = {}
		}

		TaskStateStorage[this.task.name][key] = value
	}
}

interface RunnerContext {
	tasks: Task[]
}

function runTasks(tasks: Task[]): RunnerContext {
	const ctx: RunnerContext = { tasks }

	setTimeout(async () => {
		syncTasks(tasks)
		function checkPending() {
			const now = Date.now(),
				pending = []

			for (let task of tasks) {
				if (!task.isRunning && task.nextRun < now) {
					run(task)
				}

				pending.push(task.nextRun)
			}

			pending.sort()

			setTimeout(
				checkPending,
				Math.max(1000, pending[0] - now)
			)
		}
		checkPending()
	}, 1)

	return ctx
}

/** Get run time information about the task from the influxDB */
function syncTasks(tasks: Task[]): Promise<void> {
	return new Promise((resolve, reject) => {
		const queries = tasks
			.reduce(
				(queries, task) => [
					...queries,
					`select "name", value, time from monitoring_task where "name"='${task.name}' and value='start' order by time desc limit 1`,
					`select "name", value, time from monitoring_task where "name"='${task.name}' and value='end' order by time desc limit 1`,
				],
				[]
			)
			.join("; ")

		const tasksByName: { [key: string]: Task } = {}
		for (let task of tasks) {
			tasksByName[task.name] = task
		}

		influxGet(queries)
			.then((data) => {
				data = data["results"].forEach((result) => {
					if (!result.series || !result.series.length)
						return

					const { columns, values } = result.series[0]
					if (!values.length) return

					const indexes = []
					columns.forEach((name, i) => {
						indexes[name] = i
					})

					const task =
						tasksByName[values[0][indexes["name"]]]
					const time = new Date(
						values[0][indexes["time"]]
					).getTime()

					switch (values[0][indexes["value"]]) {
						case "start":
							task.lastStarted = time
							break
						case "end":
							task.lastEnded = time
							break
					}
				})

				for (let task of tasks) {
					task.nextRun = nextRun(task)
				}

				// Promise.all(tasks.map(forceMarkEnd))
				// 	.then(() => resolve())
				// 	.catch(reject)
				resolve()
			})
			.catch((err) => {
				console.log(err)
				reject(err)
			})
	})
}

function nextRun(task: Task): Timestamp {
	const now = Date.now()

	if (!task.startsAt) {
		if (!task.lastStarted) return now

		if (now - task.lastStarted > task.runningInterval)
			return now

		return task.lastStarted + task.runningInterval
	}

	let taskStart = dayStart() + task.startsAt
	while (now > taskStart) {
		taskStart += task.runningInterval
	}

	return taskStart
}

function writeStart(task: Task): Promise<any> {
	return influxPost(
		"monitoring_task",
		{ name: task.name },
		"start"
	)
}

function writeEnd(task: Task): Promise<any> {
	return influxPost(
		"monitoring_task",
		{ name: task.name },
		"end"
	)
}

function run(task: Task): Promise<void> {
	if (task.isRunning) return

	task.isRunning = true
	writeStart(task)
	task.lastStarted = Date.now()
	task.nextRun = nextRun(task)

	function done() {
		task.isRunning = false
		writeEnd(task)
		task.lastEnded = Date.now()
	}

	return task
		.run({
			task,
			state: new TaskState(task),
			log: (...args) =>
				console.log(...[`[${task.slug}]`, ...args]),
		})
		.then(() => {
			console.log(`Task "${task.name}" complete`)
			done()
		})
		.catch((err) => {
			console.log(`Task "${task.name}" failed`, err)
			done()
		})
}

function forceMarkEnd(task: Task): Promise<void> {
	task.isRunning = false
	task.lastEnded = Date.now()
	return writeEnd(task)
}

export {
	runTasks,
	dayStart,
	Task,
	Millisecond,
	Second,
	Minute,
	Hour,
	Nanosecond,
}
