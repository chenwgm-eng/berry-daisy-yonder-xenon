//#region node_modules/.nitro/vite/services/ssr/assets/_tanstack-start-manifest_v-DdaKpjFj.js
var tsrStartManifest = () => ({ routes: {
	__root__: {
		filePath: "/workspace/src/routes/__root.tsx",
		children: [
			"/",
			"/team",
			"/api/chat",
			"/sprint/$sprintId"
		],
		preloads: ["/assets/index-BygfYA4C.js"],
		scripts: [{ attrs: {
			type: "module",
			async: !0,
			src: "/assets/index-BygfYA4C.js"
		} }]
	},
	"/": {
		filePath: "/workspace/src/routes/index.tsx",
		children: void 0,
		preloads: [
			"/assets/routes-hhfGGRxF.js",
			"/assets/textarea-CWiZSGuY.js",
			"/assets/mark-DdSDFOi7.js"
		]
	},
	"/team": {
		filePath: "/workspace/src/routes/team.tsx",
		children: void 0,
		preloads: ["/assets/team-B8kFAMH9.js", "/assets/mark-DdSDFOi7.js"]
	},
	"/sprint/$sprintId": {
		filePath: "/workspace/src/routes/sprint.$sprintId.tsx",
		children: void 0,
		preloads: [
			"/assets/sprint._sprintId-Bpckumcc.js",
			"/assets/textarea-CWiZSGuY.js",
			"/assets/mark-DdSDFOi7.js"
		]
	}
} });
//#endregion
export { tsrStartManifest };
