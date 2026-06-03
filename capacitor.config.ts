import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'br.com.emporiodaspizzas.operacional',
  appName: 'Empório das Pizzas',
  webDir: 'dist',
  android: {
    // Permite Web Bluetooth dentro do WebView
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: false,
  },
  server: {
    // Em desenvolvimento, aponta para o Vite local
    // Em produção, remove esta seção e usa o build estático
    // url: 'http://192.168.x.x:5173',
    cleartext: true,
  },
};

export default config;
