module.exports = {
  presets: [
    [
      '@babel/preset-env',
      {
        modules: false
      }
    ]
  ],
  env: {
    test: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: { node: 'current' }
          }
        ],
        '@babel/preset-typescript'
      ]
    },
    esm: {
      presets: [
        [
          '@babel/preset-env',
          {
            targets: 'last 1 chrome version',
            modules: false
          }
        ]
      ]
    }
  }
};
