/* eslint-disable max-params, no-console */
const path = require('path')
const express = require('express')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')
const jwt = require('jsonwebtoken')
const get = require('lodash.get')
const GQL = require('./gql-queries')
const getGqlErrors = require('./gql-errors')

const JWT_COOKIE_NAME = 'jwt'
const JWT_COOKIE_PARAMS = {
  maxAge: 1000 * 60 * 60 * 24, // 1 day in milliseconds
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
}

const cacheHash =
  process.env.NODE_ENV === 'test' ? '_' : Date.now().toString(36)

require('express-async-errors')

const app = express()

app.use(bodyParser.urlencoded({ extended: false }))
app.use(cookieParser())

// See https://github.com/reactjs/express-react-views#add-it-to-your-app
app.set('views', path.join(__dirname, '/views'))
app.set('view engine', 'jsx')
app.engine('jsx', require('express-react-views').createEngine())

async function ensureJwt(req, res, next) {
  if (!get(req.cookies, JWT_COOKIE_NAME)) {
    res.cookie(
      JWT_COOKIE_NAME,
      get(await GQL.rootGetAnonToken(req), 'data.getAnonymousToken.jwtToken'),
      JWT_COOKIE_PARAMS
    )
  }
  next()
}

function handleError(err, req, res, next) {
  // See express-async-errors
  if (err) res.redirect('/server-error')
  next(err)
}

function getJwt(req) {
  return jwt.decode(get(req.cookies, JWT_COOKIE_NAME))
}

function getRole(req) {
  return get(getJwt(req), 'role')
}

function isUser(req, res, next) {
  if (!['sg_user', 'sg_admin'].includes(getRole(req))) {
    return res.redirect('/log-in')
  }
  return next()
}

function isAnonymous(req, res, next) {
  if (getRole(req) !== 'sg_anonymous') {
    return res.redirect('/dashboard')
  }
  return next()
}

function handleRegular(req, res) {
  return res.render('Index', {
    location: req.url,
    cacheHash,
    role: getRole(req),
  })
}

app.use(ensureJwt)
app.use(handleError)

// /////////////////////////////////////////////////////////////////////////////

app.get('/sitemap.txt', (req, res) =>
  res.send(`
https://sagefy.org
https://sagefy.org/terms
https://sagefy.org/contact
https://sagefy.org/sign-up
https://sagefy.org/log-in
https://sagefy.org/email
https://sagefy.org/password
`)
) // Add more public routes as they are available

app.get('/sign-up', isAnonymous, handleRegular)

app.post('/sign-up', isAnonymous, async (req, res) => {
  const gqlRes = await GQL.rootNewUser(req)
  const gqlErrors = getGqlErrors(gqlRes)
  if (Object.keys(gqlErrors).length) {
    return res.render('Index', {
      location: req.url,
      cacheHash,
      gqlErrors,
      prevValues: req.body,
    })
  }
  return res
    .cookie(
      JWT_COOKIE_NAME,
      get(gqlRes, 'data.signUp.jwtToken'),
      JWT_COOKIE_PARAMS
    )
    .redirect('/dashboard')
})

app.get('/log-in', isAnonymous, handleRegular)

app.post('/log-in', isAnonymous, async (req, res) => {
  const gqlRes = await GQL.rootLogInUser(req)
  const gqlErrors = getGqlErrors(gqlRes)
  if (Object.keys(gqlErrors).length) {
    return res.render('Index', {
      location: req.url,
      cacheHash,
      gqlErrors,
      prevValues: req.body,
    })
  }
  return res
    .cookie(
      JWT_COOKIE_NAME,
      get(gqlRes, 'data.logIn.jwtToken'),
      JWT_COOKIE_PARAMS
    )
    .redirect('/dashboard')
})

function getQueryState(req) {
  return parseInt(req.query.state, 10) || 0
}

app.get('/email', async (req, res) => {
  const state = getQueryState(req)
  return res.render('Index', { location: req.url, cacheHash, state })
})

app.post('/email', async (req, res) => {
  if (getQueryState(req) === 2) {
    const gqlRes = await GQL.rootEditEmail({
      body: req.body,
      cookies: { [JWT_COOKIE_NAME]: req.query.token },
    })
    const gqlErrors = getGqlErrors(gqlRes)
    if (Object.keys(gqlErrors).length) {
      return res.render('Index', {
        location: req.url,
        cacheHash,
        gqlErrors,
        state: 2,
      })
    }
    return res.redirect('/log-in')
  }
  const gqlRes = await GQL.rootNewEmailToken(req)
  const gqlErrors = getGqlErrors(gqlRes)
  if (Object.keys(gqlErrors).length) {
    return res.render('Index', {
      location: req.url,
      cacheHash,
      gqlErrors,
      state: 0,
    })
  }
  return res.redirect('/email?state=1')
})

app.get('/password', async (req, res) => {
  const state = getQueryState(req)
  return res.render('Index', { location: req.url, cacheHash, state })
})

app.post('/password', async (req, res) => {
  if (getQueryState(req) === 2) {
    const gqlRes = await GQL.rootEditPassword({
      body: req.body,
      cookies: { [JWT_COOKIE_NAME]: req.query.token },
    })
    const gqlErrors = getGqlErrors(gqlRes)
    if (Object.keys(gqlErrors).length) {
      return res.render('Index', {
        location: req.url,
        cacheHash,
        gqlErrors,
        state: 2,
      })
    }
    return res.redirect('/log-in')
  }
  const gqlRes = await GQL.rootNewPasswordToken(req)
  const gqlErrors = getGqlErrors(gqlRes)
  if (Object.keys(gqlErrors).length) {
    return res.render('Index', {
      location: req.url,
      cacheHash,
      gqlErrors,
      state: 0,
    })
  }
  return res.redirect('/password?state=1')
})

app.get('/settings', isUser, async (req, res) => {
  const gqlRes = await GQL.rootGetCurrentUser(req)
  return res.render('Index', {
    location: req.url,
    cacheHash,
    prevValues: get(gqlRes, 'data.getCurrentUser'),
  })
})

app.post('/settings', isUser, async (req, res) => {
  const gqlRes = await GQL.rootEditUser(req)
  const gqlErrors = getGqlErrors(gqlRes)
  return res.render('Index', {
    location: req.url,
    cacheHash,
    gqlErrors,
    prevValues: req.body,
  })
})

app.get('/log-out', isUser, (req, res) =>
  res.clearCookie(JWT_COOKIE_NAME).redirect('/')
)

app.get('/dashboard', isUser, handleRegular)

// For pages that don't have specific data requirements
// and don't require being logged in or logged out:
// GET /search-subjects
// GET /server-error
// GET /terms
// GET /contact
// GET /
// GET * (NotFound)
app.get('*', handleRegular)

// /////////////////////////////////////////////////////////////////////////////

if (require.main === module) {
  app.listen(process.env.PORT || 5984)
}

module.exports = app