import { Task, Second } from "../tasks"
import shell from "../shell"
import { influxPost } from "../db"

const IdentityFile =
	"/home/vagrant/.ssh/xcorp@office"

const Hosts = [
	"aguas",
	"tijuana",
	"milpitas",
	"guadalajara",
]

const Pings = 1

enum Status {
	NO_CONNECTIVITY,
	REACHABLE,
	VM_UP,
	VM_RESPONSIVE,
}

const task: Task = {
	slug: "basic-checks",
	name: "Monitor factory VPN and VM",
	runningInterval: 30 * Second,

	run: (ctx) =>
		new Promise((resolve, reject) => {
			Promise.all(Hosts.map(checkHost))
				.then((statuses) => {
					// console.log(Hosts, statuses)
					resolve()
				})
				.catch(reject)
		}),
}

function checkHost(
	host: string
): Promise<Status> {
	return new Promise(async (resolve) => {
		let status = Status.NO_CONNECTIVITY,
			out: string,
			m: RegExpMatchArray

		try {
			// ------ REACHABLE? ------

			out = await shell(
				`ping -c ${Pings} -q ${host} | grep "packet loss"`
			)

			m = out.match(/([\d]+)% packet loss/)
			if (!m) throw "Unexpected output from subcommand"

			if (m[1] !== "0")
				throw `${host} host not reachable`

			status = Status.REACHABLE

			// ------ VM UP? ------

			const ssh = hostSsh(host)

			out = await shell(
				`${ssh} vboxmanage list runningvms`
			)

			m = out.match(/Xeco-Portal/)
			if (!m) throw `${host} VM seems to be down`

			status = Status.VM_UP

			// ------ VM RESPONSIVE? ------

			out = await shell(
				`${ssh} "ssh -oStrictHostKeyChecking=no -i /home/xcorp/Documents/Xeco-Portal/.vagrant/machines/default/virtualbox/private_key -p 2222 vagrant@${process.env.VAGRANT_HOST} date"`
			)

			status = Status.VM_RESPONSIVE
		} catch (err) {
			console.log(err)
		}

		influxPost(
			"xeco_health",
			{
				host,
			},
			status
		).finally(() => {
			resolve(status)
		})
	})
}

function hostSsh(host: string) {
	return `ssh -oStrictHostKeyChecking=no -i ${IdentityFile} xcorp@${host}`
}

function restartHost(host) {
	return shell(
		`${hostSsh(
			host
		)} "cd Documents/Xeco-Portal && vagrant halt -f && vagrant up"`
	)
}

export default task
export { Status, restartHost }
