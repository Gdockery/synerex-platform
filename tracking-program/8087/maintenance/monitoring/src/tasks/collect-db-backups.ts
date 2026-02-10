import {
	Task,
	Minute,
	Second,
	dayStart,
} from "../tasks"
import {
	readFileSync,
	readdir,
	fstatSync,
	statSync,
} from "fs"
import { Client, SFTPWrapper } from "ssh2"
import { FileEntry } from "ssh2-streams"
import { join } from "path"
import shell from "../shell"

const PrivateKey = readFileSync(
	"/home/vagrant/.ssh/xcorp@office"
)
const KnownHosts = [
	"aguas",
	"tijuana",
	"milpitas",
	"guadalajara",
	"gushu",
	"zhuhai",
]
const LocalPath =
	"/mnt/volume_nyc1_01/db-entities-backup/factories"
const RemotePath =
	"/home/xcorp/db-entities-backup"
const Last7Days = "last-7-days"
const AllTime = "all-time"

const soon = Date.now() - dayStart() + 1000

const task: Task = {
	slug: "collect-db-backups",
	name: "Collect DB Backups",
	runningInterval: 60 * Minute,
	startsAt: soon,

	run: (ctx) =>
		Promise.all(
			KnownHosts.map(
				(host) =>
					new Promise(async (resolve, reject) => {
						try {
							for (let type of [Last7Days, AllTime]) {
								let local, remote
								try {
									[local, remote] = await Promise.all([
										listLocal(host, type),
										listRemote(host, type),
									])
								} catch (listError) {
									// If remote directory doesn't exist, log and continue to next type
									const err: any = listError
									if (err.code === 2 || (err.message && err.message.includes("No such file"))) {
										ctx.log("Warning: Remote directory not found, skipping", host, type)
										continue
									}
									// For other errors, rethrow
									throw listError
								}

								for (let { name, size } of remote) {
									let localInfo = local.find(
										(item) => item.name == name
									)
									if (!localInfo || localInfo.size != size) {
										ctx.log("Downloading", host, type, name)
										try {
											await download(host, type, name)
										} catch (downloadError) {
											// If file doesn't exist, log warning and continue
											const err: any = downloadError
											if (err.code === 2 || (err.message && err.message.includes("No such file"))) {
												ctx.log("Warning: File not found on remote, skipping", host, type, name)
												continue
											}
											// For other errors, rethrow
											throw downloadError
										}
									}
								}
							}
						} catch (e) {
							return reject(e)
						}

						resolve()
					})
			)
		),
}

function connectToHost(
	host: string
): Promise<Client> {
	const remote = new Client()

	return new Promise((resolve, reject) => {
		remote
			.on("ready", () => resolve(remote))
			.on("error", reject)
			.connect({
				host,
				username: "xcorp",
				privateKey: PrivateKey,
			})
	})
}

function sftp(
	remote: Client
): Promise<SFTPWrapper> {
	return new Promise((resolve, reject) => {
		remote.sftp((err, sftp) => {
			if (err) {
				return reject(err)
			}

			resolve(sftp)
		})
	})
}

type SftpClients = {
	[host: string]: SFTPWrapper
}
type SshClients = { [host: string]: Client }

interface Clients {
	sftp: SftpClients
	ssh: SshClients
}

const clients: Clients = {
	sftp: {},
	ssh: {},
}

function getSftp(
	host: string
): Promise<SFTPWrapper> {
	return new Promise(async (resolve, reject) => {
		try {
			if (!clients.ssh[host]) {
				clients.ssh[host] = await connectToHost(host)
			}
			if (!clients.sftp[host]) {
				clients.sftp[host] = await sftp(clients.ssh[host])
			}
			resolve(clients.sftp[host])
		} catch (e) {
			reject(e)
		}
	})
}

function listSftp(
	sftp: SFTPWrapper,
	path: string
): Promise<FileEntry[]> {
	return new Promise((resolve, reject) => {
		sftp.readdir(path, (err, list) => {
			if (err) {
				return reject(err)
			}

			resolve(list)
		})
	})
}

function download(
	host: string,
	relativePath: string,
	fileName: string
): Promise<any> {
	return getSftp(host).then((sftp) => {
		const remotePath = join(
				RemotePath,
				relativePath,
				fileName
			),
			localPath = join(
				LocalPath,
				host,
				relativePath,
				fileName
			)

		return new Promise((resolve, reject) => {
			sftp.fastGet(remotePath, localPath, (err) => {
				if (err) {
					return reject(err)
				}
				resolve()
			})
		})
	})
}

function listRemote(
	host: string,
	relativePath: string
): Promise<{ name: string; size: number }[]> {
	return getSftp(host)
		.then((sftp) => {
			return listSftp(
				sftp,
				join(RemotePath, relativePath)
			)
		})
		.then((list) =>
			list.map((item) => ({
				name: item.filename,
				size: item.attrs.size,
			}))
		)
}

function listLocal(
	host: string,
	relativePath: string
): Promise<{ name: string; size: number }[]> {
	return new Promise((resolve, reject) => {
		const path = join(LocalPath, host, relativePath)
		shell(`mkdir -p "${path}"`)
			.then(() => {
				readdir(path, (err, names) => {
					if (err) {
						return reject(err)
					}

					resolve(
						names.map((name) => ({
							name,
							size: statSync(join(path, name)).size,
						}))
					)
				})
			})
			.catch(reject)
	})
}

export default task
