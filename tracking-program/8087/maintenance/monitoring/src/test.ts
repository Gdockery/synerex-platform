import { runTasks } from "./tasks"

import collectDbBackups from "./tasks/collect-db-backups"

runTasks([collectDbBackups])
