import { serve } from "./web"
import { runTasks } from "./tasks"
import devLastComm from "./tasks/dev-last-comm"
import basicChecks from "./tasks/basic-checks"
import restartVms from "./tasks/restart-vms"
import collectDbBackups from "./tasks/collect-db-backups"

serve(1341, {
	"/": (ctx) => {
		ctx.json("ok")
	},
})

runTasks([
	devLastComm,
	basicChecks,
	restartVms,
	collectDbBackups,
])

