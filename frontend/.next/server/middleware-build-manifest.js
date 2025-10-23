self.__BUILD_MANIFEST = {
  "polyfillFiles": [
    "static/chunks/polyfills.js"
  ],
  "devFiles": [
    "static/chunks/react-refresh.js"
  ],
  "ampDevFiles": [],
  "lowPriorityFiles": [],
  "rootMainFiles": [
    "static/chunks/webpack.js",
    "static/chunks/framework.js",
    "static/chunks/main-app.js"
  ],
  "pages": {
    "/_app": [
      "static/chunks/webpack.js",
      "static/chunks/framework.js",
      "static/chunks/vendors-node_modules_scheduler_index_js-node_modules_swc_helpers_esm__interop_require_default-ca5b61.js",
      "static/chunks/main.js",
      "static/chunks/pages/_app.js"
    ],
    "/_error": [
      "static/chunks/webpack.js",
      "static/chunks/framework.js",
      "static/chunks/vendors-node_modules_scheduler_index_js-node_modules_swc_helpers_esm__interop_require_default-ca5b61.js",
      "static/chunks/main.js",
      "static/chunks/pages/_error.js"
    ]
  },
  "ampFirstPages": []
};
self.__BUILD_MANIFEST.lowPriorityFiles = [
"/static/" + process.env.__NEXT_BUILD_ID + "/_buildManifest.js",
,"/static/" + process.env.__NEXT_BUILD_ID + "/_ssgManifest.js",

];