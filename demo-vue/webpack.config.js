const webpack = require('@nativescript/webpack');
const { dirname, join, relative, resolve } = require('path');
module.exports = (env) => {
    webpack.init(env);
    const config = webpack.resolveConfig();
    if (env.fork) {
        const coreModulesPackageName = '@akylas/nativescript';
        config.resolve.modules = [
            resolve(__dirname, `node_modules/${coreModulesPackageName}`),
            resolve(__dirname, 'node_modules'),
            `node_modules/${coreModulesPackageName}`,
            'node_modules'
        ];
        Object.assign(config.resolve.alias, {
            '@nativescript/core': `${coreModulesPackageName}`,
            'tns-core-modules': `${coreModulesPackageName}`
        });
    }
    return config;
};
