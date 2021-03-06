import {db_url as dbURL} from 'api/config/database';
import request from 'shared/JSONRequest';
import sanitizeResponse from 'api/utils/sanitizeResponse';
import templates from 'api/templates';

let normalizeConnection = (connection, docId) => {
  connection.targetRange = connection.targetRange || {text: ''};
  connection.sourceRange = connection.sourceRange || {text: ''};
  connection.inbound = connection.targetDocument === docId;
  connection.range = connection.inbound ? connection.targetRange : connection.sourceRange;
  connection.text = connection.inbound ? connection.sourceRange.text : connection.targetRange.text;
  connection.connectedDocument = connection.inbound ? connection.sourceDocument : connection.targetDocument;
  return connection;
};

let normalizeConnectedDocumentData = (connection, connectedDocument) => {
  connection.connectedDocumentTemplate = connectedDocument.template;
  connection.connectedDocumentType = connectedDocument.type;
  connection.connectedDocumentTitle = connectedDocument.title;
  connection.connectedDocumentPublished = Boolean(connectedDocument.published);
  return connection;
};

export default {
  getAll() {
    return request.get(`${dbURL}/_design/references/_view/all`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  getByDocument(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_document?key="${docId}"`)
    .then((response) => {
      let connections = sanitizeResponse(response.json).rows.map((connection) => normalizeConnection(connection, docId));
      let requestDocuments = [];
      connections.forEach((connection) => {
        let promise = request.get(`${dbURL}/${connection.connectedDocument}`)
        .then((connectedDocument) => {
          normalizeConnectedDocumentData(connection, connectedDocument.json);
        });
        requestDocuments.push(promise);
      });

      return Promise.all(requestDocuments)
      .then(() => {
        return connections;
      });
    });
  },

  getByTarget(docId) {
    return request.get(`${dbURL}/_design/references/_view/by_target?key="${docId}"`)
    .then((response) => {
      return sanitizeResponse(response.json);
    });
  },

  countByRelationType(typeId) {
    return request.get(`${dbURL}/_design/references/_view/count_by_relation_type?key="${typeId}"`)
    .then((response) => {
      if (!response.json.rows.length) {
        return 0;
      }
      return response.json.rows[0].value;
    });
  },

  save(connection) {
    connection.type = 'reference';
    return request.post(dbURL, connection)
    .then((result) => {
      return request.get(`${dbURL}/${result.json.id}`);
    })
    .then((result) => {
      return normalizeConnection(result.json, connection.sourceDocument);
    })
    .then((result) => {
      return Promise.all([result, request.get(`${dbURL}/${result.connectedDocument}`)]);
    })
    .then(([result, connectedDocument]) => {
      return normalizeConnectedDocumentData(result, connectedDocument.json);
    });
  },

  saveEntityBasedReferences(entity) {
    return templates.getById(entity.template)
    .then((template) => {
      const selects = template.properties.filter((prop) => prop.type === 'select' || prop.type === 'multiselect');
      const entitySelects = [];
      return Promise.all(selects.map((select) => {
        return request.get(`${dbURL}/${select.content}`)
        .then((result) => {
          if (result.json.type === 'template') {
            entitySelects.push(select.name);
          }
        });
      }))
      .then(() => entitySelects);
    })
    .then((properties) => {
      return Promise.all([
        properties,
        this.getByDocument(entity._id)
      ]);
    })
    .then(([properties, references]) => {
      let values = properties.reduce((memo, property) => {
        let propertyValues = entity.metadata[property] || [];
        if (typeof propertyValues === 'string') {
          propertyValues = [propertyValues];
        }

        return memo.concat(propertyValues.map(value => {
          return {property, value};
        }));
      }, []);


      const toDelete = references.filter((ref) => {
        let isInValues = false;
        values.forEach((item) => {
          if (item.property === ref.sourceProperty && ref.targetDocument === item.value) {
            isInValues = true;
          }
        });
        return !isInValues && ref.sourceType === 'metadata';
      });

      const toCreate = values.filter((item) => {
        let isInReferences = false;
        references.forEach((ref) => {
          if (item.property === ref.sourceProperty && ref.targetDocument === item.value) {
            isInReferences = true;
          }
        });
        return !isInReferences;
      });

      const deletes = toDelete.map((ref) => this.delete(ref));
      const creates = toCreate.map((item) => this.save({
        sourceType: 'metadata',
        sourceDocument: entity._id,
        targetDocument: item.value,
        sourceProperty: item.property
      }));

      return Promise.all(deletes.concat(creates));
    });
  },

  delete(reference) {
    return request.delete(`${dbURL}/${reference._id}`, {rev: reference._rev})
    .then((result) => {
      return result.json;
    });
  }
};
