### 后端服务搭建

node + eppress 后端框架

```bash
mkdir vue-node
cd vue-node
cnpm init -y
```

#### 1.安装依赖

```bash
cnpm i -S express
cnpm i -S boom
```

#### 2.安装 body-parser

这里我们通过 req.body 获取 POST 请求中的参数，但是没有获取成功，我们需要通过 body-parser 中间件来解决这个问题：

```bash
cnpm i -S body-parser
```

使用，在 app.js 中加入：

```bash
const bodyParser = require('body-parser')

// 创建 express 应用
const app = express()

app.use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
```

[关于 body-parser 的实现原理与细节](!https://juejin.im/post/59222c5d2f301e006b1616ae)

#### 3.安装 cors

返回前端使用登录按钮请求登录接口，发现控制台报错：

```bash
Access to XMLHttpRequest at 'https://book.youbaobao.xyz:18082/user/login' from origin 'http://localhost:9527' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

这是由于前端部署在 http://localhost:9527 而后端部署在 https://book.youbaobao.xyz:18082，所以导致了跨域错误，我们需要在 node 服务中添加跨域中间件 cors：

```bash
cnpm i -S cors
```

使用：

```bash
const cors = require('cors')

// ...
app.use(cors())
```

再次请求即可成功，这里我们在 Network 中会发现发起了两次 https 请求，这是因为由于触发跨域，所以会首先进行 OPTIONS 请求，判断服务端是否允许跨域请求，如果允许才能实际进行请求

[关于为什么要发起 OPTIONS 请求](!https://juejin.im/post/5cb3eedcf265da038f7734c4)

#### 4.安装 mysql 服务

```bash
cnpm i -S mysql
```

此时即使我们输入正确的用户名和密码仍然无法登录，这是因为密码采用了 MD5 + SALT 加密，所以我们需要对密码进行对等加密，才能查询成功。在 /utils/constant.js 中加入 SALT：

```bash
PWD_SALT: 'admin_node',
```

#### 5.安装 crypto

```bash
cnpm i -S crypto
```

然后在 /utils/index.js 中创建 md5 方法：

```bash
const crypto = require('crypto')

function md5(s) {
  // 注意参数需要为 String 类型，否则会出错
  return crypto.createHash('md5')
    .update(String(s)).digest('hex');
}
```

#### 6.使用 express-validator 校验框架

express-validator 是一个功能强大的表单验证器，它是 validator.js 的中间件

[源码地址](!https://github.com/express-validator/express-validator)

使用 express-validator 可以简化 POST 请求的参数验证

安装

```bash
cnpm i -S express-validator
```

express-validator 使用技巧：

在 router.post 方法中使用 body 方法判断参数类型，并指定出错时的提示信息
使用 const err = validationResult(req) 获取错误信息，err.errors 是一个数组，包含所有错误信息，如果 err.errors 为空则表示校验成功，没有参数错误

如果发现错误我们可以使用 next(boom.badRequest(msg)) 抛出异常，交给我们自定义的异常处理方法进行处理

#### 7.生成 JWT Token

安装

```bash
cnpm i -S jsonwebtoken
```

使用

```bash
const jwt = require('jsonwebtoken')
const { PRIVATE_KEY, JWT_EXPIRED } = require('../utils/constant')

login(username, password).then(user => {
    if (!user || user.length === 0) {
      new Result('登录失败').fail(res)
    } else {
      const token = jwt.sign(
        { username },
        PRIVATE_KEY,
        { expiresIn: JWT_EXPIRED }
      )
      new Result({ token }, '登录成功').success(res)
    }
})
```

这里需要定义 jwt 的私钥和过期时间，过期时间不宜过短，也不宜过长，课程里设置为 1 小时，实际业务中可根据场景来判断，通常建议不超过 24 小时，保密性要求高的业务可以设置为 1-2 小时：

#### 8.JWT Token 认证

安装

```bash
cnpm i -S express-jwt

var { expressjwt: jwt } = require("express-jwt");
if(!req.auth.username){
    new Result('用户查询失败').fail(res)
  }

var { expressjwt: jwt } = require("express-jwt");
// or ES6
// import { expressjwt, ExpressJwtRequest } from "express-jwt";

app.get(
  "/protected",
  jwt({ secret: "shhhhhhared-secret", algorithms: ["HS256"] }),
  function (req, res) {
    if (!req.auth.admin) return res.sendStatus(401);
    res.sendStatus(200);
  }
);
```

#### 9.修改 Logout 方法

```bash
logout({ commit, state, dispatch }) {
    return new Promise((resolve, reject) => {
      try {
        commit('SET_TOKEN', '')
        commit('SET_ROLES', [])
        removeToken()
        resetRouter()
        // reset visited views and cached views
        // to fixed https://github.com/PanJiaChen/vue-element-admin/issues/2485
        dispatch('tagsView/delAllViews', null, { root: true })
        resolve()
      } catch (e) {
        reject(e)
      }
    })
}
```


