const express = require('express')
const boom = require('boom')
const router = require('./router')
const bodyParser = require('body-parser')
const cors = require('cors')



// 创建 express 应用
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(cors())
app.use('/', router)


// 使 express 监听 18082 端口号发起的 http 请求
const server = app.listen(18082, function() {
  const { address, port } = server.address()
  console.log('HTTP 服务启动成功 http://%s:%s', address, port)
})