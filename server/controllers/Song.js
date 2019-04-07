const models = require('../models');

const Song = models.Song;

const makerPage = (req, res) => {
  Song.SongModel.findByOwner(req.session.account._id, (err, docs) => {
    if (err) {
      console.log(err);
      return res.status(400).json({ error: 'An error occurred' });
    }

    return res.render('app', { csrfToken: req.csrfToken(), songs: docs });
  });
};

const makeSong = (req, res) => {
  if (!req.body.name || !req.body.artist || !req.body.album) {
    return res.status(400).json({ error: 'RAWR! All fields are required' });
  }

  const songData = {
    name: req.body.name,
    artist: req.body.artist,
    album: req.body.album,
    owner: req.session.account._id,
  };

  const newSong = new Song.SongModel(songData);

  const songPromise = newSong.save();

  songPromise.then(() => res.json({ redirect: '/maker' }));

  songPromise.catch((err) => {
    console.log(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Song already exists' });
    }

    return res.status(400).json({ error: 'An error occurred' });
  });

  return songPromise;
};


module.exports.makerPage = makerPage;
module.exports.make = makeSong;
