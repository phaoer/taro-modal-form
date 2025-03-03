import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import { dts } from "rollup-plugin-dts";
import terser from "@rollup/plugin-terser";
import typescript from "rollup-plugin-typescript2";

export default [
	{
		input: "src/index.tsx",
		output: [
			{
				file: "dist/index.cjs",
				format: "cjs",
				exports: "named",
			},
			{
				file: "index.js",
				format: "esm",
				exports: "named",
			},
		],
		plugins: [resolve(), commonjs(), typescript(), terser()],
		external: ["react", "react-dom", "@tarojs/taro", "@tarojs/components"],
	},
	{
		input: "src/index.tsx",
		output: {
			file: "index.d.ts",
		},
		plugins: [dts()],
	},
	{
		input: "src/index.tsx",
		output: {
			file: "dist/index.d.cts",
		},
		plugins: [dts()],
	},
];
