import { exec } from "child_process"

function shell(cmd: string): Promise<string> {
	return new Promise((resolve, reject) => {
		exec(cmd, (error, stdout, stderr) => {
			if (error) {
				return reject({ error, stderr })
			}
			resolve(stdout)
		})
	})
}

export default shell
