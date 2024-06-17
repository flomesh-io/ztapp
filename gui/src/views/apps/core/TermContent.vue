<template>
	<Terminal
		style="height: 320px;"
		welcomeMessage="Welcome to ztm cli"
		prompt="ztm $"
		aria-label="ztm cli"
	/>
</template>

<script setup>
	
import { onMounted, onBeforeUnmount } from 'vue';
import TerminalService from "primevue/terminalservice";
import terminal from "@/assets/img/terminal.png";

onMounted(() => {
    TerminalService.on('command', commandHandler);
})

onBeforeUnmount(() => {
    TerminalService.off('command', commandHandler);
})

const commandHandler = (text) => {
    let response;
    let argsIndex = text.indexOf(' ');
    let command = argsIndex !== -1 ? text.substring(0, argsIndex) : text;

    switch(command) {
        case "date":
            response = 'Today is ' + new Date().toDateString();
            break;

        case "greet":
            response = 'Hola ' + text.substring(argsIndex + 1);
            break;

        case "random":
            response = Math.floor(Math.random() * 100);
            break;

        default:
            response = "Unknown command: " + command;
    }
    
    TerminalService.emit('response', response);
}
</script>
