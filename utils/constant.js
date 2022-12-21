const { env } = require('./env')
const UPLOAD_PATH = env === 'dev' ? '/Users/biguodong/ebook/upload' : '/root/upload/admin-upload/ebook'

module.exports = {
    CODE_TOKEN_EXPIRED: -2,
    CODE_ERROR: -1,
    CODE_SUCCESS: 0,
    debug: true,
    PWD_SALT: 'admin_mode',
    PRIVATE_KEY: 'vue_element_admin_node',
    JWT_EXPIRED: 60 * 60,
    UPLOAD_PATH
}