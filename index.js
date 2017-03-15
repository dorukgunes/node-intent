'use strict'

var _ = require('lodash')

class NodeIntent {
  /**
   *
   * @param {object|string} entitiesFile
   * @param {object|string} intentsFile
   */
  constructor (entitiesFile = process.env.ENTITIES_LOC, intentsFile = process.env.INTENTS_LOC) {
    this.entities = (typeof (entitiesFile) === 'object') ? entitiesFile : require(entitiesFile)
    this.intents = (typeof (intentsFile) === 'object') ? intentsFile : require(intentsFile)
  }

  /**
   * @returns {Array} entitiesPrepared
   */
  _getPreparedEntities () {
    var entitiesPrepared = []
    _.forEach(this.entities, (entityValue, entityKey) => {
      _.forEach(entityValue, (topValue, topKey) => {
        entitiesPrepared.push({
          entity_key: entityKey,
          top_key: topKey,
          value: topKey
        })
        _.forEach(topValue, (alies) => {
          entitiesPrepared.push({
            entity_key: entityKey,
            top_key: topKey,
            value: alies
          })
        })
      })
    })
    return entitiesPrepared
  }

  /**
   *
   * @param {string} text
   */
  _getFoundedEntities (text) {
    var foundedEntities = []
    _.each(this._getPreparedEntities(), (entity) => {
      let foundPosition = text.toLocaleLowerCase().search(entity.value)
      if (foundPosition > -1) {
        entity.found_position = foundPosition
        foundedEntities.push(entity)
      }
    })

    let sortedFoundedEntities = _.orderBy(foundedEntities, ['found_position'], ['asc'])

    return sortedFoundedEntities
  }

  /**
   *
   * @param {string} text - The given input text
   * @param {function} callback
   */
  getIntent (text, callback) {
    let foundedEntities = this._getFoundedEntities(text)
    if (foundedEntities.length <= 0) return callback()

    let entityKeys = _.map(foundedEntities, 'entity_key')

    _.each(this.intents, (intent) => {
      if (intent.any_sort) {
        let isIntentFound = _.isEqual(intent.intent.sort(), entityKeys.sort())
        return this._intentResult(isIntentFound, intent, foundedEntities, callback)
      } else {
        let isIntentFound = _.isEqual(intent.intent, entityKeys)
        return this._intentResult(isIntentFound, intent, foundedEntities, callback)
      }
    })
  }

  _intentResult (isIntentFound, intent, foundedEntities, callback) {
    if (isIntentFound) {
      return callback(null, {
        intent_id: intent.id,
        entities: foundedEntities
      })
    } else {
      return callback()
    }
  }
}

module.exports = NodeIntent
