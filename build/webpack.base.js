'use strict';

// const projectRoot = process.cwd()
const path = require('path');
const glob = require('glob');
const webpack = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin')
const OptimizeCssAssetsWebpackPlugin = require('optimize-css-assets-webpack-plugin')
const HtmlWebpackPlugin = require('html-webpack-plugin')
const { CleanWebpackPlugin } = require('clean-webpack-plugin')
const tplHTML = path.join(__dirname, '../public/index.html')
const HtmlWebpackExternalsPlugin = require('html-webpack-externals-plugin')
const FriendlyErrorsWebpackPlugin = require('friendly-errors-webpack-plugin')

const HappyPack = require('happypack')

const RENDER_MODE = process.env.RENDER_MODE
const RENDER_ENTRY = RENDER_MODE === 'server' ? 'index-server' : 'index'

console.log(`NODE_ENV: ---> ${process.env.NODE_ENV}`)
console.log(`RENDER_MODE: ---> ${process.env.RENDER_MODE}`)
// console.log('tplHTML: --->       ', tplHTML)

function setEntry() {
    const entriesServer = glob.sync(path.join(__dirname, `../src/pages/*/${RENDER_ENTRY}.js`))

    let entry = {}
    let htmlWebpackPlugins = []
    entriesServer.forEach(item=> {
        const reg = new RegExp(`src\\/pages\\/(.*)\\/${RENDER_ENTRY}\\.js`)
        // const match = item.match(/src\/pages\/(.*)\/index-server\.js/)
        const match = item.match(reg)
        // console.log('match: --->           ', match)
        const entryName = match && match[1]


        if(entryName) {
            entry[entryName] = item
            // console.log('entryName: --->           ', entryName)

            // 是否有私有模板，没有则使用公用模板 一般来讲，共用一个模板
            const selfHTML = glob.sync(path.join(__dirname, `../src/pages/${entryName}/${entryName}.html`))
            const template = selfHTML.length===1 ? selfHTML[0] : tplHTML
            // console.log('selfHTML: --->       ', selfHTML)
            // console.log('template: --->       ', template)

            // 一个页面对应一个
            htmlWebpackPlugins.push(
                new HtmlWebpackPlugin({
                    title: entryName,
                    template,
                    filename: `${entryName}.html`,
                    // chunks主要用于多入口文件
                    chunks: ['react-vendors','commons', entryName],
                    /**
                     *  注入选项。有四个选项值 true, body, head, false.
                     *  true：默认值，script标签位于html文件的 body 底部
                     *  body：script标签位于html文件的 body 底部（同 true）
                     *  head：script 标签位于 head 标签内
                     *  false：不插入生成的 js 文件，只是单纯的生成一个 html 文件
                     */
                    inject: true,
                    minify: {
                        html5: true,
                        // preserveLineBreaks: false, // 未找到对应参数
                        // 是否对大小写敏感，默认false
                        caseSensitive: true,

                        // 是否简写boolean格式的属性如：disabled="disabled" 简写为disabled  默认false
                        collapseBooleanAttributes: true,

                        // 是否去除空格，默认false
                        collapseWhitespace: true,

                        // 是否压缩html里的css（使用clean-css进行的压缩） 默认值false；
                        minifyCSS: true,

                        // 是否压缩html里的js（使用uglify-js进行的压缩）
                        minifyJS: true,

                        // // Prevents the escaping of the values of attributes  防止转义属性值
                        // preventAttributesEscaping: true,

                        // 是否移除属性的引号 默认false
                        removeAttributeQuotes: false,

                        // 是否移除注释 默认false
                        removeComments: false,

                        // 从脚本和样式删除的注释 默认false
                        removeCommentsFromCDATA: true,

                        // 是否删除空属性，默认false
                        removeEmptyAttributes: true,

                        // 若开启此项，生成的html中没有 body 和 head，html也未闭合
                        removeOptionalTags: false,

                        // 删除多余的属性
                        removeRedundantAttributes: true,

                        // 删除script的类型属性，在h5下面script的type默认值：text/javascript 默认值false
                        removeScriptTypeAttributes: false,

                        // 删除style的类型属性， type="text/css" 同上
                        removeStyleLinkTypeAttributes: false,

                        // 使用短的文档类型，默认false
                        useShortDoctype: true,
                    }

                })
            )
        }
    })
    // console.log(entry, 'entry')
    return {
        entry,
        htmlWebpackPlugins
    }
}

const { entry, htmlWebpackPlugins } = setEntry()
console.log('setEntry: --->       ', entry)

module.exports = {
    resolve: {
        alias: {
            'react': path.resolve(__dirname, '../node_modules/react'),
            'react-dom': path.resolve(__dirname, '../node_modules/react-dom'),
        },
        modules: [ path.resolve(__dirname, '../node_modules')],
        extensions: ['.js'],
        mainFields: ['index']
    },
    // watch: false,
    // watchOptions: {
    //     // 默认为空 支持正则，不监听
    //     ignored: /node_modules/,
    //     // aggregateTimeout ms 后执行  默认300ms
    //     aggregateTimeout: 300,
    //     // 轮询是否发生变化 默认每秒1000次 也就是1ms/次
    //     poll: 1000,
    // },
    entry,
    /**
     * 文件指纹 [name][(hash|chunkhash|contenthash)].[ext]
     * name entry name
     * hash 一个文件修改，则整个项目构建的hash值也将更改
     * chunkhash 和webpack打包的chunk有关，根据entry生成不同chunkhash
     * contenthash 根据文件内容生成hash，内容不变，则contenthash不变
     * ext 文件后缀
     */
    output: {
        path: path.join(__dirname, '../dist'),
        filename: RENDER_MODE === 'server' ? '[name]-server.js' : '[name].js',
        libraryTarget: "umd"
    },
    mode: 'none', // production 默认开启 tree-shaking
    module: {
        rules: [
            {
                test: /.js$/,
                use: [
                    {
                        loader: 'thread-loader' ,
                        options: {
                            workers: 3
                        }
                    },
                    'babel-loader?cacheDirectory=true',
                    // 'happyPack/loader',
                    'eslint-loader',
                ],
                exclude: /node_modules/
            },
            {
                test: /.css$/,
                use: [
                    // 'style-loader', // 放入 head
                    MiniCssExtractPlugin.loader, // 打包为css文件，与style loader互斥
                    'css-loader'
                ],
            },
            {
                test: /.less$/,
                use: [
                    // 'style-loader', // 放入 head
                    MiniCssExtractPlugin.loader, // 打包为css文件，与style loader互斥
                    'css-loader',
                    {
                        loader: 'postcss-loader',
                        options: {
                            plugins: ()=> [
                                require('autoprefixer')({
                                    // Replace Autoprefixer browsers option to Browserslist config.
                                    // Use browserslist key in package.json or .browserslistrc file.
                                    // browsers: ['last 2 version', '>1%', 'ios 7']
                                })
                            ]
                        }
                    },
                    {
                        loader: 'px2rem-loader',
                        options: {
                            remUnit: 75, // 750
                            remPrecision: 8, // 小数点后为主
                        }
                    },
                    'less-loader',
                ],
            },
            // 以下使用 url-loader替换file-loader
            // 原因： url-loader基于file-loader 多了小字体自动转base64 limit来实现
            {
                test: /.(png|jpe?g|gif|svg)(\?.*)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name]_[hash:8].[ext]'
                    }
                },
            },
            {
                test: /.(woff2?|eot|ttf|otf)(\?.*)?$/,
                use: {
                    loader: 'file-loader',
                    options: {
                        name: '[name]_[hash:8].[ext]'
                    }
                },
            },
        ]
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: '[name]_[contenthash:8].css'
        }),
        // // 压缩
        // new OptimizeCssAssetsWebpackPlugin({
        //     assetNameRegExp: /\.css$/g,
        //     cssProcessor: require('cssnano') // 预处理器
        // }),
        // new CleanWebpackPlugin(),
        // // 基础库分离 cdn
        // // new HtmlWebpackExternalsPlugin({
        // //     externals: [
        // //         {
        // //             module: 'react',
        // //             entry: 'https://11.url.cn/now/lib/16.2.0/react.min.js',
        // //             global: 'React',
        // //         },
        // //         {
        // //             module: 'react-dom',
        // //             entry: 'https://11.url.cn/now/lib/16.2.0/react-dom.min.js',
        // //             global: 'ReactDom',
        // //         },
        // //     ],
        // // }),
        // // scope Hoisting webpack 4 production 下默认开启
        // // new webpack.optimize.ModuleConcatenationPlugin(),
        new FriendlyErrorsWebpackPlugin(),
        // new HappyPack({
        //     loaders: [ 'babel-loader?cacheDirectory=true' ]
        // }),
    ].concat(htmlWebpackPlugins),
    // webpack4 已内置
    // optimization: {
    //     splitChunks: {
    //         minSize: 0, // 引用包大小
    //         cacheGroups: {
    //             commons: {
    //                 // test: /(react|react-dom)/,
    //                 // name: 'react-vendors',
    //                 name: 'commons',
    //                 chunks: "all",
    //                 minChunks: 2,
    //             }
    //         }
    //     }
    // },
    // devtool: "cheap-source-map",
    // stats: 'minimal',
    stats: {
        // 添加资源信息
        assets: false,
        // 添加缓存（但未构建）模块的信息
        cached: false,
        // 显示缓存的资源（将其设置为 `false` 则仅显示输出的文件）
        cachedAssets: false,
        // 添加构建模块信息
        modules: false,
        colors: true,
        children: false,
    }
}
