'use strict';
const dirs = {
    source: 'dev',  // папка с исходниками (путь от корня проекта)
    build: 'build', // папка с результатом работы (путь от корня проекта)
};

// Определим необходимые инструменты
const gulp = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const rename = require('gulp-rename');
const sourcemaps = require('gulp-sourcemaps');
const postcss = require('gulp-postcss');
const mqpacker = require('css-mqpacker');
const replace = require('gulp-replace');
const del = require('del');
const browserSync = require('browser-sync').create();
const ghPages = require('gulp-gh-pages');
const newer = require('gulp-newer');
const uglify = require('gulp-uglify');
const concat = require('gulp-concat');
const cheerio = require('gulp-cheerio');
const svgstore = require('gulp-svgstore');
const svgmin = require('gulp-svgmin');
const notify = require('gulp-notify');
const plumber = require('gulp-plumber');
const cleanCSS = require('gulp-cleancss');
const include = require('gulp-file-include'); //include
const htmlbeautify = require('gulp-html-beautify');
const spritesmith = require('gulp.spritesmith');
const merge = require('merge-stream');
const buffer = require('vinyl-buffer');

// ЗАДАЧА: Компиляция препроцессора
gulp.task('sass', function(){
    return gulp.src(dirs.source + '/style.scss') // какой файл компилировать (путь из константы)
    .pipe(include())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(sourcemaps.init()) // инициируем карту кода
    .pipe(sass()) // компилируем
    .pipe(sourcemaps.write('/')) // записываем карту кода как отдельный файл (путь из константы)
    .pipe(gulp.dest(dirs.build + '/')) // записываем CSS-файл (путь из константы)
    .pipe(browserSync.stream())
    .pipe(rename('style.min.css')) // переименовываем
    .pipe(cleanCSS()) // сжимаем
    .pipe(gulp.dest(dirs.build + '/')); // записываем CSS-файл (путь из константы)
});

// ЗАДАЧА: Сборка HTML
gulp.task('html', function() {
    return gulp.src(dirs.source + '/*.html') // какие файлы обрабатывать (путь из константы, маска имени)
    .pipe(include())
    .pipe(htmlbeautify())
    .pipe(plumber({ errorHandler: onError }))
    .pipe(replace(/\n\s*<!--DEV[\s\S]+?-->/gm, '')) // убираем комментарии <!--DEV ... -->
    .pipe(gulp.dest(dirs.build)); // записываем файлы (путь из константы)
});


// ЗАДАЧА: Копирование изображений
gulp.task('img', function () {
    return gulp.src([
        dirs.source + '/assets/img/*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
    ],
        {since: gulp.lastRun('img')} // оставим в потоке обработки только изменившиеся от последнего запуска задачи (в этой сессии) файлы
    )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(dirs.build + '/assets/img')) // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe(gulp.dest(dirs.build + '/assets/img')); // записываем файлы (путь из константы)
});

// ЗАДАЧА: Копирование изображений
gulp.task('images', function () {
    return gulp.src([
        dirs.source + '/assets/images/*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
    ],
        {since: gulp.lastRun('img')} // оставим в потоке обработки только изменившиеся от последнего запуска задачи (в этой сессии) файлы
    )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(dirs.build + '/assets/images')) // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe(gulp.dest(dirs.build + '/assets/images')); // записываем файлы (путь из константы)
});

// ЗАДАЧА: Копирование изображений
gulp.task('imguploads', function () {
    return gulp.src([
        dirs.source + '/uploads/*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
        dirs.source + '/uploads/**/*.{gif,png,jpg,jpeg,svg}', // какие файлы обрабатывать (путь из константы, маска имени, много расширений)
    ],
        {since: gulp.lastRun('img')} // оставим в потоке обработки только изменившиеся от последнего запуска задачи (в этой сессии) файлы
    )
    .pipe(plumber({ errorHandler: onError }))
    .pipe(newer(dirs.build + '/uploads')) // оставить в потоке только новые файлы (сравниваем с содержимым папки билда)
    .pipe(gulp.dest(dirs.build + '/uploads')); // записываем файлы (путь из константы)
});

// ЗАДАЧА: Сборка SVG-спрайта
gulp.task('svgstore', function (callback) {
    var spritePath = dirs.source + '/assets/img/svg-sprite'; // переменнач с путем к исходникам SVG-спрайта
        if(fileExist(spritePath) !== false) {
        return gulp.src(spritePath + '/*.svg') // берем только SVG файлы из этой папки, подпапки игнорируем
        // .pipe(plumber({ errorHandler: onError }))
        .pipe(svgmin(function (file) {
            return {
                plugins: [{
                    cleanupIDs: {
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(rename('sprite-svg.svg'))
        .pipe(gulp.dest(dirs.source + '/assets/img'));
    }
    else {
        console.log('Нет файлов для сборки SVG-спрайта');
        callback();
    }
});

// ЗАДАЧА: Сборка SVG-спрайта
gulp.task('svgstore', function (callback) {
    var spritePath = dirs.source + '/assets/images/svg-sprite'; // переменнач с путем к исходникам SVG-спрайта
        if(fileExist(spritePath) !== false) {
        return gulp.src(spritePath + '/*.svg') // берем только SVG файлы из этой папки, подпапки игнорируем
        // .pipe(plumber({ errorHandler: onError }))
        .pipe(svgmin(function (file) {
            return {
                plugins: [{
                    cleanupIDs: {
                        minify: true
                    }
                }]
            }
        }))
        .pipe(svgstore({ inlineSvg: true }))
        .pipe(cheerio({
            run: function ($) {
                $('[fill]').removeAttr('fill');
            },
            parserOptions: {xmlMode: true}
        }))
        .pipe(rename('sprite-svg.svg'))
        .pipe(gulp.dest(dirs.source + '/assets/images'));
    }
    else {
        console.log('Нет файлов для сборки SVG-спрайта');
        callback();
    }
});

// ЗАДАЧА: Очистка папки сборки
gulp.task('clean', function () {
    return del([ // стираем
        dirs.build + '/**/*', // все файлы из папки сборки (путь из константы)
        '!' + dirs.build + '/readme.md' // кроме readme.md (путь из константы)
    ]);
});

// ЗАДАЧА: Перемещение шрифтов
gulp.task('copyFonts', function() {
    return gulp.src(dirs.source + '/assets/fonts/**/*.{woff,woff2,ttf,otf,eot,svg}')
    .pipe(gulp.dest('build' + '/assets/fonts'));
});

// ЗАДАЧА: Перемещение стилей
gulp.task('copyCSS', function() {
    return gulp.src(dirs.source + '/assets/css/**/*.css')
    .pipe(gulp.dest('build' + '/assets/css'));
});

// ЗАДАЧА: Перемещение скриптов
gulp.task('copyJS', function() {
    return gulp.src(dirs.source + '/assets/js/**/*.js')
    .pipe(gulp.dest('build' + '/assets/js'));
});

// ЗАДАЧА: Сборка PHP
gulp.task('php', function() {
    return gulp.src(dirs.source + '/**/**/**/*.php') // какие файлы обрабатывать (путь из константы, маска имени)
    .pipe(plumber({ errorHandler: onError }))
    .pipe(replace(/\n\s*<!--DEV[\s\S]+?-->/gm, '')) // убираем комментарии <!--DEV ... -->
    .pipe(gulp.dest(dirs.build)); // записываем файлы (путь из константы)
});

// ЗАДАЧА: сборка сss-библиотек
gulp.task('copy-css', function() {
    return gulp.src(dirs.source + '/css/blueimp-gallery.min.css')
    .pipe(gulp.dest('build' + '/assets/css'));
});

// ЗАДАЧА: Сборка всего
gulp.task('build', gulp.series( // последовательно:
    'clean', // последовательно: очистку папки сборки
    'svgstore',
    gulp.parallel('sass', 'img', 'images', 'imguploads', 'copyFonts', 'copyCSS', 'copyJS'),
    'html',
    'php'
    // последовательно: сборку разметки
));

// ЗАДАЧА: Локальный сервер, слежение
gulp.task('serve', gulp.series('build', function() {
    browserSync.init({ // запускаем локальный сервер (показ, автообновление, синхронизацию)
        //server: dirs.build, // папка, которая будет «корнем» сервера (путь из константы)
        server: {
            baseDir: './build/'
        },
        port: 3000, // порт, на котором будет работать сервер
        startPath: 'index.html', // файл, который буде открываться в браузере при старте сервера
        // open: false // возможно, каждый раз стартовать сервер не нужно...
    });
    gulp.watch( // следим за HTML
        [
            dirs.source + '/**/*.html', // в папке с исходниками
        ],
        gulp.series('html', reloader) // при изменении файлов запускаем пересборку HTML и обновление в браузере
    );
    gulp.watch( // следим за HTML
        [
            dirs.source + '**/**/**/**/*.php',                              // в папке с исходниками
            dirs.source + '/modules/*.php', // и в папке с мелкими вставляющимся файлами
        ],
        gulp.series('php', reloader) // при изменении файлов запускаем пересборку HTML и обновление в браузере
    );
    gulp.watch( // следим
        [
            dirs.source + '/sass/**/*.scss',
            dirs.source + '/sass/*.scss',
            dirs.source + '/*.scss',
        ],
        gulp.series('sass', reloader) // при изменении запускаем компиляцию (обновление браузера — в задаче компиляции)
    );
    gulp.watch( // следим за SVG
        dirs.source + '/assets/img/svg-sprite/*.svg',
        gulp.series('svgstore', 'html', reloader)
    );
    gulp.watch( // следим за изображениями
        dirs.source + '/assets/img/*.{gif,png,jpg,jpeg,svg}',
        gulp.series('img', reloader) // при изменении оптимизируем, копируем и обновляем в браузере
    );
    
    gulp.watch( // следим за SVG
        dirs.source + '/assets/images/svg-sprite/*.svg',
        gulp.series('svgstore', 'html', reloader)
    );
    gulp.watch( // следим за изображениями
        dirs.source + '/assets/images/*.{gif,png,jpg,jpeg,svg}',
        gulp.series('img', reloader) // при изменении оптимизируем, копируем и обновляем в браузере
    );
    
    gulp.watch( // следим за изображениями
        [
            dirs.source + '/uploads/**/*.{gif,png,jpg,jpeg,svg}',
            dirs.source + '/uploads/*.{gif,png,jpg,jpeg,svg}',
        ],
        gulp.series('imguploads', reloader) // при изменении оптимизируем, копируем и обновляем в браузере
    );
    gulp.watch( // следим за JS
        dirs.source + '/assets/js/*.js',
        gulp.series('copyJS', reloader) // при изменении пересобираем и обновляем в браузере
    );
}));

// ЗАДАЧА, ВЫПОЛНЯЕМАЯ ТОЛЬКО ВРУЧНУЮ: Отправка в GH pages (ветку gh-pages репозитория)
gulp.task('deploy', function() {
    return gulp.src('./build/**/*')
    .pipe(ghPages());
});

// ЗАДАЧА: Задача по умолчанию
gulp.task('default', gulp.series('serve'));

// Дополнительная функция для перезагрузки в браузере
function reloader(done) {
    browserSync.reload();
    done();
}

// Проверка существования файла/папки
function fileExist(path) {
    const fs = require('fs');
    try {
        fs.statSync(path);
    } catch(err) {
        return !(err && err.code === 'ENOENT');
    }
}
var onError = function(err) {
    notify.onError({
        title: 'Error in ' + err.plugin,
    })(err);
    this.emit('end');
};