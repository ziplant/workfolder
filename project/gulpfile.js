const { src, dest, parallel, series } = require("gulp"),
  sass = require("gulp-sass"),
  prefix = require("autoprefixer"),
  postcss = require("gulp-postcss"),
  watch = require("gulp-watch"),
  debug = require("gulp-debug"),
  csso = require("gulp-csso"),
  rename = require("gulp-rename"),
  pug = require("gulp-pug"),
  sync = require("browser-sync").create(),
  clean = require("gulp-clean"),
  babel = require("gulp-babel"),
  sourcemaps = require("gulp-sourcemaps"),
  webpack = require("webpack-stream"),
  named = require("vinyl-named"),
  replace = require("gulp-replace");

const dev = process.env.NODE_ENV == "development" ? true : false;
const distDir = process.env.NODE_ENV == "development" ? "dist" : "build";

function catchError(module) {
  return module.on("error", (e) => {
    console.log(e);
    module.end();
  });
}

function cleanDist() {
  return src([`${distDir}/**/*.*`, `${distDir}/**/*`], { read: false }).pipe(
    clean()
  );
}

function toCSS() {
  let source = src(["dev/static/sass/**/*", "!dev/static/sass/modules/**"]);

  if (dev) {
    source
      .pipe(sourcemaps.init())
      .pipe(debug({ title: "sass:" }))
      .pipe(catchError(sass()))
      .pipe(postcss([prefix()]))
      .pipe(sourcemaps.write())
      .pipe(dest(`${distDir}/static/css`));
  } else {
    source
      .pipe(debug({ title: "sass:" }))
      .pipe(catchError(sass()))
      .pipe(postcss([prefix()]))
      .pipe(csso())
      .pipe(dest(`${distDir}/static/css`));
  }
  return source;
}

function toComponentCSS() {
  let source = src(["dev/components/**/*.sass", "dev/components/**/*.scss"]);

  if (dev) {
    source
      .pipe(sourcemaps.init())
      .pipe(debug({ title: "component styles:" }))
      .pipe(catchError(sass()))
      .pipe(postcss([prefix()]))
      .pipe(sourcemaps.write())
      .pipe(dest("dev/components"));
  } else {
    source
      .pipe(debug({ title: "component styles:" }))
      .pipe(catchError(sass()))
      .pipe(postcss([prefix()]))
      .pipe(csso())
      .pipe(dest("dev/components"));
  }

  return source;
}

function toHTML() {
  let source = src(["dev/pages/**/*.pug"]);

  if (dev) {
    source
      .pipe(sourcemaps.init())
      .pipe(debug({ title: "pug:" }))
      .pipe(catchError(pug({ pretty: true })))
      .pipe(sourcemaps.write())
      .pipe(dest(`${distDir}`));
  } else {
    source
      .pipe(debug({ title: "pug:" }))
      .pipe(catchError(pug({ pretty: false })))
      .pipe(dest(`${distDir}`));
  }

  return source;
}

function babelJS() {
  let source = src(["dev/static/js/**/*.js", "!dev/static/js/modules/**"]);

  if (dev) {
    source
      .pipe(sourcemaps.init())
      .pipe(debug({ title: "js:" }))
      .pipe(catchError(babel({ presets: ["@babel/env"] })))
      .pipe(
        named((file) => {
          return file.path.replace(file.base, "").replace(".js", "");
        })
      )
      .pipe(
        catchError(
          webpack({
            mode: process.env.NODE_ENV,
          })
        )
      )
      .pipe(sourcemaps.write())
      .pipe(dest(`${distDir}/static/js`));
  } else {
    source
      .pipe(debug({ title: "js:" }))
      .pipe(catchError(babel({ presets: ["@babel/env"] })))
      .pipe(
        named((file) => {
          return file.path.replace(file.base, "").replace(".js", "");
        })
      )
      .pipe(
        catchError(
          webpack({
            mode: process.env.NODE_ENV,
          })
        )
      )
      .pipe(dest(`${distDir}/static/js`));
  }

  return source;
}

function copyStatic() {
  return src(["dev/static/**/*", "!dev/static/sass/**", "!dev/static/js/**"], {
    allowEmpty: true,
  }).pipe(dest(`${distDir}/static`));
}

function copyAssets() {
  return src(["dev/components/**/images/**/*"], { allowEmpty: true })
    .pipe(
      rename(function (path) {
        path.dirname = path.dirname
          .replace("/images", "")
          .replace("\\images", "");
      })
    )
    .pipe(dest(`${distDir}/static/img`));
}

function watchFiles() {
  watch(["dev/static/**/*.sass", "dev/static/**/*.scss"], toCSS);
  watch(
    ["dev/components/**/*.sass", "dev/components/**/*.scss"],
    toComponentCSS
  );
  watch("dev/**/*.pug", toHTML);
  watch("dev/**/*.js", babelJS);
  watch(
    ["dev/static/**/*", "!dev/static/sass/**", "!dev/static/js/**"],
    copyStatic
  );
  watch("dev/components/**/images/**/*", copyAssets);
}

function browserSync() {
  sync.init({
    server: {
      baseDir: "./dist",
    },
  });
  sync.watch(["dist/**/*.*"]).on("change", sync.reload);
  sync.watch(["dev/components/**/*.css"]).on("change", function () {
    toHTML();
    toCSS();
    sync.reload;
  });
}

function addComponent(cb) {
  const args = process.argv.slice(3);
  if (!args[0] == "-n" || !args[1]) {
    throw "Error: missing arguments: gulp addcomp -n mycompname";
  }

  src("dev/components/_template/**")
    .pipe(
      rename(function (path) {
        path.basename = path.basename.replace("_template", args[1]);
      })
    )
    .pipe(replace("_template", args[1]))
    .pipe(dest(`dev/components/${args[1]}`));

  cb();

  console.log(`Component '${args[1]}' added`);
}

let compile = [
  cleanDist,
  copyStatic,
  copyAssets,
  toComponentCSS,
  toCSS,
  toHTML,
  babelJS,
];

exports.start = series(...compile, parallel(watchFiles, browserSync));

exports.build = series(...compile);

exports.addcomp = addComponent;
