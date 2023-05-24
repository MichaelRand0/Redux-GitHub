
const jsonServer = require('json-server')
const server = jsonServer.create()
const fs = require('fs')
const path = require('path')
const router = jsonServer.router(path.join(__dirname, 'db.json'))
const middlewares = jsonServer.defaults()
const jwt = require('jsonwebtoken')
const bcrypt = require('bcryptjs')
const SECRET_KEY = 'hello json-server'
const expiresIn = '1hr'

const createToken = (payload) => {
  return jwt.sign(payload, SECRET_KEY, { expiresIn })
}

const checkIsUserExists = (login, password) => {
  const bd = JSON.parse(fs.readFileSync('server/db.json', 'utf-8'))
  return bd.users.some((user) => {
    const isPasswordMatch = bcrypt.compareSync(password, user.password)
    return user.login === login && isPasswordMatch
  })
}

server.use(jsonServer.bodyParser)

server.use((req, res, next) => {
  if (req.method === 'POST') {
    if (req.path === '/users') {
      const { login, password } = req.body
      if (checkIsUserExists(login, password)) {
        router.render = (req, res) => {
          res.status(500).jsonp({
            message: 'User already exists',
          })
        }
      } else {
        const salt = bcrypt.genSaltSync(10)
        const hash = bcrypt.hashSync(password, salt)
        req.body.password = hash
        router.render = (req, res) => {
          res.status(200).jsonp({
            message: 'User successfully created!',
          })
        }
      }
    } else if (req.path === '/signin') {
      const { login, password } = req.body
      if (checkIsUserExists(login, password)) {
        const token = createToken({ login, password })
        router.render = (req, res) => {
          res.status(200).jsonp({
            message: 'Successfully authorized',
            token,
          })
        }
      } else {
        router.render = (req, res) => {
          res.status(401).jsonp({
            message: 'Incorrect login or password',
          })
        }
      }
    }
  }
  next()
})

server.use(middlewares)
server.use(router)

server.listen(3001, () => {
  console.log('JSON Server is running')
})
