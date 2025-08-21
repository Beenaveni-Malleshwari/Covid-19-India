const express = require('express')
const app = express()
const { open } = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const dbPath = path.join(__dirname, 'covid19India.db')
let db = null

// Initialize Database and Server
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (e) {
    console.log(`DB Error: ${e.message}`)
    process.exit(1)
  }
}
initializeDBAndServer()

app.use(express.json())

// API 1: Get all states
app.get('/states/', async (request, response) => {
  const getStatesQuery = `
    SELECT * FROM state;`
  const statesArray = await db.all(getStatesQuery)
  response.send(
    statesArray.map(each => ({
      stateId: each.state_id,
      stateName: each.state_name,
      population: each.population,
    }))
  )
})

// API 2: Get a state by ID
app.get('/states/:stateId/', async (request, response) => {
  const { stateId } = request.params
  const getStateQuery = `
    SELECT * FROM state WHERE state_id = ?;`
  const state = await db.get(getStateQuery, [stateId])
  response.send({
    stateId: state.state_id,
    stateName: state.state_name,
    population: state.population,
  })
})

// API 3: Add a new district
app.post('/districts/', async (request, response) => {
  const { districtName, stateId, cases, cured, active, deaths } = request.body
  const addDistrictQuery = `
    INSERT INTO district (district_name, state_id, cases, cured, active, deaths)
    VALUES (?, ?, ?, ?, ?, ?);`
  await db.run(addDistrictQuery, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
  ])
  response.send('District Successfully Added')
})

// API 4: Get a district by ID
app.get('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params
  const getDistrictQuery = `
    SELECT * FROM district WHERE district_id = ?;`
  const district = await db.get(getDistrictQuery, [districtId])
  response.send({
    districtId: district.district_id,
    districtName: district.district_name,
    stateId: district.state_id,
    cases: district.cases,
    cured: district.cured,
    active: district.active,
    deaths: district.deaths,
  })
})

// API 5: Delete a district
app.delete('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params
  const deleteDistrictQuery = `
    DELETE FROM district WHERE district_id = ?;`
  await db.run(deleteDistrictQuery, [districtId])
  response.send('District Removed')
})

// API 6: Update a district
app.put('/districts/:districtId/', async (request, response) => {
  const { districtId } = request.params
  const { districtName, stateId, cases, cured, active, deaths } = request.body
  const updateDistrictQuery = `
    UPDATE district
    SET district_name = ?, state_id = ?, cases = ?, cured = ?, active = ?, deaths = ?
    WHERE district_id = ?;`
  await db.run(updateDistrictQuery, [
    districtName,
    stateId,
    cases,
    cured,
    active,
    deaths,
    districtId,
  ])
  response.send('District Details Updated')
})

// API 7: Get stats of a state
app.get('/states/:stateId/stats/', async (request, response) => {
  const { stateId } = request.params
  const getStatsQuery = `
    SELECT SUM(cases) as totalCases,
           SUM(cured) as totalCured,
           SUM(active) as totalActive,
           SUM(deaths) as totalDeaths
    FROM district WHERE state_id = ?;`
  const stats = await db.get(getStatsQuery, [stateId])
  response.send(stats)
})

// API 8: Get state name by district ID
app.get('/districts/:districtId/details/', async (request, response) => {
  const { districtId } = request.params
  const getStateQuery = `
    SELECT state.state_name as stateName
    FROM district INNER JOIN state
    ON district.state_id = state.state_id
    WHERE district.district_id = ?;`
  const state = await db.get(getStateQuery, [districtId])
  response.send(state)
})

module.exports = app
