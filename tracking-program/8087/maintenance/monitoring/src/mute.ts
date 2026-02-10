// @ts-nocheck
import * as fs from 'fs'
import * as path from 'path'

interface MuteRule {
	deviceName: string
	projectName: string
	unmuteDate: Date
	unmuteDateStr: string // Original date string from file (YYYY-MM-DD)
}

let muteRules: MuteRule[] = []
let lastMuteFileCheck: number = 0
const MUTE_FILE_CHECK_INTERVAL = 60 * 1000 // Check file every minute

// Determine monitoring directory path
// When compiled, __dirname will be dist/ (not dist/src/), so go up one level to get monitoring root
// When running from source, __dirname will be src/, so go up one level
function getMonitoringDir(): string {
	// If we're in dist/, go up one level to get monitoring root
	if (__dirname.includes('dist')) {
		return path.join(__dirname, '../')
	}
	// Otherwise assume we're in src/ (development)
	return path.join(__dirname, '../')
}

// Log __dirname on module load to debug path issues
console.log('[MUTE] Module __dirname:', __dirname)
const monitoringDir = getMonitoringDir()
console.log('[MUTE] Monitoring directory:', monitoringDir)
const MUTE_FILE_PATH = path.join(monitoringDir, 'device-mutes.ini')
console.log('[MUTE] Mute file path:', MUTE_FILE_PATH)

/**
 * Parse INI file with mute rules
 * Format: deviceName, projectName, unmuteDate (YYYY-MM-DD)
 * Example: "APF-02 Meter", "Nestle Vital Proteins", "2026-01-18"
 */
function parseMuteFile(): MuteRule[] {
	const rules: MuteRule[] = []
	
	try {
		console.log('[MUTE] Checking mute file at:', MUTE_FILE_PATH)
		if (!fs.existsSync(MUTE_FILE_PATH)) {
			console.log('[MUTE] Mute file not found at:', MUTE_FILE_PATH)
			return rules
		}
		
		const content = fs.readFileSync(MUTE_FILE_PATH, 'utf-8')
		const lines = content.split('\n')
		console.log('[MUTE] Parsing mute file, found', lines.length, 'lines')
		
		for (let line of lines) {
			line = line.trim()
			
			// Skip empty lines and comments
			if (!line || line.startsWith('#') || line.startsWith(';')) {
				continue
			}
			
			// Parse format: "deviceName", "projectName", "YYYY-MM-DD"
			// Handle quoted strings
			const match = line.match(/^"([^"]+)"\s*,\s*"([^"]+)"\s*,\s*"(\d{4}-\d{2}-\d{2})"$/)
			if (match) {
				const [, deviceName, projectName, dateStr] = match
				const unmuteDate = new Date(dateStr + 'T23:59:59') // End of day
				const now = new Date()
				
				// Only add if unmute date is in the future
				if (unmuteDate > now) {
					rules.push({
						deviceName: deviceName.trim(),
						projectName: projectName.trim(),
						unmuteDate: unmuteDate,
						unmuteDateStr: dateStr // Store original date string
					})
					console.log('[MUTE] Added rule:', deviceName.trim(), 'in', projectName.trim(), 'until', unmuteDate.toISOString())
				} else {
					console.log('[MUTE] Skipped expired rule:', deviceName.trim(), 'in', projectName.trim(), '(unmute date:', unmuteDate.toISOString(), 'is in past)')
				}
			} else if (line && !line.startsWith('#') && !line.startsWith(';')) {
				console.log('[MUTE] Failed to parse line:', line)
			}
		}
	} catch (error) {
		console.error('[MUTE] Error reading mute file:', error)
	}
	
	console.log('[MUTE] Loaded', rules.length, 'mute rules')
	return rules
}

/**
 * Check if a device should be muted
 * Returns true if device is muted (should NOT send notification)
 */
export function isDeviceMuted(deviceName: string, projectName: string): boolean {
	const now = Date.now()
	
	// Reload mute file if it's been more than a minute since last check
	if (now - lastMuteFileCheck > MUTE_FILE_CHECK_INTERVAL) {
		muteRules = parseMuteFile()
		lastMuteFileCheck = now
	}
	
	// Check if device matches any mute rule
	for (let rule of muteRules) {
		if (rule.deviceName === deviceName && rule.projectName === projectName) {
			// Check if still muted (unmute date hasn't passed)
			const stillMuted = rule.unmuteDate > new Date()
			if (stillMuted) {
				console.log('[MUTE] Device is muted:', deviceName, 'in', projectName, 'until', rule.unmuteDate.toISOString())
				return true
			} else {
				console.log('[MUTE] Device mute expired:', deviceName, 'in', projectName, '(unmute date:', rule.unmuteDate.toISOString(), ')')
			}
		}
	}
	
	console.log('[MUTE] Device not muted:', deviceName, 'in', projectName, '(checked', muteRules.length, 'rules)')
	return false
}

/**
 * Get mute info for a device (returns unmuteDate and original date string if muted)
 */
export function getMuteInfo(deviceName: string, projectName: string): { muted: boolean, unmuteDate?: Date, unmuteDateStr?: string } {
	const now = Date.now()
	
	// Reload mute file if needed
	if (now - lastMuteFileCheck > MUTE_FILE_CHECK_INTERVAL) {
		muteRules = parseMuteFile()
		lastMuteFileCheck = now
	}
	
	for (let rule of muteRules) {
		if (rule.deviceName === deviceName && rule.projectName === projectName) {
			if (rule.unmuteDate > new Date()) {
				return { muted: true, unmuteDate: rule.unmuteDate, unmuteDateStr: rule.unmuteDateStr }
			}
		}
	}
	
	return { muted: false }
}

/**
 * Get all currently muted devices (for checking announcements)
 */
export function getAllMutedDevices(): Array<{ deviceName: string, projectName: string, unmuteDate: Date }> {
	const now = Date.now()
	
	// Reload mute file if needed
	if (now - lastMuteFileCheck > MUTE_FILE_CHECK_INTERVAL) {
		muteRules = parseMuteFile()
		lastMuteFileCheck = now
	}
	
	const muted: Array<{ deviceName: string, projectName: string, unmuteDate: Date }> = []
	for (let rule of muteRules) {
		if (rule.unmuteDate > new Date()) {
			muted.push({
				deviceName: rule.deviceName,
				projectName: rule.projectName,
				unmuteDate: rule.unmuteDate
			})
		}
	}
	
	return muted
}
