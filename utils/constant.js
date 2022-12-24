const { env } = require('./env')
const UPLOAD_PATH = env === 'dev' ? '/Users/biguodong/upload/ebook' : '/root/upload/admin-upload/ebook'
// const UPLOAD_URL = env === 'dev' ? 'https://boook.youbaobao.xyz/ebook' : 'https://www.youbaobao.xyz/ebook'
const UPLOAD_URL = env === 'dev' ? 'http://book.youbaobao.xyz:8089/ebook' : 'https://www.youbaobao.xyz/ebook'

module.exports = {
    CODE_TOKEN_EXPIRED: -2,
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    debug: true,
    PWD_SALT: 'admin_mode',
    PRIVATE_KEY: 'vue_element_admin_node',
    JWT_EXPIRED: 60 * 60,
    UPLOAD_PATH,
    UPLOAD_URL,
    MIME_TYPE_EPUB: 'application/epub+zip'
}