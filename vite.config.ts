import { reactRouter } from "@react-router/dev/vite";
import type { UserConfig } from "vite";
import { compilerOptions } from "#tsconfig.json";

export default {
	build: {
		target: compilerOptions.target,
	},
	plugins: [reactRouter()],
} satisfies UserConfig;
