const express = require('express')
const router = express.Router()
const { UPLOAD_PATH } = require ('../utils/constant')
const multer =require ('multer')
const Result =require ('../models/Result')
const Book =require ('../models/Book')
const boom =require('boom')

router.post(
    '/upload',
    multer({ dest: `${UPLOAD_PATH}/book`}).single('file'),
    function(req, res, next) {
        if(!req.file || req.file.length ===0 ){
            new Result('上传电子书失败').fail(res)
        }else{
            const book = new Book(req.file)
            console.log(book)
            book.parse().then(book => {
                console.log('book', book)
                new Result('上传电子书成功').success(res)
            }).catch(err => {
                next(boom.badImplementation(err))
            })   
        }
})

module.exports = router