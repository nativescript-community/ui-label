import { NativeScriptConfig } from '@nativescript/core';

export default {
    id: 'org.nativescript.demovuehtmllabel',
    appResourcesPath: 'App_Resources',
    android: {
        v8Flags: '--expose_gc',
        markingMode: 'none'
    },
    // profiling:'timeline',
    appPath: 'app'
} as NativeScriptConfig;
