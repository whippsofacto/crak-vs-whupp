const mysql = require('promise-mysql')
const SqlString = require('sqlstring')
const moment = require('moment')
const uuidv4 = require('uuid/v4')

const pool = mysql.createPool({
  connectionLimit: 20,
  host: process.env.API_DB_HOST,
  user: process.env.API_DB_USER,
  password: process.env.API_DB_PASSWORD,
  database: process.env.API_DB_NAME
})

let self = module.exports = {
  escape: str => SqlString.escape(str),
  rawSql: query => self.safeQuery(query),
  find: (tableName, find) => self.safeQuery(`Select * from ${tableName} ${getWhere(find)}`),
  fuzzyFind: (tableName, find) => self.safeQuery(`Select * from ${tableName} ${getWhere(find, true)}`),
  findOne: async (tableName, find) => {
    const results = await self.safeQuery(`Select * from ${tableName} ${getWhere(find)} limit 1`)
    if (results && results[0]) return results[0]
    else return null
  },
  insert: (tableName, obj) => {
    const keys = Object.keys(obj)
    const values = keys.map(key => obj[key]) // Object.values doesn't work in node
    const query = `Insert into ${tableName} (${keys.join(', ')}) values (${values.map(value => self.escape(value)).join(', ')})`
    return self.safeQuery(query)
  },
  insertArray: (tablename, array) => {
    const keys = Object.keys(array[0])
    array = array.map(rec => {
      const values = keys.map(key => rec[key])
      return `(${values.map(value => self.escape(value)).join(', ')})`
    })
    const sql = `Insert into ${tablename} (${keys.join(', ')}) values ${array.join(',')}`
    return self.safeQuery(sql)
  },
  update: (tableName, obj, find) => {
    const keys = Object.keys(obj)
    const updates = keys.map(key => `${key}=${self.escape(obj[key])}`).join(',')
    const query = `Update ${tableName} set ${updates} ${getWhere(find)}`
    return self.safeQuery(query)
  },
  upsert: async (tableName, obj, find) => {
    if (await self.findOne(tableName, find)) return self.update(tableName, obj, find)
    else return self.insert(tableName, obj)
  },
  delete: (tableName, find) => self.safeQuery(`delete from ${tableName} ${getWhere(find)}`),
  sqlDateFormat: (date = false) => {
    if (date) return moment(date).format('YYYY-MM-DD HH:mm:ss')
    else return moment().format('YYYY-MM-DD HH:mm:ss')
  },
  uiDobFormat: date => moment(date).format('DD/MM/YYYY'),
  uiDateFormat: date => moment(date).format('MMMM Do YYYY, h:mm'),
  slaDateFormat: date => moment(date).format('DD/MM/YYYY HH:mm'),
  uiDatePickerFormat: date => moment(date).format('YYYY-MM-DD'),
  updateDb: async (tableData) => {
    try {
      const tableExists = await self.findOne('INFORMATION_SCHEMA.TABLES', { table_name: tableData.name, table_schema: process.env.API_DB_NAME })
      // if the table exists lets check for new columns
      if (tableExists) {
        let existingColumns = await self.rawSql(`show columns from ${tableData.name}`)
        // filter to only new columns
        tableData.columns = tableData.columns.filter(column => !existingColumns.find(existingField => existingField.Field === column.name))
        // add new columns
        if (tableData.columns.length) {
          const formattedFields = tableData.columns.map(column => `ADD \`${column.name}\` ${column.type}`).join(', ')
          await self.rawSql(`ALTER TABLE ${tableData.name} ${formattedFields}`)
          console.log(`TABLE ${tableData.name} UPDATED WITH FIELDS ${tableData.columns.map(column => column.name).join(', ')}`)
        }
      } else {
        const formattedFields = tableData.columns.map(column => `\`${column.name}\` ${column.type}`).join(', ')
        const primaryKey = tableData.primary ? `, PRIMARY KEY (${tableData.primary})` : ''
        await self.rawSql(`CREATE TABLE ${tableData.name} (${formattedFields}${primaryKey})`)
        // if there is any mandatory default data defined lets add that to the db
        if (tableData.defaultData) {
          for (let query of tableData.defaultData) await _db.rawSql(query)
        }
        console.log(`TABLE ${tableData.name} CREATED`)
      }
    } catch (err) {
      console.error(err)
      process.exit(1)
    }
  },
  sproc: async (sproc, param, nestTables = false, isNumeric = false) => {
    try {
      const connection = await pool.getConnection()
      // if there is only 1 param we need to wrap it in quotes if it is not numeric, otherwise the join will do it for us.
      const query = `CALL ${sproc}(${isNumeric ? param : self.escape(param)})`
      // the sproc will return results and meta of the query, we dont need the meta
      const [results] = nestTables ? await connection.query({ sql: query, nestTables: true }) : await connection.query(query)
      await connection.release()
      return results
    } catch (err) {
      const supportId = uuidv4()
      const timestamp = new Date()
      console.error(`${timestamp} ${supportId} DATABASE ERROR:`)
      console.error(err)
      return { error: true, message: `There was a problem with your database operation. Please quote this support ID ${supportId}` }
    }
  },
  safeQuery: async query => {
    try {
      const connection = await pool.getConnection()
      const results = await connection.query(query)
      await connection.release()
      return results
    } catch (err) {
      const supportId = uuidv4()
      const timestamp = new Date()
      console.error(`${timestamp} ${supportId} DATABASE ERROR:`)
      console.error(err)
      return { error: true, message: `There was a problem with your database operation. Please quote this support ID ${supportId}` }
    }
  }
}

// construct where clause
function getWhere (find, fuzzy = false) {
  find = find || {}
  let wheres = []
  for (let key in find) {
    if (find[key] === null) wheres.push(`(${key} is null)`)
    else if (find[key] === 'notnull') wheres.push(`(${key} is not null)`)
    else if (fuzzy) wheres.push(`(${key} LIKE ${self.escape(`%${find[key]}%`)})`)
    else wheres.push(`(${key}=${self.escape(find[key])})`)
  }
  if (wheres.length) return ' where ' + wheres.join(' and ')
  return ''
}
