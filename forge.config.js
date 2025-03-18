const path = require('path');

module.exports = {
  packagerConfig: {
    asar: true,
  },
  rebuildConfig: {},
  makers: [
    {
      name: '@electron-forge/maker-squirrel',
      config: {},
    },
    {
      name: '@electron-forge/maker-zip',
      platforms: ['darwin'],
    },
    {
      name: '@electron-forge/maker-deb',
      config: {},
    },
    {
      name: '@electron-forge/maker-rpm',
      config: {},
    },
  ],
  plugins: [
    {
      name: '@electron-forge/plugin-webpack',
      config: {
        mainConfig: {
          entry: './src/main/main.ts',
          module: {
            rules: [
              {
                test: /\.tsx?$/,
                use: 'ts-loader',
                exclude: /node_modules/,
              },
            ],
          },
          resolve: {
            extensions: ['.js', '.ts', '.jsx', '.tsx', '.css', '.json'],
          },
        },
        renderer: {
          config: {
            module: {
              rules: [
                {
                  test: /\.tsx?$/,
                  use: 'ts-loader',
                  exclude: /node_modules/,
                },
                {
                  test: /\.css$/,
                  use: ['style-loader', 'css-loader'],
                },
              ],
            },
            resolve: {
              extensions: ['.js', '.ts', '.jsx', '.tsx', '.css'],
            },
          },
          entryPoints: [
            {
              html: './src/renderer/index.html',
              js: './src/renderer/index.tsx',
              name: 'main_window',
              preload: {
                js: './src/preload.ts',
              },
            },
          ],
        },
      },
    },
  ],
}; 