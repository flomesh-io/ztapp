import { Command, Child, open } from '@tauri-apps/plugin-shell';
import { invoke } from '@tauri-apps/api/core';
import { resourceDir, appLogDir, appDataDir } from '@tauri-apps/api/path';
import { platform } from '@tauri-apps/plugin-os';
import store from "@/store";

export default class ShellService {
	async getDB () {
		const appDataDirPath = await resourceDir();
		return `${appDataDirPath}/ztm.db`
	}
	async takePipyVersion () {
		console.log("takePipyVersion");
		let command = await Command.sidecar("bin/ztm", ['version','--json','','','','']);
		await command.spawn();
		command.stdout.on('data', line => {
			console.log(line)
			//{"ztm":{"version":"v0.0.2","commit":"a73787b37cb500044410325b04558d2507a847f7","date":"Sat, 18 May 2024 18:55:27 +0800"},"pipy":{"version":"1.1.0-33","commit":"bd7450a98c9513394869493753456944aa26c1f7","date":"Sat, 18 May 2024 18:10:58 +0800"}}
			store.commit('account/setVersion', !!line ? JSON.parse(line) : {});
		});
		
		// let command = await invoke("plugin:shell|execute", {
		//     program: "LD_LIBRARY_PATH=.",
		//     args: ['./pipy','-v','','',''],
		// 		options: {},
		// });
		// let command = await invoke("plugin:shell|execute", {
		//     program: "sudo",
		//     args: ["ls",""],
		// 		options: {},
		// });
		// console.log(command);
		// let command = await Command.create("pipy", ['-v','','','','']);
		// const rst = await command.spawn();
		// console.log(rst)
	}
	async startPipy (port, reset, callError){
		await this.pausePipy();
		const resourceDirPath = await resourceDir();
		localStorage.setItem("VITE_APP_API_PORT", port);
		// const appLogDirPath = await appLogDir();
		// `${resourceDirPath}/_up_/_up_/agent/main.js`,
		const args = [
			"run",
			"agent",
			`--listen=${port}`,
			`--database=${resourceDirPath}/ztm.db`,
			// `--log-file=${resourceDirPath}/ztm.log`,
		];
		if(reset){
			args.push("--reset");
		} else {
			args.push("");
		}
		args.push("");
		console.log(`[starting pipy:${args}]`);
		const command = Command.sidecar("bin/ztm", args);
		command.on('close', data => {
			console.log("[close]");
			console.log(data);
			store.commit('account/pushLog', {level:'Info',msg:`pipy pause with code ${data.code} and signal ${data.signal}`});
		});
		command.stdout.on('data', line => {
			console.log("[data]");
			store.commit('account/pushLog', {level:'Info',msg:line});
		});
		command.stderr.on('data', line => {
			console.log("[data]");
			store.commit('account/pushLog', {level:'Error',msg:line});
			callError(line);
		});
		command.on('error', error => {
			console.log("[error]");
			store.commit('account/pushLog', {level:'Error',msg:error});
			callError(error);
		});
		let child = await command.spawn();
		store.commit('account/setPid', child.pid);
		store.commit('account/setChild', child);
	}
	async pausePipy (){
		let child = store.getters['account/child'];
		let pid = store.getters['account/pid'];
		if(!!child){
			child.kill();
			store.commit('account/setPid', null);
		}else if(!!pid){
			const findChild = new Child(pid*1);
			findChild.kill();
			store.commit('account/setPid', null);
		}
		console.log('[paused pipy]');
	}
}
