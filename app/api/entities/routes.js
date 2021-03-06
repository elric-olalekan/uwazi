import request from '../../shared/JSONRequest.js';
import {db_url as dbUrl} from '../config/database.js';
import entities from './entities';
import needsAuthorization from '../auth/authMiddleware';

export default (app) => {
  app.post('/api/entities', needsAuthorization, (req, res) => {
    return entities.save(req.body, req.user)
    .then(doc => res.json(doc));
  });

  app.get('/api/entities/count_by_template', (req, res) => {
    return entities.countByTemplate(req.query.templateId)
    .then(results => res.json(results));
  });

  app.get('/api/entities/list', (req, res) => {
    let keys;
    if (req.query.keys) {
      keys = JSON.parse(req.query.keys);
    }

    return entities.list(keys)
    .then(results => res.json(results));
  });

  app.get('/api/entities/uploads', needsAuthorization, (req, res) => {
    entities.getUploadsByUser(req.user)
    .then(response => res.json(response))
    .catch(error => res.json({error: error}));
  });

  app.get('/api/entities', (req, res) => {
    let id = '';
    let url = dbUrl + '/_design/entities/_view/all';

    if (req.query && req.query._id) {
      id = '?key="' + req.query._id + '"';
      url = dbUrl + '/_design/entities/_view/all' + id;
    }

    request.get(url)
    .then(response => {
      response.json.rows = response.json.rows.map(row => row.value);
      res.json(response.json);
    })
    .catch(console.log);
  });

  app.delete('/api/entities', needsAuthorization, (req, res) => {
    entities.delete(req.query._id)
    .then((response) => {
      res.json(response);
    })
    .catch((error) => {
      res.json({error: error.json});
    });
  });
};
