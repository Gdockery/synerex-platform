import {
	Second,
	Hour,
	Minute,
	Task,
} from "../tasks"
import { query } from "../db"
import { slackMessage, slackMessageToFactory, slackMessageToChannel } from "../slack"
import { isDeviceMuted, getMuteInfo } from "../mute"

const task: Task = {
	slug: "dev-last-comm",
	name: "Monitor devices last communication now",
	runningInterval: 5*60*1000,

	run: (ctx) =>
		new Promise(async (resolve, reject) => {
			try {
				const devices = [
					"switch",
					"gateway",
					"meter",
					"repeater",
				]

				const now = Date.now()
				const queryThreshold = now - (24 * 60*60*1000)

				const info = await query(
					devices
						.map(
							(device) => `
								(
									select
										p.name pname,
										p.slackChannel slackChannel,
										"${device}" as type,
										d.id id, d.name name, d.lastCommunicatedAt lastComm
									from project p
										join ${device} d on d.project = p.id
									where p.isDeleted = 0 and d.isDeleted = 0
										and d.lastCommunicatedAt > ${queryThreshold}
								)
							`
						)
						.join(" union ")
				)

				interface DeviceStatus {
					type: string
					id: number
					name: string
					projectName: string
					slackChannel: number | null
					inAlert: boolean
					lastComm: number
				}

				interface AllStatus {
					[key: string]: DeviceStatus
				}

				const previousStatus = ctx.state.get(
					"status"
				) as AllStatus

				const alertThreshold = now - (6 * Hour)

				const currentStatus = {} as AllStatus

				const newAlerts: DeviceStatus[] = []
				const newOKs: DeviceStatus[] = []

				for (let row of info as any[]) {
					const key = row.type + row.id
					const deviceStatus: DeviceStatus = {
						type: row.type,
						id: row.id,
						name: row.name,
						projectName: row.pname,
						slackChannel: row.slackChannel ? parseInt(row.slackChannel) : null,
						inAlert: row.lastComm < alertThreshold,
						lastComm: row.lastComm,
					}

					currentStatus[key] = deviceStatus

					if (!previousStatus) continue

					if (
						!previousStatus[key] ||
						previousStatus[key].inAlert !==
							deviceStatus.inAlert
					) {
						if (deviceStatus.inAlert) {
							newAlerts.push(deviceStatus)
						} else {
							newOKs.push(deviceStatus)
						}
					}
				}

				ctx.state.set("status", currentStatus)

				// Helper function to add one day to a YYYY-MM-DD date string
				// Since mute expires at 23:59:59, notifications resume the next day
				const addOneDay = (dateStr: string): string => {
					const date = new Date(dateStr + 'T00:00:00')
					date.setDate(date.getDate() + 1)
					return date.toISOString().split('T')[0]
				}

				// Track muted device announcements
				interface MutedDeviceAnnouncement {
					deviceName: string
					projectName: string
					unmuteDate: number // timestamp
				}
				const previousMuteAnnouncements = ctx.state.get("muteAnnouncements") as { [key: string]: MutedDeviceAnnouncement } || {}
				const currentMuteAnnouncements: { [key: string]: MutedDeviceAnnouncement } = {}

				// Check all devices that are currently muted and send announcements if needed
				for (let key in currentStatus) {
					const device = currentStatus[key]
					const muteInfo = getMuteInfo(device.name, device.projectName)
					
					if (muteInfo.muted && muteInfo.unmuteDate) {
						const muteKey = device.name + '|' + device.projectName
						const previousAnnouncement = previousMuteAnnouncements[muteKey]
						const unmuteTimestamp = muteInfo.unmuteDate.getTime()
						
						// Store current mute info
						currentMuteAnnouncements[muteKey] = {
							deviceName: device.name,
							projectName: device.projectName,
							unmuteDate: unmuteTimestamp
						}
						
						// If this is the first time we see it muted, or expiration changed, send announcement
						if (!previousAnnouncement) {
							// First time muted - send announcement
							// Add one day since mute expires at 23:59:59, notifications resume the next day
							const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
							const message = `:mute: *Device Muted*: *${device.projectName}* ${device.type} *${device.name}* is muted until ${resumeDateStr}. Notifications will resume automatically.`
							await slackMessageToChannel(message, device.slackChannel)
						} else if (previousAnnouncement.unmuteDate !== unmuteTimestamp) {
							// Expiration changed - send update
							// Add one day since mute expires at 23:59:59, notifications resume the next day
							const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
							const message = `:mute: *Mute Updated*: *${device.projectName}* ${device.type} *${device.name}* mute expiration changed to ${resumeDateStr}.`
							await slackMessageToChannel(message, device.slackChannel)
						}
					}
				}

				// On startup (no previousStatus), send one summary message per slackChannel
				if (!previousStatus) {
					// Group devices by slackChannel
					const devicesByChannel: { [key: string]: DeviceStatus[] } = {}
					
					for (let key in currentStatus) {
						const device = currentStatus[key]
						const channelKey = device.slackChannel?.toString() || "default"
						
						if (!devicesByChannel[channelKey]) {
							devicesByChannel[channelKey] = []
						}
						devicesByChannel[channelKey].push(device)
					}

					// Send one summary message per channel
					for (let channelKey in devicesByChannel) {
						const devices = devicesByChannel[channelKey]
						// Filter out muted devices
						const alertDevices = devices.filter(d => d.inAlert && !isDeviceMuted(d.name, d.projectName))
						const okDevices = devices.filter(d => !d.inAlert && !isDeviceMuted(d.name, d.projectName))
						
						let summary = `*Device Status Summary*\n`
						
						if (alertDevices.length > 0) {
							summary += `\n:red_circle: *${alertDevices.length} device(s) in alert:*\n`
							alertDevices.forEach(device => {
								summary += `• *${device.projectName}* ${device.type} *${device.name}*\n`
							})
						}
						
						if (okDevices.length > 0) {
							summary += `\n:heavy_check_mark: *${okDevices.length} device(s) OK*\n`
							okDevices.forEach(device => {
								summary += `• *${device.projectName}* ${device.type} *${device.name}*\n`
							})
						}

						// Only send summary if there are devices to report
						if (alertDevices.length > 0 || okDevices.length > 0) {
							const channelId = channelKey === "default" ? null : parseInt(channelKey)
							await slackMessageToChannel(summary, channelId)
						}
					}
				} else {
					// Normal operation: send individual messages for new alerts/OKs
					for (let device of newAlerts) {
						// Check mute status and handle announcements
						const muteInfo = getMuteInfo(device.name, device.projectName)
						if (muteInfo.muted) {
							// Device is muted - check if we need to announce
							const muteKey = device.name + '|' + device.projectName
							const previousAnnouncement = previousMuteAnnouncements[muteKey]
							const unmuteTimestamp = muteInfo.unmuteDate ? muteInfo.unmuteDate.getTime() : 0
							
							if (muteInfo.unmuteDate) {
								currentMuteAnnouncements[muteKey] = {
									deviceName: device.name,
									projectName: device.projectName,
									unmuteDate: unmuteTimestamp
								}
								
								// If first time or expiration changed, send announcement
								if (!previousAnnouncement) {
									// Add one day since mute expires at 23:59:59, notifications resume the next day
									const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
									const message = `:mute: *Device Muted*: *${device.projectName}* ${device.type} *${device.name}* is muted until ${resumeDateStr}. Notifications will resume automatically.`
									await slackMessageToChannel(message, device.slackChannel)
								} else if (previousAnnouncement.unmuteDate !== unmuteTimestamp) {
									// Add one day since mute expires at 23:59:59, notifications resume the next day
									const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
									const message = `:mute: *Mute Updated*: *${device.projectName}* ${device.type} *${device.name}* mute expiration changed to ${resumeDateStr}.`
									await slackMessageToChannel(message, device.slackChannel)
								}
							}
							// Skip sending the alert since device is muted
							continue
						}
						
						// Not muted - send the alert
						await slackMessageToChannel(
							`:red_circle: *${device.projectName}* ${device.type} *${device.name}*`,
							device.slackChannel
						)
					}

					for (let device of newOKs) {
						// Check mute status and handle announcements
						const muteInfo = getMuteInfo(device.name, device.projectName)
						if (muteInfo.muted) {
							// Device is muted - check if we need to announce
							const muteKey = device.name + '|' + device.projectName
							const previousAnnouncement = previousMuteAnnouncements[muteKey]
							const unmuteTimestamp = muteInfo.unmuteDate ? muteInfo.unmuteDate.getTime() : 0
							
							if (muteInfo.unmuteDate) {
								currentMuteAnnouncements[muteKey] = {
									deviceName: device.name,
									projectName: device.projectName,
									unmuteDate: unmuteTimestamp
								}
								
								// If first time or expiration changed, send announcement
								if (!previousAnnouncement) {
									// Add one day since mute expires at 23:59:59, notifications resume the next day
									const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
									const message = `:mute: *Device Muted*: *${device.projectName}* ${device.type} *${device.name}* is muted until ${resumeDateStr}. Notifications will resume automatically.`
									await slackMessageToChannel(message, device.slackChannel)
								} else if (previousAnnouncement.unmuteDate !== unmuteTimestamp) {
									// Add one day since mute expires at 23:59:59, notifications resume the next day
									const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
									const message = `:mute: *Mute Updated*: *${device.projectName}* ${device.type} *${device.name}* mute expiration changed to ${resumeDateStr}.`
									await slackMessageToChannel(message, device.slackChannel)
								}
							}
							// Skip sending the OK message since device is muted
							continue
						}
						
						// Not muted - send the OK message
						await slackMessageToChannel(
							`:heavy_check_mark: *${device.projectName}* ${device.type} *${device.name}*`,
							device.slackChannel
						)
					}
				}
				
				// Save mute announcements state
				ctx.state.set("muteAnnouncements", currentMuteAnnouncements)

				// Power Imbalance Check
				const powerImbalanceQuery = `
					SELECT
						p.name AS projectName,
						p.slackChannel AS slackChannel,
						d.name AS deviceName,
						d.id,
						'meter' AS type
					FROM project p
					JOIN meter d ON d.project = p.id
					WHERE
						p.isDeleted = 0
						AND d.isDeleted = 0
						AND d.isFilter = 1
						AND d.lastTotalAmp > 33 
						AND d.lastOutputAmp < 10;
				`

				const highAmpLowOutputMeters = await query(powerImbalanceQuery)
				
				for (let meter of highAmpLowOutputMeters as any[]) {
					// Check if muted and handle announcements
					const muteInfo = getMuteInfo(meter.deviceName, meter.projectName)
					if (muteInfo.muted) {
						// Device is muted - check if we need to announce
						const muteKey = meter.deviceName + '|' + meter.projectName
						const previousAnnouncement = previousMuteAnnouncements[muteKey]
						const unmuteTimestamp = muteInfo.unmuteDate ? muteInfo.unmuteDate.getTime() : 0
						
						// Update current mute announcements
						if (muteInfo.unmuteDate) {
							currentMuteAnnouncements[muteKey] = {
								deviceName: meter.deviceName,
								projectName: meter.projectName,
								unmuteDate: unmuteTimestamp
							}
							
							// If first time or expiration changed, send announcement
							if (!previousAnnouncement) {
								// Add one day since mute expires at 23:59:59, notifications resume the next day
								const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
								const message = `:mute: *Device Muted*: *${meter.projectName}* meter *${meter.deviceName}* is muted until ${resumeDateStr}. Notifications will resume automatically.`
								const channelId = meter.slackChannel ? parseInt(meter.slackChannel) : null
								await slackMessageToChannel(message, channelId)
							} else if (previousAnnouncement.unmuteDate !== unmuteTimestamp) {
								// Add one day since mute expires at 23:59:59, notifications resume the next day
								const resumeDateStr = muteInfo.unmuteDateStr ? addOneDay(muteInfo.unmuteDateStr) : (muteInfo.unmuteDate ? addOneDay(muteInfo.unmuteDate.toISOString().split('T')[0]) : '')
								const message = `:mute: *Mute Updated*: *${meter.projectName}* meter *${meter.deviceName}* mute expiration changed to ${resumeDateStr}.`
								const channelId = meter.slackChannel ? parseInt(meter.slackChannel) : null
								await slackMessageToChannel(message, channelId)
							}
						}
						// Skip sending the alert since device is muted
						continue
					}
					
					// Not muted - send the alert
					const message = `:octagonal_sign: *Power Imbalance Alert* on meter *${meter.deviceName}* in project *${meter.projectName}*`
					const channelId = meter.slackChannel ? parseInt(meter.slackChannel) : null
					await slackMessageToChannel(message, channelId)
				}

				resolve()
			} catch (e) {
				console.log(e)
				reject(e)
			}
		}),
}

export default task
