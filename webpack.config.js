module.exports = {
  entry: [
    './js/BowAndDrape.jsx'
  ],
  output: {
    path: __dirname + '/public/dist',
    filename: "BowAndDrape.js"
  },
  module: {
    loaders: [
      {
        loader: "babel-loader",
        query: {
          presets: ['react','es2015']
        }
      }
    ]
  }
};
