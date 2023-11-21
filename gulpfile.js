// Папка з вихідним кодом
let project_folder = "_dist";

// Папка з робочим кодом
let source_folder = "_src";

// Папка для GitHub Pages
let github_folder = "docs";

// Файл який читає browser-sync за замовчуванням
let file_sync = "index.html";

// Змінна із списком шляхів файлів
let path = {

	// Список зкомпільованих папок/файлів
	build: {
		html: project_folder + "/",
		css: project_folder + "/css/",
		js: project_folder + "/js/",
		fonts: project_folder + "/fonts/",
		images: project_folder + "/img/",
		// icons: project_folder + "/ico/",
		libs: project_folder + "/libs/",
		docs: project_folder + "/docs/",
	},
	// Список робочих папок/файлів
	src: {
		html: [source_folder + "/*.html", "!" + source_folder + "/_*.html"],
		css: source_folder + "/scss/style.scss",
		js: source_folder + "/js/scripts.js",
		fonts: source_folder + "/fonts/*",
		images: source_folder + "/img/**/**",
		// icons: source_folder + "/ico/*",
		libs: source_folder + "/libs/**/**",
		docs: source_folder + "/docs/*",
	},
	// Список робочих папок/файлів
	docs: {
		html: github_folder + "/",
		css: github_folder + "/css/",
		js: github_folder + "/js/",
		fonts: github_folder + "/fonts/",
		images: github_folder + "/img/",
		// icons: github_folder + "/ico/",
		libs: github_folder + "/libs/",
		docs: github_folder + "/docs/",
	},
	// Список папок/файлів, за якими GULP постійно слідкує
	watch: {
		html: source_folder + "/*.html",
		css: source_folder + "/scss/**/*.scss",
		js: source_folder + "/js/**/*.js",
		images: source_folder + "/img/**/**",
		// icons: source_folder + "/ico/*",
	},
	// Коренева папка вихідних папок/файлів, яку GULP очищає при запуску
	clean: {
		dist: "./" + project_folder + "/",
		docs: "./" + github_folder + "/",
	}
}

// Список плагінів
let {src, dest} = require('gulp'),
	gulp = require('gulp'),
	fileInclude = require('gulp-file-include'),
	scss = require('gulp-sass')(require('sass')),
	autoprefixer = require('gulp-autoprefixer'),
	group_media = require('gulp-group-css-media-queries'),
	clean_css = require('gulp-clean-css'),
	browser_sync = require('browser-sync').create(),
	del = require('del'),
	rename = require('gulp-rename'),
	uglify = require('gulp-uglify-es').default;



function browserSync() {
	browser_sync.init({
		server: {
			baseDir: "./" + project_folder + "/",
			index: file_sync
		},
		port: 3000,
		notify: false
	})
}

function html() {
	return src(path.src.html)
	.pipe(fileInclude())
	.pipe(dest(path.build.html))
	.pipe(dest(path.docs.html))
	.pipe(browser_sync.stream())
}

function css() {
	return src(path.src.css)
	.pipe(scss({
		oninputStyle: 'expanded'
	}).on('error', scss.logError))
	.pipe(group_media())
	.pipe(autoprefixer({
		overrideBrowserslist: ['last 10 versions'], grid: true,
		cascade: true
	}))
	.pipe(dest(path.build.css))
	// .pipe(dest(path.docs.css))
	.pipe(clean_css({level: { 2: { specialComments: 0 } } }))
	.pipe(rename({
		extname: '.min.css'
	}))
	.pipe(dest(path.build.css))
	.pipe(dest(path.docs.css))
	.pipe(browser_sync.stream())
}

function js() {
	return src(path.src.js)
	.pipe(fileInclude())
	.pipe(dest(path.build.js))
	// .pipe(dest(path.docs.js))
	.pipe(uglify({
		toplevel: true
	}))
	.pipe(rename({
		extname: '.min.js'
	}))
	.pipe(dest(path.build.js))
	.pipe(dest(path.docs.js))
	.pipe(browser_sync.stream())
}

function fonts() {
	return src(path.src.fonts)
	.pipe(dest(path.build.fonts))
	.pipe(dest(path.docs.fonts))
}

function images() {
	return src(path.src.images)
	.pipe(dest(path.build.images))
	.pipe(dest(path.docs.images))
	.pipe(browser_sync.stream())
}

// function icons() {
// 	return src(path.src.icons)
// 	.pipe(dest(path.build.icons))
// 	.pipe(dest(path.docs.icons))
// 	.pipe(browser_sync.stream())
// }

function libs() {
	return src(path.src.libs)
	.pipe(dest(path.build.libs))
	.pipe(dest(path.docs.libs))
}

function watchFiles() {
	gulp.watch([path.watch.html], html);
	gulp.watch([path.watch.css], css);
	gulp.watch([path.watch.js], js);
	gulp.watch([path.watch.images], images);
	// gulp.watch([path.watch.icons], icons);
}

function clean () {
	return del(path.clean.dist), del(path.clean.docs);
}

let build = gulp.series(clean, gulp.parallel(js, css, html), images, /*icons,*/ fonts, libs, browserSync);
let watch = gulp.parallel(build, watchFiles);




// exports.icons = icons;
exports.images = images;
exports.js = js;
exports.css = css;
exports.html = html;
exports.build = build;
exports.watch = watch;
exports.default = watch;