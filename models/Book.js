const { MIME_TYPE_EPUB, UPLOAD_URL, UPLOAD_PATH } =require ('../utils/constant')
const fs =require ('fs')
const EPub =require ('../utils/epub')
const xml2js = require('xml2js').parseString


class Book {
    constructor(file, data){
        if(file){
            this.createBookFromFile(file)
        }else{
            this.createBookFromData(data)
        }
    }

    createBookFromFile(file){
        console.log('createBookFromFile', file)
        const {
            destination,
            filename,
            mimetype = MIME_TYPE_EPUB,
            path,
            originalname
        } = file
        // 电子书文件后缀名
        const suffix = mimetype === MIME_TYPE_EPUB ? '.epub' : ''
        // 电子书的原有路径
        const oldBookPath = path
        // 电子书的新路径
        const bookPath = `${destination}/${filename}${suffix}`
        // 电子书的下载url
        const url = `${UPLOAD_URL}/book/${filename}${suffix}`
        // 电子书解压后的文件夹路径
        const unzipPath = `${UPLOAD_PATH}/unzip/${filename}`
        // 电子书解压后的文件夹URL
        const unzipUrl = `${UPLOAD_URL}/unzip/${filename}`
        if(!fs.existsSync(unzipPath)){
            fs.mkdirSync(unzipPath, {recursive: true})
        }
        if(fs.existsSync(oldBookPath) && !fs.existsSync(bookPath)){
            fs.renameSync(oldBookPath, bookPath)
        }
        this.fileName = filename // 文件名，主键
        this.path = `/book/${filename}${suffix}` // 文件相对路径
        this.filePath = this.path
        this.unzipPath = `/unzip/${filename}` // epub 解压后相对路径
        this.url = url // epub 下载连接
        this.title = '' // 书名
        this.author = '' // 作者
        this.publisher = '' // 出版社
        this.contents = [] // 目录
        this.cover = '' // 封面
        this.coverPath = '' // 封面图片路径
        this.category = -1 // 分类
        this.categoryText = '' // 分类名称
        this.language = '' // 语种
        this.unzipUrl = unzipUrl // 解压后文件夹链接
        this.originalName = originalname // 电子书文件原名
    }
    createBookFromData(data){
        console.log('createBookFromData')
    }

    parse(){
        return new Promise(( resolve, reject ) => {
            const bookPath = `${UPLOAD_PATH}${this.filePath}`
            if(!fs.existsSync(bookPath)){
                reject(new Error('电子书不存在'))
            }
            const epub = new EPub(bookPath)
            epub.on('error', err=> {
                reject(err)
            })
            epub.on('end', err=> {
                if(err){
                    reject(err)
                }else{
                    console.log('epub end', epub)
                    const {
                        language,
                        creator,
                        creatorFileAs,
                        title,
                        cover,
                        publisher,
                        subject,
                        description
                    } = epub.metadata
                    if(!title){
                        reject(new Error('图书标题为空'))
                    }else{
                        this.title = title
                        this.language = language || 'en'
                        this.author = creator || creatorFileAs || 'unknown'
                        this.publisher = publisher || 'unknown'
                        this.rootFile = epub.rootFile
                        const handleGetImage = (err, file, mimeType) => {
                            if(err){
                                reject(err)
                            }else{
                                const suffix = mimeType.split('/')[1]
                                const coverPath = `${UPLOAD_PATH}/img/${this.fileName}.${suffix}`
                                const coverUrl = `${UPLOAD_URL}/img/${this.fileName}.${suffix}`
                                fs.writeFileSync(coverPath, file, 'binary')
                                this.coverPath = `/img/${this.fileName}.${suffix}`
                                this.cover = coverUrl
                                resolve(this)
                            }
                        }
                        try{
                            this.unzip()
                            this.parseContents(epub).then( ({ chapters }) => {
                                this.contents = chapters
                                epub.getImage(cover, handleGetImage)
                            })
                        }catch(e){
                            reject(e)
                        }
                    }
                }
            })
            epub.parse()
        })
    }

    unzip(){
        const AdmZip = require('adm-zip')
        const zip = new AdmZip(Book.genPath(this.path))
        zip.extractAllTo(Book.genPath(this.unzipPath), true)
    }


    parseContents(epub){
        function getNcxFilePath() {
            const spine = epub && epub.spine
            const manifest = epub && epub.manifest
            const ncx = spine.toc && spine.toc.href
            const id = spine.toc && spine.toc.id
            if(ncx) {
                return ncx
            }else {
                return manifest[id].href
            }
        }

        function findParent(array, level = 1, pid = '') {
            return array.map(item => {
                item.level = level
                item.pid = pid
                if(item.navPoint && item.navPoint.length > 0){
                    item.navPoint = findParent(item.navPoint, level + 1, item['$'].id)
                }else if(item.navPoint) {
                    item.navPoint.level = level + 1
                    item.navPoint.pid = item['$'].id
                }
                return item
            })
        }

        function flatten(array) {
            return [].concat(...array.map(item => {
                if(item.navPoint && item.navPoint.length > 0) {
                    return [].concat(item, ...flatten(item.navPoint))
                }else if(item.navPoint) {
                    return [].concat(item, item.navPoint)
                }
                return item
            }))
        }

        const ncxFilePath = Book.genPath(`${this.unzipPath}/${getNcxFilePath()}`)

        if(fs.existsSync(ncxFilePath)){
            return new Promise( (resolve, reject) => {
                const xml = fs.readFileSync(ncxFilePath, 'utf-8')
                const fileName = this.fileName
                xml2js(xml, {
                    explicitArray: false,
                    ignoreAttrs: false
                }, function(err, json) {
                    if(err) {
                        reject(err)
                    }else {
                        const navMap = json.ncx.navMap
                        if(navMap.navPoint && navMap.navPoint.length > 0){
                            navMap.navPoint = findParent(navMap.navPoint)
                            const newNavMap = flatten(navMap.navPoint)
                            const chapters = []
                            epub.flow.forEach( (chapter, index) => {
                                if(index + 1 > newNavMap.length) {
                                    return
                                }
                                const nav = newNavMap[index]
                                chapter.text = `${UPLOAD_URL}/unzip/${fileName}/${chapter.href}`
                                if(nav && nav.navLabel) {
                                    chapter.label = nav.navLabel.text
                                }else {
                                    chapter.label = ''
                                }
                                chapter.level = nav.level
                                chapter.pid = nav.pid
                                chapter.navId = nav['$'].id
                                chapter.fileName = fileName
                                chapter.order = index + 1
                                chapters.push(chapter)
                            });
                            resolve({ chapters })
                        }else {
                            reject(new Error('目录解析失败，目录树为0'))
                        }
                    }
                })
            })
        }else{
            throw new Error('目录文件不存在')
        }
    }

    static genPath(path){
        if(!path.startsWith('/')){
            path = `/${path}`
        }
        return `${UPLOAD_PATH}${path}`
    }


}

module.exports = Book