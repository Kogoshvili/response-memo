const path = require('path');

module.exports = {
    mode: 'development',
    devtool: 'source-map',
    entry: {
        background: path.resolve(__dirname, './src/background.js'),
        popup: path.resolve(__dirname, './src/popup.js')
    },
    output: {
        filename: '[name].js',
        path: path.resolve(__dirname, 'dist')
    },
    module: {
        rules: [
            {
                test: /\.jsx?$/,
                loader: require.resolve('babel-loader'),
                exclude: [path.resolve(__dirname, './node_modules')]
            }
        ]
    },
    resolve: {
        extensions: ['.jsx', '.js']
    }
};
