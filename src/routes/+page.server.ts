import { check } from "canary-probe";
import debug from "debug";
import fs from "node:fs";
import path from "node:path";
import type { Actions } from "./$types";

const log = debug("canary-probe");
log.enabled = true;

const dir = path.join(process.cwd(), "tmp");
if (!fs.existsSync(dir)) {
	fs.mkdirSync(dir);
}

let running = 0;
const maximum = 4;
const queue: (() => void)[] = [];

async function execute_task(task: () => Promise<any>) {
	log("Executing task", running);
	if (running < maximum) {
		// Increment the current concurrency count
		running++;

		// Execute the task
		try {
			return await task();
		} finally {
			// Decrement the current concurrency count
			running--;

			// Check if there are tasks in the queue
			if (queue.length > 0) {
				// Dequeue the next task and execute it
				const next = queue.shift();
				if (next) {
					next();
				}
			}
		}
	} else {
		// Queue the task
		return new Promise((resolve, reject) => {
			log("Queueing task", queue.length);
			queue.push(async () => {
				try {
					const result = await task();
					resolve(result);
				} catch (e) {
					reject(e);
				}
			});
		});
	}
}

export const actions = {
	default: async ({ request, getClientAddress }) => {
		const l = log.extend(getClientAddress());
		l.enabled = true;
		return execute_task(async () => {
			// get zip file in the request and save it to the file system
			const form = await request.formData();
			const file = form.get("file");
			if (!(file instanceof File)) {
				l("No file provided");
				return { success: false, body: "No file provided" };
			}

			const filepath = path.resolve(dir, `${Date.now()}-${file.name}`);
			const bytes = new Uint8Array(await file.arrayBuffer());
			l("Saving file to", filepath);
			fs.writeFileSync(filepath, bytes);

			try {
				const result = await check(filepath);
				l("Result:", result);
				return { success: true, body: result.executables.join(", ") };
			} catch (e) {
				if (e instanceof Error) {
					l("Error:", e.message);
					return { success: false, body: e.message };
				}
			}
		});
	},
} satisfies Actions;
