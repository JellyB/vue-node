const express = require('express')
const Result = require('../models/Result')
const router = express.Router()
const { login,findUser } = require('../services/user')
const { md5 } = require('../utils/index')
const { PWD_SALT,PRIVATE_KEY,JWT_EXPIRED } = require('../utils/constant')
const { check, validationResult } = require('express-validator')
const boom = require('boom')
const jwt = require('jsonwebtoken')


router.get('/info', function(req, res) {
  if(!req.auth.username){
    new Result('用户查询失败').fail(res)
  }else{
    const username = req.auth.username
    console.log('当前用户名：' + username)
    findUser(username).then(user => {
      if(user){
        user.roles = [user.role]
        console.log(user)
        new Result(user, '用户查询成功').success(res)
      }else{
        new Result('用户查询失败').fail(res)
      }
    })
  }
})

router.post(
  '/login', 
  [
    check('username').isString().withMessage('username类型不正确'),
    check('password').isString().withMessage('password类型不正确'),
    check('username').isLength({min:4},{max:10}).withMessage('username长度限于4-10位'),
    check('password').isLength({min:4},{max:10}).withMessage('password长度限于4-10位')
  ],
  function(req, res, next){
    console.log(req.body)
    const err = validationResult(req)
    if(!err.isEmpty()){
      const[{ msg }] = err.errors
      console.log(err)
      next(boom.badRequest(msg))
    }else{
      let { username, password } = req.body
      password = md5(`${password}${PWD_SALT}`)
      console.log(password)
      login(username, password).then( user => {
        if (!user || user.length === 0) {
          new Result('用户名或密码错误').fail(res)
        } else {
          const token = jwt.sign(
            { username },
            PRIVATE_KEY,
            { expiresIn: JWT_EXPIRED }
          )
          new Result( { token }, '登录成功').success(res)
        }
      })
    }
})

module.exports = router