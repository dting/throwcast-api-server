const u = require('../../utils');
const Favorite = require('../favorite/favorite.model');
const Playlist = require('./playlist.model');

const controller = {};

controller.lists = function list(req, res) {
  Playlist.find({})
    .populate('podcasts')
    .then(u.respondWithResult(res))
    .catch(u.handleError(res));
};

controller.create = function create(req, res) {
  const opts = [{ path: 'podcasts', model: 'Podcast' }];
  const sanitized = u.sanitizedUpdate(req.body, ['_id', 'owner']);
  sanitized.owner = req.user._id;
  Playlist.create(sanitized)
    .then(created => Playlist.populate(created, opts))
    .then(u.respondWithResult(res))
    .catch(u.handleError(res));
};

controller.remove = function remove(req, res) {
  req.playlist.remove()
    .then(() => res.sendStatus(204))
    .catch(u.handleError(res));
};

controller.details = function details(req, res) {
  const opts = [{ path: 'podcasts', model: 'Podcast' }];
  Playlist.populate(req.playlist, opts)
    .then(u.respondWithResult(res))
    .catch(u.handleError(res));
};

controller.update = function update(req, res) {
  const opts = { runValidators: true, new: true };
  const sanitized = u.sanitizedUpdate(req.body, ['_id', 'owner', 'createdAt', 'updatedAt']);
  Playlist
    .findByIdAndUpdate(req.playlist.id, { $set: sanitized }, opts)
    .populate('podcasts')
    .then(u.respondWithResult(res))
    .catch(u.handleError(res));
};

const favoritePlaylistPipeline = [
  { $match: { from: 'playlists' } },
  { $group: { _id: '$localField', count: { $sum: 1 } } },
  { $sort: { count: -1, _id: 1 } },
  { $limit: 50 },
  { $lookup: { from: 'playlists', localField: '_id', foreignField: '_id', as: 'playlist' } },
  { $unwind: '$playlist' },
  { $project: { _id: 0, count: 1, podcast: 1 } },
];

controller.topFavorites = function popular(req, res) {
  Favorite.aggregate(favoritePlaylistPipeline)
    .then(results => res.json(results))
    .catch(u.handleError(res));
};


module.exports = controller;
