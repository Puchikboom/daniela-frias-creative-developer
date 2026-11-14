import {defineConfig,loadEnv} from 'vite';
import react from '@vitejs/plugin-react';
export default defineConfig(({mode})=>{const env=loadEnv(mode,process.cwd(),'VITE_');return {base:env.VITE_DEMO_MODE==='true'?'./':'/',plugins:[react()],server:{proxy:{'/api':'http://127.0.0.1:8000'}}};});
