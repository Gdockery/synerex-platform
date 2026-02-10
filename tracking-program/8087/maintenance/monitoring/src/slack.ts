
// @ts-nocheck - config/local.js exists at runtime
import { post } from "./web";
import { slackUrl, slackHooks } from "../../../config/local";

async function slackMessage(msg: string) {
	try {
		if (!slackUrl) {
			console.error("❌ Error: No Slack URL configured.");
			return;
		}

		await post(slackUrl, JSON.stringify({ text: msg }));
		console.log(`✅ Slack message sent: ${msg}`);
	} catch (error) {
		console.error("❌ Failed to send Slack message:", error);
	}
}

async function slackMessageToFactory(msg: string, factory: number) {
	try {
		if (!slackHooks || !slackHooks.urls || factory < 0 || factory >= slackHooks.urls.length) {
			console.error("❌ Error: Invalid factory index or missing Slack hooks.");
			return;
		}

		await post(slackHooks.urls[factory], JSON.stringify({ text: msg }));
		console.log(`✅ Message sent to factory ${factory}: ${msg}`);
	} catch (error) {
		console.error(`❌ Failed to send Slack message to factory ${factory}:`, error);
	}
}

async function slackMessageToChannel(msg: string, channelId: number | null | undefined) {
	try {
		// If channelId is 0, null, or undefined, use default channel
		if (!channelId || channelId === 0) {
			return await slackMessage(msg);
		}

		// If channelId is a valid index into slackHooks.urls, use it
		if (slackHooks && slackHooks.urls && channelId > 0 && channelId <= slackHooks.urls.length) {
			// channelId is 1-indexed (1, 2, 3, 4), but array is 0-indexed
			const index = channelId - 1;
			await post(slackHooks.urls[index], JSON.stringify({ text: msg }));
			console.log(`✅ Message sent to channel ${channelId}: ${msg}`);
		} else {
			// Invalid channel ID, fall back to default
			console.warn(`⚠️ Invalid channel ID ${channelId}, using default channel`);
			return await slackMessage(msg);
		}
	} catch (error) {
		console.error(`❌ Failed to send Slack message to channel ${channelId}:`, error);
	}
}

export { slackMessageToFactory, slackMessage, slackMessageToChannel };

