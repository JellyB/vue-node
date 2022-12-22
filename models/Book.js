const { MIME_TYPE_EPUB, UPLOAD_URL, UPLOAD_PATH } =require ('../utils/constant')
const fs =require ('fs')
const EPub =require ('../utils/epub')


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
            console.log("bookPath:" + bookPath)
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
                    console.log(epub.metadata)
                    resolve()
                }
            })
            epub.parse()
        })
    }

}

module.exports = Book