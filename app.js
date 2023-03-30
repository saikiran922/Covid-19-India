const express = require("express");
const path = require("path");

const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();

const dbPath = path.join(__dirname, "covid19India.db");
app.use(express.json());

let db = null;

const initializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("Server Running at http://localhost:3000/");
    });
  } catch (e) {
    console.log(`DB Error:${e.message}`);
    process.exit(1);
  }
};

initializeDbAndServer();

//API1

const displayEachStatePropertyValues = (eachState) => {
  return {
    stateId: eachState.state_id,
    stateName: eachState.state_name,
    population: eachState.population,
  };
};

app.get("/states/", async (request, response) => {
  const getStateQuery = `
    SELECT *
    FROM state;`;
  const getStateQueryResponse = await db.all(getStateQuery);
  response.send(
    getStateQueryResponse.map((eachState) =>
      displayEachStatePropertyValues(eachState)
    )
  );
});

//API 2
const stateDetailsBasedOnStateId = (eachObject) => {
  return {
    stateId: eachObject.state_id,
    stateName: eachObject.state_name,
    population: eachObject.population,
  };
};

app.get("/states/:stateId/", async (request, response) => {
  const { stateId } = request.params;
  const getStateDetailsQuery = `
    SELECT *
    FROM state
    WHERE state_id = ${stateId};`;
  const getStateResponse = await db.get(getStateDetailsQuery);
  response.send(stateDetailsBasedOnStateId(getStateResponse));
});

//API 3

app.post("/districts/", async (request, response) => {
  // const {districtId} = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const postDistrictQuery = `
    INSERT INTO district
        (district_name,state_id,cases,cured,active,deaths)
    VALUES('${districtName}',${stateId},${cases},${cured},${active},${deaths});`;
  const postDistrictQueryResponse = await db.run(postDistrictQuery);
  response.send("District Successfully Added");
});

//API 4

const DistrictQueryDetails = (districtResponse) => {
  return {
    districtId: districtResponse.district_id,
    districtName: districtResponse.district_name,
    stateId: districtResponse.state_id,
    cases: districtResponse.cases,
    cured: districtResponse.cured,
    active: districtResponse.active,
    deaths: districtResponse.deaths,
  };
};

app.get("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictQuery = `
    SELECT *
    FROM district
    WHERE district_id = ${districtId};`;
  const getDistrictQueryResponse = await db.get(getDistrictQuery);
  response.send(DistrictQueryDetails(getDistrictQueryResponse));
});

//API 5
app.delete("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const deleteDistrictQuery = `
    DELETE FROM district
    WHERE district_id = ${districtId};`;
  const deleteDistrictQueryResponse = await db.run(deleteDistrictQuery);
  response.send("District Removed");
});

//API 6

app.put("/districts/:districtId/", async (request, response) => {
  const { districtId } = request.params;
  const { districtName, stateId, cases, cured, active, deaths } = request.body;
  const updateDistrictQuery = `
    UPDATE district
    SET district_name='${districtName}',
        state_id = ${stateId},
        cases = ${cases},
        cured = ${cured},
        active = ${active},
        deaths = ${deaths}
    WHERE district_id = ${districtId};`;
  const updateDistinctQueryResponse = await db.run(updateDistrictQuery);
  response.send("District Details Updated");
});

//API 7

app.get("/states/:stateId/stats/", async (request, response) => {
  const { stateId } = request.params;
  const getStateTotalDataQuery = `
    SELECT 
        sum(cases) as totalCases,
        sum(cured) as totalCured,
        sum(active) as totalActive,
        sum(deaths) as totalDeaths from district
    WHERE state_id = ${stateId};`;
  const getStateTotalDataQueryResponse = await db.get(getStateTotalDataQuery);
  response.send(getStateTotalDataQueryResponse);
});

//API 8

app.get("/districts/:districtId/details/", async (request, response) => {
  const { districtId } = request.params;
  const getDistrictIdQuery = `
    SELECT state_id
    FROM district
    WHERE district_id = ${districtId};`;
  const getDistrictIdQueryResponse = await db.get(getDistrictIdQuery);
  const getStateNameQuery = `
  SELECT state_name as stateName FROM state
  WHERE state_id = ${getDistrictIdQueryResponse.state_id};`;
  const getStateNameQueryResponse = await db.get(getStateNameQuery);
  response.send(getStateNameQueryResponse);
});

module.exports = app;
