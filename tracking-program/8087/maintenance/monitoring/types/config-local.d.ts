declare module '../../../config/local' {
	export const slackUrl: string | undefined;
	export const slackHooks: {
		urls?: string[];
	} | undefined;
	export const mysql: {
		host: string;
		user: string;
		password: string;
		database: string;
	};
	export const influxUrl: string | undefined;
}
