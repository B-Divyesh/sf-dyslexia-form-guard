import { defineConfig } from 'wxt';

export default defineConfig({
  outDir: 'dist/extension',
  publicDir: 'extension-public',
  manifest: {
    name: 'Form Guard',
    short_name: 'Form Guard',
    description: 'Review visible form fields locally before you submit.',
    version: '1.0.1',
    permissions: ['activeTab', 'storage'],
    host_permissions: ['<all_urls>'],
    action: {
      default_title: 'Review this form'
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+G',
          mac: 'MacCtrl+Shift+G'
        },
        description: 'Open Form Guard'
      }
    },
    icons: {
      16: 'icon/16.png',
      32: 'icon/32.png',
      48: 'icon/48.png',
      128: 'icon/128.png'
    }
  }
});
