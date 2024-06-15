<script setup>
import { ref, computed } from 'vue';
import { useStore } from 'vuex';
import { useRouter } from 'vue-router';
import AppService from '@/service/AppService';
import { WebviewWindow } from '@tauri-apps/api/webviewWindow'
import { Webview } from '@tauri-apps/api/webview'
import { getCurrent,Window } from '@tauri-apps/api/window'
import { invoke } from '@tauri-apps/api/core';
import { getCurrent as getCurrentDL } from '@tauri-apps/plugin-deep-link';
import broswerPng from "@/assets/img/broswer.png";
import PipyProxyService from '@/service/PipyProxyService';
import MeshSelector from '@/views/mesh/common/MeshSelector.vue'
import { apps } from '@/utils/app-store'

const router = useRouter();
const store = useStore();
const appService = new AppService();
const pipyProxyService = new PipyProxyService();
const logs = computed(() => {
	return store.getters['account/logs']
});
const props = defineProps(['apps']);
const emits = defineEmits(['close','reload']);
const hide = () => {
	emits('close','')
}
const clear = () => {
}

const innerApps = computed(()=>{
	const rtn = [];
	apps.forEach((app)=>{
		if(!(props.apps||[]).find((papp)=>papp.name == app.name)){
			rtn.push({...app,loading:false})
		}
	});
	return rtn;
})
const appLoading = ref({})
const pages = computed(()=>{
	const _pages = Math.ceil(((props.apps||[]).length + 1 + innerApps.value.length)/8);
	return _pages>0?new Array(_pages):[];
});
const appPageSize = 8;
const platform = computed(() => {
	return store.getters['account/platform']
});
const openWebview = (app)=>{
	store.commit('webview/setTarget', {
		icon: app.icon,
		name: app.name,
		url: app.url,
		proxy: app.proxy,
	});
	
	try{
		// const appWindow = new Window(`${app.name}-window`);
		const options = {
			url: app.url,
			proxyUrl: !!app.url?app.proxy:'',
			title: app.name,
			width:960
		};
		
		if(!!app.url){
			options.proxyUrl = app.proxy
		}
		if(!options.url){
			options.url = "http://"+(app?.port?.listen?.ip||'127.0.0.1')+':'+app?.port?.listen?.port;
		}
		if(platform.value=='android'){
			//=============
			// invoke('load_webview_with_proxy', { 
			// 	url: options.url, 
			// 	proxyHost: (app?.port?.listen?.ip||'127.0.0.1'), 
			// 	proxyPort: app?.port?.listen?.port
			// });
			// location.href=options.url;
			getCurrentDL().then((urls)=>{
				console.log(urls)
			})
		}	else if(platform.value=='windows' || true){
			// windows API not available on mobile
			options.parent = getCurrent();
			
			 const appWindow = new Window(`${app.name}-window`,options);
			 
			 appWindow.once('tauri://created', function (win) {
				 options.x = 0;
				 options.y = 0;
				 options.height = 800;
				 const label = `${app.name}-webview`;
				  invoke('create_proxy_webview', {
						windowLabel: appWindow.label,
						label,
						curl: options.url,
						proxyUrl: options.proxyUrl||''
				  });
			 });
			 appWindow.once('tauri://error', function (e) {
				 console.log('Window://error')
			 });
			 
			 // invoke('create_wry_webview', {
			 // 						windowLabel: appWindow.label,
			 // 						label,
			 // 						curl: options.url,
			 // 						proxyHost: app?.port?.listen?.ip||'127.0.0.1',
			 // 						proxyPort: `${app?.port?.listen?.port}`
			 // });
			  // const webview = new Webview(appWindow, label, options);
			  // webview.once('tauri://created', function (d) {
			  // 	console.log('Webview://created')
			  // 	console.log(d)
			  // });
			  // webview.once('tauri://error', function (e) {
			  // 	console.log('Webview://error')
			  // 	console.log(e)
			  // });
			 // window successfully created
		} else {
			const webview = new WebviewWindow(`${app.name}-webview`, options);
			webview.once('tauri://created', function (d) {
				console.log('WebviewWindow://created')
				console.log(d)
			// webview successfully created
			});
			webview.once('tauri://error', function (e) {
				console.log('WebviewWindow://error')
				console.log(e)
			// an error happened creating the webview
			});
		}
	}catch(e){
		console.log(e)
	}
	
}
const target = computed(()=>{
	return store.getters['webview/target']
})
const removeApp = (app) => {
	appService.removeApp(app, () => {
		emits('reload','')
	})
}
const manage = ref(false);
const appPage = computed(()=>(page)=>{
	return (props.apps||[]).filter((n,i) => i>=page*appPageSize && i< (page+1)*appPageSize);
})
const broswer = ref({
	mesh:null,
	show:false,
	url:'',
	port:null,
	ports:[]
});
const openBroswer = () => {
	broswer.value.show = true;
	pipyProxyService.getMeshes()
		.then(res => {
			store.commit('account/setMeshes', res);
		})
		.catch(err => console.log('Request Failed', err)); 
}
const openBroswerContent = () => {
	openWebview({
		...broswer.value,
		proxy: `socks5://${broswer.value.port?.listen?.ip||'127.0.0.1'}:${broswer.value.port?.listen?.port}`
	})
}
const getPorts = (mesh) => {
	broswer.value.mesh = mesh;
	if(!broswer.value?.mesh?.name){
		return
	}
	pipyProxyService.getPorts({
		mesh:broswer.value?.mesh?.name,
		ep:broswer.value?.mesh?.agent?.id,
	})
		.then(res => {
			console.log(res)
			broswer.value.ports = res || [];
			broswer.value.ports.forEach((p)=>{
				p.id = p.listen.port;
				p.name = p.listen.port;
			})
		})
		.catch(err => {
		}); 
}
const installAPP = (app) => {
	try{
		appLoading.value[app.name] = true;
			appService.newApp(app,()=>{
				emits('reload','')
				setTimeout(() => {
					appLoading.value[app.name] = false;
				},500)
			})
		console.log(config.value)
	}catch(e){
	}
}
</script>

<template>
	<ScrollPanel class="container">
	<div class="container_pannel">
	    <div class="container_terminal"></div>
			<div class="flex actions">
				<div class="flex-item">
				<ToggleButton class="transparent" v-model="manage"  onIcon="pi pi-lock-open" 
				            offIcon="pi pi-lock"  :onLabel="'Manage'" :offLabel="'.'"/>
				</div>
				<div class="flex-item text-right">
					<Button  v-tooltip.left="'Close'"  severity="help" text rounded aria-label="Filter" @click="hide" >
						<i class="pi pi-times " />
					</Button>
				</div>
			</div>
	    <div class="terminal_body py-2 px-4" v-if="broswer.show">
				<div class="text-center">
					<InputGroup class="search-bar" style="border-radius: 8px;" >
					<MeshSelector 
						v-if="broswer.show"
						:form="false" 
						:full="true" 
						@select="getPorts"
						innerClass="flex "/>
						<Select v-if="broswer.mesh" size="small" class="w-full flex small"  v-model="broswer.port" :options="broswer.ports" optionLabel="name" :filter="broswer.ports.length>8" placeholder="Proxy"/>
					</InputGroup>					
				</div>
				<div class="mt-3 text-center">
					<InputGroup class="search-bar" style="border-radius: 8px;" >
						
						<Textarea v-model="broswer.url" :autoResize="true" class="drak-input bg-gray-900 text-white flex-1" placeholder="http://" rows="1" cols="30" />
						<!-- <Button :disabled="!broswer.url" icon="pi pi-search"/> -->
					</InputGroup>
				</div>
				<div class="mt-3 text-center flex">
					<div class="flex-item pr-2">
						<Button severity="secondary" class="w-full" style="height: 30px;" @click="() => broswer.show = false" label="Back"/>
					</div>
					<div class="flex-item pl-2" style="flex: 2;">
						<Button class="w-full" style="height: 30px;" :disabled="!broswer.url" label="Open" @click="openBroswerContent"/>
				</div>
				</div>
				
				
			</div>
	    <div class="terminal_body py-2 px-4" v-else>
				
				
				<Carousel :showNavigators="false" :value="pages" :numVisible="1" :numScroll="1" >
						<template #item="slotProps">
							<div class="pt-1" style="min-height: 220px;">
								<div class="grid text-center" >
								
										<div @click="openBroswer" class="col-3 py-4 relative text-center">
											<img :src="broswerPng" class="pointer" width="40" height="40" style="border-radius: 4px; overflow: hidden;margin: auto;"/>
											<div class="mt-1">
												<b class="text-white opacity-90">Broswer</b>
											</div>
										</div>
										
										<div :class="{'opacity-80':appLoading[app.name]}" @click="openWebview(app)" class="col-3 py-4 relative text-center" v-for="(app) in appPage(slotProps.index)">
											<i @click.stop="removeApp(app)" v-show="manage" class="pi pi-times  bg-primary-500 absolute pointer text-white-alpha-60 " style="width:16px;height: 16px;line-height: 16px;;border-radius: 50%; right: 16px;top: 12px;"  />
											<img :src="app.icon" class="pointer" width="40" height="40" style="border-radius: 4px; overflow: hidden;margin: auto;"/>
											<ProgressSpinner v-if="appLoading[app.name]" class="absolute opacity-60" style="width: 30px; height: 30px;margin-left: -35px;margin-top: 5px;" strokeWidth="10" fill="#000"
											    animationDuration="2s" aria-label="Custom ProgressSpinner" />
											<div class="mt-1">
												<b class="text-white opacity-90">{{app.name}}</b>
											</div>
										</div>
										
										<div :class="{'opacity-80':appLoading[app.name],'opacity-60':!appLoading[app.name]}" @click="installAPP(app)" class="col-3 py-4 relative text-center " v-for="(app) in innerApps">
											<img :src="app.icon" class="pointer" width="40" height="40" style="border-radius: 4px; overflow: hidden;margin: auto;"/>
											<ProgressSpinner v-if="appLoading[app.name]" class="absolute opacity-60" style="width: 30px; height: 30px;margin-left: -35px;margin-top: 5px;" strokeWidth="10" fill="#000"
											    animationDuration="2s" aria-label="Custom ProgressSpinner" />
											<div class="mt-1">
												<b class="text-white opacity-90 white-space-nowrap"><i class="pi pi-cloud-download mr-1" />{{app.name}}</b>
											</div>
										</div>
								</div>
							</div>
						</template>
				</Carousel>
	    </div>
	</div>
	</ScrollPanel>
</template>

<style lang="scss" scoped>
	.container {
		position: fixed;
		top: 0;
		bottom: 0;
		left: 0;
		right: 0;
	}
	:deep(.p-scrollpanel-bar.p-scrollpanel-bar-y){
		opacity: 0.5;
	}
	.actions{
		left: 0px;
		padding: 10px;
		display: flex;
		right: 0px;
		:deep(.p-button){
			padding-left: 5px;
			padding-right: 5px;
		}
	}
	:deep(.p-radiobutton .p-radiobutton-box){
		background-color: #41403A;
	}
	:deep(.p-togglebutton){
		border: none;
		color: transparent;
	}
	:deep(.p-togglebutton .pi){
		color: #fff !important;
	}
	.terminal_toolbar {
	  display: flex;
	  height: 30px;
	  align-items: center;
	  padding: 0 8px;
	  box-sizing: border-box;
	  border-top-left-radius: 5px;
	  border-top-right-radius: 5px;
	  background: linear-gradient(#504b45 0%, #3c3b37 100%);
	}
	
	.butt {
	  display: flex;
	  align-items: center;
	}
	
	.btn {
	  display: flex;
	  justify-content: center;
	  align-items: center;
	  padding: 0;
	  margin-right: 5px;
	  font-size: 8px;
	  height: 12px;
	  width: 12px;
	  box-sizing: border-box;
	  border: none;
	  border-radius: 100%;
	  background: linear-gradient(#7d7871 0%, #595953 100%);
	  text-shadow: 0px 1px 0px rgba(255,255,255,0.2);
	  box-shadow: 0px 0px 1px 0px #41403A, 0px 1px 1px 0px #474642;
	}
	
	.btn-color {
	  background: #ee411a;
	}
	
	.btn:hover {
	  cursor: pointer;
	}
	
	.btn:focus {
	  outline: none;
	}
	
	.butt--exit {
	  background: linear-gradient(#f37458 0%, #de4c12 100%);
	}
	
	.user {
	  color: #d5d0ce;
	  margin-left: 6px;
	  font-size: 14px;
	  line-height: 15px;
	}
	.container_pannel{
		background: rgba(56, 4, 40, 0.9);
		min-height: 100%;
	}
	.terminal_body {
	  height: calc(100%);
	  padding-top: 2px;
	  margin-top: 0px;
	  font-size: 12px;
	  border-bottom-left-radius: 5px;
	  border-bottom-right-radius: 5px;
	}
	.terminal_content{
		color: rgba(255,255,255,0.8);
	}
	.terminal_promt {
	  display: flex;
	}
	
	.terminal_promt span {
	  margin-left: 4px;
	}
	
	.terminal_user {
	  color: #7eda28;
	}
	
	.terminal_location {
	  color: #4878c0;
	}
	:deep(.p-inputgroup.search-bar .p-multiselect-label){
		line-height: 30px;
	}
	.terminal_bling {
	  color: #dddddd;
	}
	
	.terminal_cursor {
	  display: block;
	  height: 14px;
	  width: 5px;
	  margin-left: 10px;
	  animation: curbl 1200ms linear infinite;
	}
	
	@keyframes curbl {
	  
	  0% {
	    background: #ffffff;
	  }
	
	  49% {
	    background: #ffffff;
	  }
	
	  60% {
	    background: transparent;
	  }
	
	  99% {
	    background: transparent;
	  }
	
	  100% {
	    background: #ffffff;
	  }
	} 
	:deep(.p-button){
		width: 2rem;
		height: 2rem;
	}
</style>
