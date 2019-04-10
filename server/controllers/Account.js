const models = require('../models');

const Account = models.Account;

const loginPage = (req, res) => {
  res.render('login', { csrfToken: req.csrfToken() });
};

const signupPage = (req, res) => {
  res.render('signup', { csrfToken: req.csrfToken() });
};

const changePasswordPage = (req, res) => {
  res.render('changePassword', { csrfToken: req.csrfToken() });
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/');
};

const login = (request, response) => {
  const req = request;
  const res = response;

  const username = `${req.body.username}`;
  const password = `${req.body.pass}`;

  if (!username || !password) {
    return (res.status(400).json({ error: 'RAWR! All fields are required' }));
  }
  return Account.AccountModel.authenticate(username, password, (err, account) => {
    if (err || !account) {
      return (res.status(400).json({ error: 'Wrong username or password' }));
    }

    req.session.account = Account.AccountModel.toAPI(account);

    return res.json({ redirect: '/maker' });
  });
};

const signup = (request, response) => {
  const req = request;
  const res = response;

    // cast to strings to cover up some security flaws
  req.body.username = `${req.body.username}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.username || !req.body.pass || !req.body.pass2) {
    return (res.status(400).json({ error: 'RAWR! All fields are required' }));
  }
  if (req.body.pass !== req.body.pass2) {
    return (res.status(400).json({ error: 'RAWR! Passwords do not match' }));
  }

  return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
    const accountData = {
      username: req.body.username,
      salt,
      password: hash,
    };

    const newAccount = new Account.AccountModel(accountData);

    const savePromise = newAccount.save();

    savePromise.then(() => {
      req.session.account = Account.AccountModel.toAPI(newAccount);
      return res.json({ redirect: '/maker' });
    });

    savePromise.catch((err) => {
      console.log(err);

      if (err.code === 11000) {
        return (res.status(400).json({ error: 'Username already in use.' }));
      }
      return (res.status(400).json({ error: 'An error occurred' }));
    });
  });
};
const deleteAccount = (request, response) => {
  Account.AccountModel.remove({username: request.session.account.username}, (err) => {
    if(err) console.log(err);
  });

  request.session.destroy();
  response.redirect('/');
};

const changePassword = (request, response) => {
  const req = request;
  const res = response;

  // cast to strings to cover up some security flaws
  req.body.currentPass = `${req.body.currentPass}`;
  req.body.pass = `${req.body.pass}`;
  req.body.pass2 = `${req.body.pass2}`;

  if (!req.body.currentPass || !req.body.pass || !req.body.pass2) {
    return (res.status(400).json({ error: 'RAWR! All fields are required' }));
  }
  if (req.body.pass !== req.body.pass2) {
    return (res.status(400).json({ error: 'RAWR! Passwords do not match' }));
  }

  return Account.AccountModel.authenticate(req.session.account.username, req.body.currentPass, (err, account) => {
    if (err || !account) {
      return res.status(401).json({ error: 'Incorrect password' });
    }

    const newAccount = account;

    return Account.AccountModel.generateHash(req.body.pass, (salt, hash) => {
      newAccount.password = hash;
      newAccount.salt = salt;

      const savePromise = newAccount.save();

      savePromise.then(() => res.json({
        password: newAccount.password,
      }));

      savePromise.catch((saveErr) => {
        res.json(saveErr);
      });

      return res.json({ redirect: '/maker' });
    });
  });
};

module.exports.loginPage = loginPage;
module.exports.login = login;
module.exports.logout = logout;
module.exports.signupPage = signupPage;
module.exports.signup = signup;
module.exports.changePassword = changePassword;
module.exports.changePasswordPage = changePasswordPage;
module.exports.deleteAccount = deleteAccount;
